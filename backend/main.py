from fastapi import FastAPI, HTTPException, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import os
import re
import json
import shutil
import yaml
import docker
import asyncio
from sse_starlette.sse import EventSourceResponse
import logging
import subprocess
import re

from storage import storage
log_format = "%(asctime)s - %(name)s - %(levelname)s - %(message)s"
logging.basicConfig(level=logging.DEBUG)

logger = logging.getLogger(__name__)

handler = logging.StreamHandler()

handler.setFormatter(logging.Formatter(log_format))

logger.addHandler(handler)

# dockerClient = docker.from_env()

# Used for internal communication
DEFAULT_REGISTRY = os.getenv("DEFAULT_REGISTRY", "localhost:5000") + "/"
# Used for the reference that is returned to the end user
DEFAULT_REGISTRY_USERNAME = os.getenv("DEFAULT_REGISTRY_USERNAME", "")
DEFAULT_REGISTRY_PASSWORD = os.getenv("DEFAULT_REGISTRY_PASSWORD", "")

DOCKER_HOST = os.getenv("DOCKER_HOST", "unix://var/run/docker.sock")

app = FastAPI()

# Variable to store docker build/push generator
# So it can be consumed by the "status" endpoint
app.state.liveDockerOutput = None

app.include_router(storage.router, prefix="/clt")


# TODO This is only needed for development
ALLOWED_ORIGINS = ["http://localhost:8080", "http://127.0.0.1:8080"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class ApplicationVersion(BaseModel):
    version: str
    locked: bool
    lastModified: int


class ApplicationCWL(BaseModel):
    cwl: str
    version: str
    locked: bool
    lastModified: int


class CWL(BaseModel):
    cwl: str


class BuildData(BaseModel):
    mainDependency: str
    softwareDependency: list
    repositoryType: str
    repositoryAddress: str
    imageTag: str
    identifier: str
    cwl: str | None = None


# Read the dependency map from file.
buildOptions = {}
# In k8s this will be mounted through a ConfigMap so we can reconfigure them
with open("./dependencyMap.yaml", "r") as dependencyMap:
    # Only sent the packages to the frontend.
    buildOptions = yaml.load(dependencyMap.read())

with open("./repositories.json", "r") as repositoriesMap:
    buildOptions["repositoryTypes"] = json.loads(repositoriesMap.read())


@app.post("/upload")
def upload(file: UploadFile = File(...)):
    try:
        file_path = os.path.join("docker/uploaded_files", file.filename)
        with open(file_path, 'wb') as f:
            shutil.copyfileobj(file.file, f)
    except Exception:
        return {"message": "There was an error uploading the file"}
    finally:
        file.file.close()

    return {"message": f"Successfully uploaded {file.filename}"}


@app.get("/status/")
async def getLiveStatus():
    async def event_generator():
        if app.state.liveDockerOutput:
            print("Live output found")
            buildPattern = r"Step (\d+)/(\d+) : (.+)"
            successPattern = r"Successfully tagged (.*)"
            with open("docker/buildlog.txt", "w") as logFile:
                try:
                    for eventData in app.state.liveDockerOutput:
                        logFile.write(formatLogEntry(eventData))
                        if "stream" in eventData:
                            match = re.match(buildPattern, eventData["stream"])
                            if match:
                                yield json.dumps({
                                    "status": "building",
                                    "step": match.group(1),
                                    "max_steps": match.group(2),
                                    "message": match.group(3)
                                })

                            successMatch = re.match(
                                successPattern, eventData["stream"])
                            if successMatch:
                                yield json.dumps({
                                    "status": "success",
                                    "message": successMatch.group(1)
                                })

                        elif "dry-run" in eventData:
                            if eventData["dry-run"] != "log-only":
                                yield json.dumps({
                                    "status": eventData["dry-run"],
                                    "message": eventData["message"]
                                })
                        elif "status" in eventData:
                            yield json.dumps({
                                "status": eventData["status"],
                                # "progress": eventData["progressDetail"]
                            })
                        elif "errorDetail" in eventData:
                            yield json.dumps({
                                "status": "failed",
                                "message": eventData["error"]

                            })
                except docker.errors.APIError as e:
                    logFile.write(formatLogEntry(e))
                    yield json.dumps({
                        "status": "failed",
                        "message": e.explanation
                    })

    # sleep for a bit to make sure the generator is initialized
    await asyncio.sleep(0.5)
    return EventSourceResponse(event_generator(), media_type="text/event-stream")


@app.get("/buildLog/")
async def buildLog():
    if os.path.exists("docker/buildlog.txt"):
        with open("docker/buildlog.txt", "r") as logFile:
            logs = logFile.readlines()
        return logs

    raise HTTPException(status_code=404, detail="No log file found")


@app.post("/buildAndPush/")
async def buildAndPush(buildData: BuildData):
    createDockerfile(buildData)
    dockerImageReference = computeDockerImgReference(
        buildData)
    dryRun = False
    cwlFilePath = "/tmp/app-dry-run.cwl"
    if buildData.cwl:
        dryRun = True
        cwl_content = populateDockerPull(buildData.cwl, dockerImageReference)

        with open(cwlFilePath, "w") as cwlFile:
            cwlFile.write(cwl_content)
    generator = buildDockerImage(
        dockerImageReference,
        push=True,
        dryRun=dryRun,
        cwlFilePath=cwlFilePath,
        registryType=buildData.repositoryType
    )
    app.state.liveDockerOutput = generator

    return {"imageReference": dockerImageReference}


@app.post("/build/")
async def build(buildData: BuildData):
    createDockerfile(buildData)
    dockerImageReference = computeDockerImgReference(
        buildData)

    dryRun = False
    cwlFilePath = "/tmp/app-dry-run.cwl"
    if buildData.cwl:
        dryRun = True
        cwl_content = populateDockerPull(buildData.cwl, dockerImageReference)

        with open(cwlFilePath, "w") as cwlFile:
            cwlFile.write(cwl_content)
    generator = buildDockerImage(
        dockerImageReference, push=False, dryRun=dryRun, cwlFilePath=cwlFilePath)
    app.state.liveDockerOutput = generator

    return {"imageReference": dockerImageReference}

def populateDockerPull(cwl, dockerImageReference):
    """
    For the dry-run we need to make sure that the `dockerPull` requirement
    in the CWL file already contains the docker image reference.
    If this is not the case, cwltool will not run the command in any container but on the host.
    """
    cwl_dict = yaml.load(cwl)
    # Check if a requirement already exists
    if "requirements" in cwl_dict["requirements"]:
        if "DockerRequirement" in cwl_dict["requirements"]:
            cwl_dict["requirements"]["DockerRequirement"]["dockerPull"] = dockerImageReference
            return yaml.dump(cwl_dict)
    
    # Add the requirement from scratch
    cwl_dict["requirements"] = {
        "DockerRequirement": {
            "dockerPull": dockerImageReference
        }
    }

    return yaml.dump(cwl_dict)


def buildDockerImage(dockerImageReference, push=False, dryRun=False, cwlFilePath=None, registryType="default"):
    dockerfilePath = "./docker/"
    cli = docker.APIClient(base_url=DOCKER_HOST)
    buildGenerator = cli.build(
        path=dockerfilePath,
        rm=True,
        tag=dockerImageReference,
        decode=True,
    )
    for line in buildGenerator:
        yield line
        if "errorDetail" in line:
            print(line)
            raise Exception(f"Build failed: {line['errorDetail']['message']}")

    print("finished build phase")

    if dryRun:
        print("starting dry run")
        yield {"dry-run": "dry-run-running", "message": "Performing dry-run with default input values..."}

        result = subprocess.run(
            ["cwltool","--disable-pull", cwlFilePath],
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True
        )

        if result.returncode != 0:
            yield {"errorDetail": "Dry-run failed", "error": cleanEscapeSequences(result.stderr)}

            raise Exception("Dry run failed.")
        else:

            yield {"dry-run": "log-only", "message": "===== STDOUT ====="}
            yield {"dry-run": "log-only", "message": cleanEscapeSequences(result.stdout)}
            yield {"dry-run": "log-only", "message": "===== STDERR ====="}
            yield {"dry-run": "log-only", "message": cleanEscapeSequences(result.stderr)}
            yield {"message": "Dry run completed successfully", "dry-run": "dry-run-success"}

    if push:
        auth_config = {}
        if registryType == "default":
            print("Using default credentials..")
            auth_config = {
                "username": DEFAULT_REGISTRY_USERNAME,
                "password": DEFAULT_REGISTRY_PASSWORD
            }

        print("push enabled, pushing now..")
        cli = docker.APIClient(base_url=DOCKER_HOST)
        pushGenerator = cli.push(
            dockerImageReference,
            stream=True,
            decode=True,
            auth_config=auth_config
        )

        for line in pushGenerator:
            yield line


@app.post("/clearApplicationFiles/")
async def clearApplicationFiles():
    deleteAllUploadedFiles()


@app.get("/options/")
def return_options():
    relevantBuildOptions = {
        # Drop the main dependencies and docker snippets since the frontend does not need those
        "softwareDependencies": [
            {
                "identifier": dep["identifier"],
                "label": dep["label"],
                "incompatible_with": dep.get("incompatible_with", [])
        } for dep in buildOptions["softwareDependencies"]],
        "repositoryTypes": buildOptions["repositoryTypes"]
    }
    return relevantBuildOptions

def parentImageHasConflicts(parentImage, requiredPackages):
    for package in parentImage.get("incompatible_with", []):
        if package in requiredPackages:
            return True

    return False

def findOptimalParentImage(requiredPackages):
    """
    Finds and returns the best parent docker image
    @returns mainDep identifier: the identifier of the optimal docker image
    @returns missingPackages: list of packages which still need to be installed
    """

    # Fetch the full definition
    fullRequiredPackages = [
        package for package in buildOptions["softwareDependencies"] 
        if package["identifier"] in requiredPackages
    ]

    for package in fullRequiredPackages:
        for identifier in package.get("incompatible_with", []):
            if identifier in requiredPackages:
                raise ValueError(f"Incompatible package: {package['label']} is incompatible with {identifier}")

    bestMatch = None
    presentPackages = 0
    for mainDep in buildOptions["mainDependencies"]:
        # Check if one of the required packages is in the incompatible list
        if parentImageHasConflicts(mainDep, requiredPackages):
            continue

        count = 0
        # Check how many dependencies are already present in this image
        for presentPackage in mainDep.get("includes", []):
            if presentPackage in requiredPackages:
                count += 1

        if count > presentPackages:
            bestMatch = mainDep
            presentPackages = count
        # If they have the same amount of packages installed, pick the one with less includes
        # This will prefer smaller docker images (in theory but this might be a bit arbitrary)
        if count !=0 and count == presentPackages:
            if len(bestMatch["includes"]) > len(mainDep["includes"]):
                bestMatch = mainDep
                presentPackages = count

    if bestMatch:
        missingPackages = [
            package for package in requiredPackages
            if package not in bestMatch.get("includes", [])
        ]
        return bestMatch["image"], missingPackages

    print("No optimal parent image found. Defaulting to first item")
    return buildOptions["mainDependencies"][0]["image"], requiredPackages

def createDockerfile(buildData):
    print(f"Build data: {buildData}")
    parentImage, missingPackages = findOptimalParentImage(buildData.softwareDependency)
    snippets = [pkg["snippet"] for pkg in buildOptions["softwareDependencies"] if pkg["identifier"] in missingPackages]
    with open("docker/Dockerfile", "w") as dockerFile:
        dockerFile.write(f"FROM {parentImage}\n\n")
        dockerFile.write("# Start of snippets\n\n")
        for snippet in snippets:
            dockerFile.write(f"{snippet}\n")
        dockerFile.write("# End of snippets\n\n")
        dockerFile.write("# Copy the relevant files into the image\n")
        dockerFile.write("WORKDIR /app\n")
        dockerFile.write("ENV PATH=$PATH:/app/\n")
        # Only attempt to copy if any files were uploaded
        if len(os.listdir("docker/uploaded_files/")) != 0:
            dockerFile.write("ADD ./uploaded_files/* /app/\n\n")
        if os.path.isfile("docker/uploaded_files/requirements.txt"):
            dockerFile.write(
                "# Optional PIP install (if the uploaded files contained a requirements.txt)\n")
            dockerFile.write("RUN pip install -r requirements.txt\n\n")

def computeDockerImgReference(buildData):
    dockerImageReference = ""  # Returned to the user
    if buildData.repositoryType == "default":
        if buildData.imageTag == "":
            dockerImageReference = DEFAULT_REGISTRY + buildData.identifier + ":latest"
        else:
            dockerImageReference = DEFAULT_REGISTRY + \
                buildData.identifier + ":" + buildData.imageTag
    else:
        if buildData.imageTag == "":
            dockerImageReference = buildData.repositoryAddress + \
                "/" + buildData.identifier + ":latest"
        else:
            dockerImageReference = buildData.repositoryAddress + \
                "/" + buildData.identifier + ":" + buildData.imageTag

    # need to lower for it to be docker compliant
    return dockerImageReference.lower()

def deleteAllUploadedFiles():
    print("Deleting all uploaded files")
    dir = './docker/uploaded_files'
    for f in os.listdir(dir):
        os.remove(os.path.join(dir, f))

def cleanEscapeSequences(string):
    escape_seq_pattern = r'\x1b\[([0-9]{1,2}(;[0-9]{1,2})*)?[m|K]'
    return re.sub(escape_seq_pattern, '', string)

def formatLogEntry(messageDict):
    try:
        if "stream" in messageDict:
            # Check if the line is an empty newline
            if messageDict['stream'].strip() != "":
                return f"INFO: {cleanEscapeSequences(messageDict['stream']).strip()}\n"
        if "aux" in messageDict:
            return f"INFO: {cleanEscapeSequences(messageDict['aux'])}"
        if "status" in messageDict:
            return f"STATUS: {cleanEscapeSequences(messageDict['status'])}\n"
        if "errorDetail" in messageDict:
            return f"ERROR: {cleanEscapeSequences(messageDict['error'])}"
        if "dry-run" in messageDict:
            return f"DRY-RUN: {cleanEscapeSequences(messageDict['message'])}\n"
        return ""
    except TypeError as e:
        print(e.__dict__)
        return ""
