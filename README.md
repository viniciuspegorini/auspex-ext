# JupyterLite Docker Setup

This repository contains a Docker setup for running JupyterLite, a lightweight version of Jupyter that runs entirely in the browser.

## Requirements

- Docker
- Docker Compose

## Getting Started

1. Clone this repository
2. Build and start the container:
   ```bash
   docker-compose up -d
   ```
3. Open your browser and navigate to:
   ```
   http://localhost:8000
   ```

## Structure

- `notebooks/` - Directory containing Jupyter notebooks
- `requirements.txt` - Python dependencies
- `Dockerfile` - Container configuration
- `docker-compose.yml` - Docker Compose configuration

## Adding New Notebooks

Place your `.ipynb` files in the `notebooks` directory. They will be automatically available in the JupyterLite interface.

## Stopping the Server

To stop the server, run:
```bash
docker-compose down
``` 

# Criando o ambiente para desenvolvimento da extensão

```bash
mamba create -n auspex-extension -c conda-forge python nodejs
```

Ativando a extensão

```bash
mamba activate auspex-extension
```

Instalando as dependências

```bash
python -m pip install -r requirements.txt
```

Para o build do jupyterlite

```bash
jupyter lite build
```

Para executar o jupyterlite

```bash
jupyter lite serve
```

Instalando os demais pacotes para o desenvolvimento da extensão

```bash
mamba install copier=9 nodejs=20
```

Instalando a extensão

```bash
pip install -ve .
```

```bash
jupyter labextension develop --overwrite .
```

Para atualizar o build da extensão
```bash
jlpm run build
```
