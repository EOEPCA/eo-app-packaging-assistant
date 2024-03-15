# EOEPCA application import tool

This tool allows application developers to easily package their code
into a docker image and generate an associated CWL CommandLineTool snippet. 
This allows the application to be executed by a CWL compliant runner, such as the EOEPCA ADES.

## Design of the tool

The tool consists of a front-end user interface accompanied by a backend service. 


### Front-end

The frontend consists of 4 main parts:
- Command Line Tool
- Application Files
- Build options
- Build/Output section

#### **Command Line Tool section**

In this section the application developer can provide information about the application.
This includes vital information such as the `Base command` which is used to run the application,
along with the `arguments` and `inputs`. The `outputs` are also defined in this section.

The section also allows for more information to be provided, such as identifier (which is required since it is used in the docker image tag),
label and description.

Specific `requirements` can also be provided, but this is usually not needed for most applications.

#### **Application Files section**

In this section the application developer can provide the script files for their application. 
This can include `.py` files or bash scripts. The developer can also upload a `requirements.txt` file
which contains the packages their application requires. If this file is present, the backend will install all of the listed packages.

These files are copied into the image under the `/app/` path. This is important to consider when invoking custom scripts.
When the developer uploads a Python `my_script.py` file, it thus has to be run using `python /app/my_script.py` explicitly. 
This is due to how CWL runners generate a temporary directory to perform the processing.
This breaks relative links to files so they must be provided as absolute paths.  

#### **Build Options section**

This section allows the developer to select options related to the docker image build.

The first section allows the developer to indicate which software packages their application requires.
The list of available packages is defined in the backend configuration.
Conflicts between selected and available packages will be greyed out in the interface.

The desired repository can be selected, alongside the image tag. This is used to build the docker reference.
This determines in which repository/registry the built docker image will be pushed.

#### **Build Output section**

This section contains the buttons to start the build process. The Dry Run will only run the build step. 
This allows the developer to see if the docker image can be build properly with the provided settings and files. The Build and Push button will perform the build step, and push the resulting image in the selected repository when the build is finished.

When the developer provides default values for all mandatory inputs, they can check the "Perform a test run with default values" checkbox. Enabling this option will tell the backend to run the generated CWL snippet with the default input values after the building step succeeds. 

The application developer can view the live output of the build/dry-run/push process by clicking the "show live output" button. This will update in real-time when new information is available.

When the build is complete the developer can view the detailed build log by clicking the "Show detailed logs" button.

The resulting CWL Command Line Tool snippet is displayed underneath the build output. If the build is successful and the image is pushed into the selected repository, then this snippet is ready to be used.
This can be done as a standalone CWL application or it can be integrated as a step of a bigger CWL Workflow.

### Backend

The backend service is responsible for providing the front-end with the data it needs, 
such as the available packages a user can select from, or the available docker registries.

It also provides the endpoint to start the building and pushing process. 

The backend is build using FastAPI. It uses the Python Docker SDK package as its docker API client for the building and pushing tasks. The dry-run is performed using the cwltool package. This is the Python reference implementation for the CWL specification.

The docker builds are done in a separate docker-in-docker (`dind`) image. 

## Configuration

The backend needs to be configured with a list of available parent images and additional software packages. 
A parent image record could look like this:
```yaml
mainDependencies:
- identifier: python-with-gdal-snap
  image: my.custom.repository/python3.11:snap-gdal
  includes: ['snap', 'gdal']
  incompatible_with: ['flask']
```
The image must be a valid reference to the docker image.
The `includes` property must contain packages that are already installed in the docker image. 
When the developer selects packages required for their application, the backend will check this list to find the most suitable image. This means that it will search for the image with the most pre-installed packages, and no conflicts (using the `incompatible_with` list).

Packages themselves can be defined as follows:
```yaml
softwareDependencies:
- identifier: snap
  label: SNAP
  snippet: RUN apt-get install snap -y 
  incompatible_with: []
```
These records are similar to the parent image ones, but they include a `label` property because they are displayed in the user interface. Additionally, they contain a `snippet` property. This snippet will be added to the Dockerfile if the package needs to be installed.

## Test cases

We describe a test scenario to indicate how the tool might be used to import a sample application.

### 1. Enter the details for the application

**Input**: Provide some details about the application and how to run it. Provide "numpy-test" as the identifier, `python` as the BaseCommand and `/app/numpy.py` as argument. The actual script itself will be uploaded in the next step.
Add an integer input using the "add input" button. A form will open. Enter an identifier, select `int` as the `Type` and provide a default value of `5`. Click "add".

**Output**: The "CWL snippet" section on the right side of the page should contain something like this:
```yaml
cwlVersion: v1.0
id: numpy-test
class: CommandLineTool
baseCommand:
  - python
arguments:
  - /app/numpy.py
inputs:
  - id: input-1
    default: 5
    type: int
    inputBinding: {}
```

### 2. Upload the required files

**Input**: Click the "Application Files" tab to display the file upload field. Create a file `numpy.py` with the following contents:
```python
# this package will be installed through a requirements.txt file
import numpy as np

# this package will be installed as a software package through the build options interface.
from flask import Flask

import sys

print("Testing Numpy Container")
amount = sys.argv[1]
print(f"Found amount {amount}")
data = np.zeros(int(amount))

print(data)
```
Additionally, create a `requirements.txt` file with the following contents:
```
numpy==1.24.4
```
Drag both files to the dropzone to upload them to the backend.

**Output**: Both files are marked as succesfully uploaded to the backend.

### 3. Select the build options

**Input**: In the "software dependencies" section, select "flask" from the dropdown list.
In the "Repository" section, select the "Default Service Repository". 

### 4. Start the build process
**Input**: Check the "Perform a test run with default values" checkbox and press "Build (Dry Run)". Optionally, you can click the "Show live output" to see the current stage of the build. 

**Output**: The backend will build the image. The live output is displayed in the interface. After a succesfull dry-run, the detailed logs can be displayed using the "show detailed logs" button.

### 5. Validation of the dry-run
**Input**: Open the detailed logs by clicking the "show detailed logs".
**Output**: The detailed logs show the succesfull build output and the output from the dry run:
```log
...
INFO: Successfully built d1dd2ac33f91
INFO: Successfully tagged localhost:5000/numpy-test:latest
DRY-RUN: Performing dry-run with default input values...
DRY-RUN: ===== STDOUT =====
DRY-RUN: {}
DRY-RUN: ===== STDERR =====
DRY-RUN: INFO /home/jla/Documents/EOEPCA/application-import-tool/backend/venv/bin/cwltool 3.1.20240112164112
INFO Resolved '/tmp/app-dry-run.cwl' to 'file:///tmp/app-dry-run.cwl'
INFO [job numpy-test] /tmp/r90mgo_1$ docker \
    run \
    -i \
    --mount=type=bind,source=/tmp/r90mgo_1,target=/uisZiY \
    --mount=type=bind,source=/tmp/tvoxbcy5,target=/tmp \
    --workdir=/uisZiY \
    --read-only=true \
    --user=1000:1000 \
    --rm \
    --cidfile=/tmp/11lx5dn8/20240312120655-832392.cid \
    --env=TMPDIR=/tmp \
    --env=HOME=/uisZiY \
    localhost:5000/numpy-test:latest \
    python \
    /app/numpy-test.py \
    5
Testing Numpy Container
Found amount 5
[0. 0. 0. 0. 0.]
INFO [job numpy-test] Max memory used: 9MiB
INFO [job numpy-test] completed success
INFO Final process status is success

DRY-RUN: Dry run completed successfully
```

A succesfull dry-run means that the script was run correctly. This means that the correct packages were installed in a compatible docker image and the inputs were passed to the application properly.
