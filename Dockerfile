FROM python:3.10-slim

RUN apt update && apt install -y wget ca-certificates

RUN wget https://github.com/conda-forge/miniforge/releases/latest/download/Miniforge3-Linux-x86_64.sh
RUN bash Miniforge3-Linux-x86_64.sh -b

# Add conda to path and initialize for shell use
ENV PATH="/root/miniforge3/bin:${PATH}"
RUN conda init bash

# Create and activate conda environment in a single RUN to maintain the environment
RUN conda create -n jupyterlab-ext --override-channels --strict-channel-priority -c conda-forge -c nodefaults jupyterlab=4 nodejs=20 git copier=9 jinja2-time && \
    echo "conda activate jupyterlab-ext" >> ~/.bashrc

# Set default shell to bash and activate conda environment for subsequent RUN commands
SHELL ["/bin/bash", "--login", "-c"]

WORKDIR /app

COPY auspex-extension .

RUN pip install -ve .

RUN jupyter labextension develop --overwrite .

COPY notebooks ./notebooks

COPY requirements.txt .

RUN pip install -r requirements.txt

RUN jupyter lite build --contents ./notebooks

EXPOSE 8000

# Ensure we're using the conda environment when running the container
SHELL ["/bin/bash", "-c"]
CMD ["/bin/bash", "-c", "source /root/miniforge3/etc/profile.d/conda.sh && conda activate jupyterlab-ext && jupyter lite serve --port 8000 --ip 0.0.0.0"] 