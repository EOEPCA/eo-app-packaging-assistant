# build stage
FROM node:14-buster as build-stage
WORKDIR /app
COPY frontend/package*.json frontend/yarn.lock ./
RUN yarn install
COPY frontend ./
RUN yarn run build

# production stage
FROM python:3.12-rc-slim-bullseye as production-stage
RUN apt-get -y update && apt-get -y install nginx supervisor curl
# RUN curl https://sh.rustup.rs -sSf | sh -s -- -y
COPY backend/ /app/backend/
WORKDIR /app/backend/

RUN mkdir -p docker/uploaded_files
RUN mkdir -p files

RUN pip install -r requirements.txt

COPY server.conf /etc/nginx/sites-available/default
COPY --from=build-stage /app/dist /usr/share/nginx/html

COPY supervisord.conf /etc/supervisor/supervisord.conf

ARG PUID=2000
ARG PGID=2000

RUN apt-get update
RUN apt-get upgrade -y

# Needed by cwltool to perform a dry-run
RUN apt-get install -y docker.io 

RUN addgroup --gid ${PGID} app-import-tool && \
    adduser --system --uid ${PUID} --gid ${PGID} app-import-tool && \
    chown -R app-import-tool:app-import-tool /app

EXPOSE 80

CMD ["supervisord"]
