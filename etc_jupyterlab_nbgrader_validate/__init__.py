import json
from pathlib import Path

from ._version import __version__
import subprocess

# Disable nbgrader validate extension
subprocess.run(["jupyter", "labextension", "lock", "nbgrader:validate-assignment"], capture_output=True)

HERE = Path(__file__).parent.resolve()

def _jupyter_labextension_paths():
    return [{
        "src": "labextension",
        "dest": "@educational-technology-collective/etc_jupyterlab_nbgrader_validate"
    }]

from .handlers import setup_handlers


def _jupyter_server_extension_points():
    return [{
        "module": "etc_jupyterlab_nbgrader_validate"
    }]



def _load_jupyter_server_extension(server_app):
    """Registers the API handler to receive HTTP requests from the frontend extension.

    Parameters
    ----------
    server_app: jupyterlab.labapp.LabApp
        JupyterLab application instance
    """
    setup_handlers(server_app.web_app)
    server_app.log.info("Registered JLab NBgrader validate extension at URL path /jupyterlab-nbgrader-validate")

# For backward compatibility with notebook server - useful for Binder/JupyterHub
load_jupyter_server_extension = _load_jupyter_server_extension
