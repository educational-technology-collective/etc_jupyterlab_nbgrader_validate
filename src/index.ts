import { IDisposable, DisposableDelegate } from '@lumino/disposable';
import { Widget } from '@lumino/widgets';
import { Token } from '@lumino/coreutils';
import {
  JupyterFrontEnd,
  JupyterFrontEndPlugin
} from '@jupyterlab/application';
import { showDialog, Dialog, ToolbarButton } from '@jupyterlab/apputils';
import { DocumentRegistry } from '@jupyterlab/docregistry';
import { NotebookPanel, INotebookModel } from '@jupyterlab/notebook';
import { IJupyterLabPioneer } from 'jupyterlab-pioneer';
import { requestAPI } from './handler';

const PLUGIN_ID =
  '@educational-technology-collective/etc_jupyterlab_nbgrader_validate:plugin';

export const IValidateButtonExtension = new Token<IValidateButtonExtension>(
  PLUGIN_ID
);

export interface IValidateButtonExtension {}

/**
 * A notebook widget extension that adds a button to the toolbar.
 */
export class ValidateButtonExtension
  implements
    DocumentRegistry.IWidgetExtension<NotebookPanel, INotebookModel>,
    IValidateButtonExtension
{
  private pioneer: IJupyterLabPioneer;

  constructor(pioneer: IJupyterLabPioneer) {
    this.pioneer = pioneer;
  }
  /**
   * Create a new extension for the notebook panel widget.
   */
  createNew(
    panel: NotebookPanel,
    context: DocumentRegistry.IContext<INotebookModel>
  ): IDisposable {
    const validate = async () => {
      await panel.revealed;
      await this.pioneer.loadExporters(panel);

      try {
        this.pioneer.exporters?.forEach(async (exporter: any) => {
          await this.pioneer.publishEvent(
            panel,
            {
              eventName: 'validate_button_clicked',
              eventTime: Date.now(),
              eventInfo: {}
            },
            exporter,
            true
          );
        });

        const validateButton =
          document.getElementsByClassName('validate-button')[0];
        validateButton.firstElementChild.textContent = 'Validating...';

        const notebookPath = panel.context.path;
        const dataToSend = { name: notebookPath };

        let reply: any;

        try {
          reply = await requestAPI<any>('validate', {
            body: JSON.stringify(dataToSend),
            method: 'POST'
          });
          console.log(reply);
        } catch (reason) {
          throw new Error(
            `Error on POST /jupyterlab-nbgrader-validate/validate ${dataToSend}.\n${reason}`
          );
        } finally {
          validateButton.firstElementChild.textContent = 'Validate';
        }

        const body = document.createElement('div');
        const pre = document.createElement('pre');
        pre.innerText = reply.output;
        body.appendChild(pre);

        
        this.pioneer.exporters?.forEach(async (exporter: any) => {
          await this.pioneer.publishEvent(
            panel,
            {
              eventName: 'validation_results_displayed',
              eventTime: Date.now(),
              eventInfo: {
                message: reply?.output
              }
            },
            exporter,
            true
          );
        });

        const result = await showDialog({
          title: 'Validation Results',
          body: new Widget({ node: body }),
          buttons: [Dialog.okButton()]
        });

        this.pioneer.exporters?.forEach(async (exporter: any) => {
          await this.pioneer.publishEvent(
            panel,
            {
              eventName: 'validation_results_dismissed',
              eventTime: Date.now(),
              eventInfo: {
                message: result
              }
            },
            exporter,
            true
          );
        });
      } catch (e) {
        console.error(e);
      }
    };

    const validateButton = new ToolbarButton({
      className: 'validate-button',
      label: 'Validate',
      onClick: validate,
      tooltip: 'Validate'
    });

    panel.toolbar.insertItem(10, 'validateNotebook', validateButton);
    return new DisposableDelegate(() => {
      validateButton.dispose();
    });
  }
}

/**
 * Initialization data for the jupyterlab-nbgrader-validate extension.
 */
const plugin: JupyterFrontEndPlugin<IValidateButtonExtension> = {
  id: PLUGIN_ID,
  provides: IValidateButtonExtension,
  requires: [IJupyterLabPioneer],
  autoStart: true,
  activate: (
    app: JupyterFrontEnd,
    pioneer: IJupyterLabPioneer
  ): IValidateButtonExtension => {
    const validateButtonExtension = new ValidateButtonExtension(pioneer);
    app.docRegistry.addWidgetExtension('Notebook', validateButtonExtension);
    return validateButtonExtension;
  }
};

export default plugin;
