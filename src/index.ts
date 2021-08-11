import {
  JupyterFrontEnd,
  JupyterFrontEndPlugin
} from '@jupyterlab/application';

import { ISettingRegistry } from '@jupyterlab/settingregistry';

import { requestAPI } from './handler';

/**
 * Initialization data for the @educational-technology-collective/etc_jupyterlab_nbgrader_validate extension.
 */
const plugin: JupyterFrontEndPlugin<void> = {
  id: '@educational-technology-collective/etc_jupyterlab_nbgrader_validate:plugin',
  autoStart: true,
  optional: [ISettingRegistry],
  activate: (app: JupyterFrontEnd, settingRegistry: ISettingRegistry | null) => {
    console.log('JupyterLab extension @educational-technology-collective/etc_jupyterlab_nbgrader_validate is activated!');

    if (settingRegistry) {
      settingRegistry
        .load(plugin.id)
        .then(settings => {
          console.log('@educational-technology-collective/etc_jupyterlab_nbgrader_validate settings loaded:', settings.composite);
        })
        .catch(reason => {
          console.error('Failed to load settings for @educational-technology-collective/etc_jupyterlab_nbgrader_validate.', reason);
        });
    }

    requestAPI<any>('get_example')
      .then(data => {
        console.log(data);
      })
      .catch(reason => {
        console.error(
          `The etc_jupyterlab_nbgrader_validate server extension appears to be missing.\n${reason}`
        );
      });
  }
};

export default plugin;
