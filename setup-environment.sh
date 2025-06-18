conda create -n auspex-ext --override-channels --strict-channel-priority -c conda-forge -c nodefaults jupyterlab=4 nodejs=20 git copier=9 jinja2-time

conda activate auspex-ext

pip install -ve .

jupyter labextension develop --overwrite .

# Install dependencies
jlpm install

# Build the extension
jlpm build