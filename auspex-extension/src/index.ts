import {
  JupyterFrontEnd,
  JupyterFrontEndPlugin
} from '@jupyterlab/application';

import { ICommandPalette, MainAreaWidget } from '@jupyterlab/apputils';
import { ILauncher } from '@jupyterlab/launcher';
import { Widget } from '@lumino/widgets';
import { OutputArea, OutputAreaModel } from '@jupyterlab/outputarea';
import { RenderMimeRegistry } from '@jupyterlab/rendermime';
import { ServiceManager } from '@jupyterlab/services';

/**
 * Initialization data for the auspex-extension extension.
 */
const plugin: JupyterFrontEndPlugin<void> = {
  id: 'auspex-extension:plugin',
  description: 'A JupyterLab extension for AUSPEX framework.',
  autoStart: true,
  requires: [ICommandPalette],
  optional: [ILauncher],
  activate: async (
    app: JupyterFrontEnd, 
    palette: ICommandPalette,
    launcher: ILauncher | null
  ) => {
    console.log('AUSPEX extension is activated! - 4');

    // Create a service manager
    const manager = new ServiceManager();
    await manager.ready;

    // Define a widget creator function,
    // then call it to make a new widget
    const newWidget = () => {
      // Create the main widget container
      const content = new Widget();
      const widget = new MainAreaWidget({ content });
      widget.id = 'ext-auxpex';
      widget.title.label = 'AUSPEX Extension';
      widget.title.closable = true;

      // Create button
      const button = document.createElement('button');
      button.textContent = 'Run Hello 7';
      button.className = 'jp-Button';
      content.node.appendChild(button);

      // Create output area
      const model = new OutputAreaModel();
      const rendermime = new RenderMimeRegistry();
      const outputArea = new OutputArea({
        model: model,
        rendermime: rendermime
      });
      content.node.appendChild(outputArea.node);

      // Add button click handler
      button.onclick = async () => {
        try {
          // Espera o Pyodide estar disponível
          let pyodide = null;
          let attempts = 0;
          const maxAttempts = 10;

          while (!pyodide && attempts < maxAttempts) {
            pyodide = (window as any).pyodide || (window as any).jupyterlitePyodide;
            if (!pyodide) {
              attempts++;
              await new Promise(resolve => setTimeout(resolve, 1000)); // Espera 1 segundo
            }
          }

          if (!pyodide) {
            throw new Error('Pyodide não está disponível após várias tentativas. Por favor, recarregue a página e tente novamente.');
          }

          // Executa o código Python
          const code = `
import sys
print(f"Python version: {sys.version}")
print(f"Python executable: {sys.executable}")
print(f"Python path: {sys.path}")
`;
          
          const output = await pyodide.runPythonAsync(code);
          model.add({
            output_type: 'stream',
            name: 'stdout',
            text: output ? output.toString() : ''
          });
        } catch (error: any) {
          console.error('Failed to execute code:', error);
          model.add({
            output_type: 'stream',
            name: 'stderr',
            text: 'Error executing code: ' + error.message
          });
        }
      };

      return widget;
    }
    let widget = newWidget();

    // Add an application command
    const command: string = 'ext-auxpex:open';
    app.commands.addCommand(command, {
      label: 'AUSPEX',
      caption: 'Open AUSPEX Extension',
      execute: () => {
        // Regenerate the widget if disposed
        if (widget.isDisposed) {
          widget = newWidget();
        }
        if (!widget.isAttached) {
          // Attach the widget to the main work area if it's not there
          app.shell.add(widget, 'main');
        }
        // Activate the widget
        app.shell.activateById(widget.id);
      }
    });

    // Add the command to the palette.
    palette.addItem({ command, category: 'Tutorial' });

    // Add the command to the launcher
    if (launcher) {
      launcher.add({
        command,
        category: 'Other',
        rank: 1
      });
    }
  }
};

export default plugin;
