FROM python:3.11-slim-bookworm

WORKDIR /app

ENV PIP_DISABLE_PIP_VERSION_CHECK=1 \
    PIP_NO_CACHE_DIR=1

# Copy the whole API so editable install can see the package
COPY . /app

RUN ["pip", "install", "--upgrade", "pip"]
RUN ["pip", "install", "-e", "."]

# Runtime command comes from docker-compose
