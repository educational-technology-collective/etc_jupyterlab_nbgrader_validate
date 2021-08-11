import json
import subprocess
import tornado

from os.path import join, expanduser

from jupyter_server.base.handlers import APIHandler
from jupyter_server.utils import url_path_join


class RouteHandler(APIHandler):

    @property
    def notebook_dir(self):
        return self.settings['server_root_dir']

    def validate(self, notebook_path):
        fullpath = expanduser(join(self.notebook_dir, notebook_path))
        full_output = subprocess.run(["nbgrader", "validate", fullpath], capture_output=True)
        output = full_output.stdout.decode(encoding='UTF-8')
        return output
        
    # The following decorator should be present on all verb methods (head, get, post,
    # patch, put, delete, options) to ensure only authorized user can request the
    # Jupyter server
    @tornado.web.authenticated
    def post(self):
        input_data = self.get_json_body()
        output = self.validate(input_data["name"])
        data = {"output": "{}".format(output)}
        self.finish(json.dumps(data))

def setup_handlers(web_app):
    host_pattern = ".*$"

    base_url = web_app.settings["base_url"]
    route_pattern = url_path_join(base_url, "jupyterlab-nbgrader-validate", "validate")
    handlers = [(route_pattern, RouteHandler)]
    web_app.add_handlers(host_pattern, handlers)
