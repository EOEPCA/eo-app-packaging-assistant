from calendar import IllegalMonthError
from fastapi import FastAPI, HTTPException, Request, APIRouter
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
from typing import List
from pydantic import BaseModel
import os
import shutil

app = FastAPI()

router = APIRouter()


FILE_SYSTEM_BASE_PATH = os.path.join(os.getenv("STORAGE_FILES_DIRECTORY", os.getcwd()), "files/")

ILLEGAL_SYMBOLS = [":", "/", "|", "\\", "__locked", ";", ","]


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


@router.get("/")
async def list_application_packages() -> List[str]:
    clt_slugs = [
        f.path[len(FILE_SYSTEM_BASE_PATH) :]  # Splice to remove BASE_PATH
        for f in os.scandir(FILE_SYSTEM_BASE_PATH)
        if f.is_dir()
    ]
    return clt_slugs


@router.get("/{clt_slug}/versions/")
async def list_application_package_versions(clt_slug: str) -> List[ApplicationVersion]:
    clt_path = os.path.join(FILE_SYSTEM_BASE_PATH, clt_slug)
    if os.path.isdir(clt_path):
        versions = [f.path for f in os.scandir(clt_path)]  # Splice to remove BASE_PATH
        print(versions)
        version_list = []
        for v in versions:
            locked = False
            if v.endswith("__locked.cwl"):
                v_slug = v[:-12]
                locked = True
            else:
                v_slug = v[:-4]
            version_list.append(
                {
                    "version": v_slug[len(clt_path) + 1 :],
                    "locked": locked,
                    "lastModified": os.path.getmtime(v),
                }
            )

        return version_list
    raise HTTPException(
        status_code=404, detail="Command Line Tool with given slug not found"
    )


@router.get("/{clt_slug}/versions/{version_slug}/")
async def get_application_package_version(
    clt_slug: str, version_slug: str
) -> ApplicationCWL:
    ap_version_path = os.path.join(FILE_SYSTEM_BASE_PATH, clt_slug, version_slug)
    # Check if an unlocked or locked version exist
    if os.path.exists(ap_version_path + ".cwl"):
        with open(ap_version_path + ".cwl", "r") as cwl_file:
            cwl = cwl_file.read()
            return {
                "cwl": cwl,
                "version": version_slug,
                "locked": False,
                "lastModified": os.path.getmtime(ap_version_path + ".cwl"),
            }
    if os.path.exists(ap_version_path + "__locked.cwl"):
        with open(ap_version_path + "__locked.cwl", "r") as cwl_file:
            cwl = cwl_file.read()
            return {
                "cwl": cwl,
                "version": version_slug,
                "locked": True,
                "lastModified": os.path.getmtime(ap_version_path + "__locked.cwl"),
            }
    raise HTTPException(
        status_code=404,
        detail="Command Line Tool with given slug and version not found",
    )


@router.put("/{clt_slug}/versions/{version_slug}/", status_code=201)
async def create_or_update_application_package_version(
    clt_slug: str, version_slug: str, cwl: CWL
):
    clt_path = os.path.join(FILE_SYSTEM_BASE_PATH, clt_slug)
    cwl_path = os.path.join(clt_path, version_slug)
    print(f"Path for new file: {cwl_path}")

    for symbol in ILLEGAL_SYMBOLS:
        if symbol in clt_slug or symbol in version_slug:
            raise HTTPException(
                status_code=400, detail=f"Command Line Tool slug or version slug cannot contain special symbols."
            )

    # check if locked version exists
    if os.path.exists(cwl_path + "__locked.cwl"):
        raise HTTPException(
            status_code=400, detail="This version is locked and cannot be updated."
        )

    # Create directory if it does not yet exist
    if not os.path.isdir(clt_path):
        os.mkdir(clt_path)

    # Write it to disk
    with open(cwl_path + ".cwl", "w") as cwl_file:
        cwl_file.write(cwl.cwl)


@router.post("/{clt_slug}/versions/{version_slug}/lock/", status_code=204)
async def lock_application_package_version(clt_slug: str, version_slug: str) -> None:
    # Check if file exists
    cwl_path = os.path.join(FILE_SYSTEM_BASE_PATH, clt_slug, version_slug)
    if os.path.exists(cwl_path + "__locked.cwl"):
        raise HTTPException(status_code=304, detail="This version is already locked.")
    if not os.path.exists(cwl_path + ".cwl"):
        raise HTTPException(status_code=404, detail="This version does not exist.")

    os.rename(cwl_path + ".cwl", cwl_path + "__locked.cwl")


@router.post("/{clt_slug}/versions/{version_slug}/unlock/", status_code=204)
async def unlock_application_package_version(clt_slug: str, version_slug: str) -> None:
    cwl_path = os.path.join(FILE_SYSTEM_BASE_PATH, clt_slug, version_slug)

    if os.path.exists(cwl_path + ".cwl"):
        raise HTTPException(status_code=304, detail="This version is not locked.")

    if not os.path.exists(cwl_path + "__locked.cwl"):
        raise HTTPException(status_code=404, detail="This version does not exist.")

    os.rename(cwl_path + "__locked.cwl", cwl_path + ".cwl")


@router.delete("/{clt_slug}/")
async def delete_application_package(clt_slug: str) -> None:
    clt_path = os.path.join(FILE_SYSTEM_BASE_PATH, clt_slug)
    if not os.path.isdir(clt_path):
        raise HTTPException(status_code=404, detail="Command Line Tool slug not found.")
    versions = [
        f.path[len(clt_path) + 1 :]  # Splice to remove BASE_PATH
        for f in os.scandir(clt_path)
    ]
    for version in versions:
        if version.endswith("__locked.cwl"):
            raise HTTPException(
                status_code=400,
                detail="Command Line Tool has locked versions and cannot be deleted.",
            )

    shutil.rmtree(clt_path)


@router.delete("/{clt_slug}/versions/{version_slug}/")
async def delete_application_package_version(clt_slug: str, version_slug: str) -> None:
    clt_path = os.path.join(FILE_SYSTEM_BASE_PATH, clt_slug)
    cwl_path = os.path.join(clt_path, version_slug)
    if os.path.exists(cwl_path + "__locked.cwl"):
        raise HTTPException(
            status_code=400, detail="You cannot delete a locked version."
        )
    if os.path.exists(cwl_path + ".cwl"):
        os.remove(cwl_path + ".cwl")
        if len(os.listdir(clt_path)) == 0:
            os.rmdir(clt_path)
    else:
        raise HTTPException(status_code=404, detail="This version does not exist.")
