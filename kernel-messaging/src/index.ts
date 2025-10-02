import {
  JupyterFrontEnd,
  JupyterFrontEndPlugin
} from '@jupyterlab/application';

import { ICommandPalette } from '@jupyterlab/apputils';

import { ILauncher } from '@jupyterlab/launcher';

import { ITranslator } from '@jupyterlab/translation';

import { ExamplePanel } from './panel';

import { LabIcon } from '@jupyterlab/ui-components';
import iconSvgStr from '../style/saft.svg';

// Create a new LabIcon instance from the SVG string
export const saftIcon = new LabIcon({
  name: 'my-extension-name:my-icon',
  svgstr: iconSvgStr,
});


/**
 * The command IDs used by the console plugin.
 */
namespace CommandIDs {
  export const create = 'kernel-messaging:create';
}

/**
 * Initialization data for the extension.
 */
const extension: JupyterFrontEndPlugin<void> = {
  id: '@jupyterlab-examples/kernel-messaging:plugin',
  description: 'JupyterLab extension example for kernel messaging.',
  autoStart: true,
  optional: [ILauncher],
  requires: [ICommandPalette, ITranslator],
  activate: activate
};

/**
 * Activate the JupyterLab extension.
 *
 * @param app Jupyter Front End
 * @param palette Jupyter Commands Palette
 * @param translator Jupyter Translator
 * @param launcher [optional] Jupyter Launcher
 */
function activate(
  app: JupyterFrontEnd,
  palette: ICommandPalette,
  translator: ITranslator,
  launcher: ILauncher | null
): void {
  const manager = app.serviceManager;
  const { commands, shell } = app;
  const category = 'WebAUSPEX Extensions';
  const trans = translator.load('jupyterlab');

  // Add launcher
  if (launcher) {
    launcher.add({
      command: CommandIDs.create,
      category: category
    });
  }

  /**
   * Creates a example panel.
   *
   * @returns The panel
   */
  async function createPanel(): Promise<ExamplePanel> {
    const panel = new ExamplePanel(manager, translator);
    shell.add(panel, 'main');
    return panel;
  }

  // add commands to registry
  commands.addCommand(CommandIDs.create, {
    label: trans.__('SAFT'),
    caption: trans.__('SAFT'),
    icon: saftIcon,
    execute: createPanel
  });

  // add items in command palette and menu
  palette.addItem({ command: CommandIDs.create, category });
}

export default extension;
