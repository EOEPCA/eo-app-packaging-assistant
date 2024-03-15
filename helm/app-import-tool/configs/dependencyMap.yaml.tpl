mainDependencies:
- identifier: python:3.11-buster
  image: python:3.11-buster
  includes: []
  incompatible_with: []
  label: Python:3.11-buster
- identifier: python:3.11-slim-buster
  image: python:3.11-slim-buster
  includes: []
  incompatible_with: []
  label: Python:3.11-slim-buster
- identifier: python:alpine
  image: python:alpine
  includes: []
  incompatible_with: []
  label: Python:alpine
softwareDependencies:
- identifier: snap
  label: SNAP
  snippet: RUN apt-get install snap -y 
- identifier: gdal
  label: GDAL
  snippet: RUN apt-get install gdal -y 
  incompatible_with: []
- identifier: sci_tools_py
  label: scitools
  snippet: RUN apt-get install sci_tools_py -y 
- identifier: flask
  label: Flask
  snippet: RUN pip install flask 
  incompatible_with: []