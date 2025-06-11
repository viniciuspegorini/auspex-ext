import {
  JupyterFrontEnd,
  JupyterFrontEndPlugin
} from '@jupyterlab/application';

import { ICommandPalette, MainAreaWidget } from '@jupyterlab/apputils';
import { ILauncher } from '@jupyterlab/launcher';

import { Widget } from '@lumino/widgets';


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
    console.log('AUSPEX extension is activated! - 1');

    
    // Define a widget creator function,
    // then call it to make a new widget
    const newWidget = () => {
      // Create a blank content widget inside of a MainAreaWidget
      const content = new Widget();
      const widget = new MainAreaWidget({ content });
      widget.id = 'ext-auxpex';
      widget.title.label = 'AUSPEX Extension';
      widget.title.closable = true;
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
