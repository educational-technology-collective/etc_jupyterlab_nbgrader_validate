import { IDisposable, DisposableDelegate } from '@lumino/disposable';
import { Widget } from '@lumino/widgets';

import {
  JupyterFrontEnd,
  JupyterFrontEndPlugin
} from '@jupyterlab/application';

import {
  showDialog,
  Dialog,
  ToolbarButton
} from '@jupyterlab/apputils';

import { DocumentRegistry } from '@jupyterlab/docregistry';

import {
  NotebookPanel,
  INotebookModel
} from '@jupyterlab/notebook';

import { Token } from '@lumino/coreutils';

import { ISignal, Signal } from '@lumino/signaling';

import { requestAPI } from './handler';

const PLUGIN_ID = '@educational-technology-collective/etc_jupyterlab_nbgrader_validate:plugin';

export const IValidateButtonExtension = new Token<IValidateButtonExtension>(PLUGIN_ID);

export interface IValidateButtonExtension {
  validateButtonClicked: ISignal<ValidateButtonExtension, any>;
  validationResultsDisplayed: ISignal<ValidateButtonExtension, any>;
  validationResultsDismissed: ISignal<ValidateButtonExtension, any>;
}

/**
 * Initialization data for the jupyterlab-nbgrader-validate extension.
 */
const plugin: JupyterFrontEndPlugin<IValidateButtonExtension> = {
  id: PLUGIN_ID,
  provides: IValidateButtonExtension,
  autoStart: true,
  activate
};


/**
 * A notebook widget extension that adds a button to the toolbar.
 */
export class ValidateButtonExtension
  implements DocumentRegistry.IWidgetExtension<NotebookPanel, INotebookModel>, IValidateButtonExtension {

  private _validateButtonClicked: Signal<ValidateButtonExtension, any> = new Signal(this);
  private _validationResultsDisplayed: Signal<ValidateButtonExtension, any> = new Signal(this);
  private _validationResultsDismissed: Signal<ValidateButtonExtension, any> = new Signal(this);

  /**
   * Create a new extension for the notebook panel widget.
   */
  createNew(
    panel: NotebookPanel,
    context: DocumentRegistry.IContext<INotebookModel>
  ): IDisposable {
    const validate = async () => {

      try {

        this._validateButtonClicked.emit({
          event_name: 'validate_button_clicked',
          notebook_panel: panel
        });
        //  Emit a Signal when the validate button is clicked; 
        //  hence, emit a Signal at the start of the handler.

        let validateButton = document.getElementsByClassName('validate-button')[0];
        validateButton.children[0].children[0].innerHTML = "Validating...";

        // POST request
        const notebookPath = panel.context.path;
        const dataToSend = { name: notebookPath };

        let reply;

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
        }
        finally {
          validateButton.children[0].children[0].innerHTML = "Validate";
        }

        let body = document.createElement('div');
        let pre = document.createElement('pre');
        pre.innerText = reply.output;
        body.appendChild(pre);

        this._validationResultsDisplayed.emit({
          event_name: 'validate_results_displayed',
          notebook_panel: panel,
          message: reply.output
        });
        //  Emit a Signal when the Validation Results are displayed; 
        //  hence, emit a Signal just prior to displaying the results.

        let result = await showDialog({
          title: 'Validation Results',
          body: new Widget({ node: body }),
          buttons: [Dialog.okButton()],
        });

        this._validationResultsDismissed.emit({
          event_name: 'validate_results_dismissed',
          notebook_panel: panel,
          message: result
        });
        //  Emit a Signal once the dialog has been dismissed (either accepted or declined);
        //  hence, emit a Signal with the result message.
      }
      catch (e) {
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

  get validateButtonClicked(): ISignal<ValidateButtonExtension, any> {
    return this._validateButtonClicked
  }

  get validationResultsDisplayed(): ISignal<ValidateButtonExtension, any> {
    return this._validationResultsDisplayed
  }

  get validationResultsDismissed(): ISignal<ValidateButtonExtension, any> {
    return this._validationResultsDismissed
  }
}

/**
 * Activate the extension.
 */
function activate(app: JupyterFrontEnd): IValidateButtonExtension {

  const validateButtonExtension = new ValidateButtonExtension();

  app.docRegistry.addWidgetExtension('Notebook', validateButtonExtension);

  return validateButtonExtension;
}

/**
 * Export the plugin as default.
 */
export default plugin;
