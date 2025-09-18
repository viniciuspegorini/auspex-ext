import { ISessionContext } from '@jupyterlab/apputils';

import { IOutput } from '@jupyterlab/nbformat';

import { Kernel, KernelMessage } from '@jupyterlab/services';

import { ISignal, Signal } from '@lumino/signaling';

export class KernelModel {
  constructor(session: ISessionContext) {
    this._sessionContext = session;
  }

  get sessionContext(): ISessionContext {
    return this._sessionContext;
  }

    // Getter para o kernel
  get kernel(): Kernel.IKernelConnection | null {
    return this._sessionContext.session?.kernel ?? null;
  }
  
  get future(): Kernel.IFuture<
    KernelMessage.IExecuteRequestMsg,
    KernelMessage.IExecuteReplyMsg
  > | null {
    return this._future;
  }

  set future(
    value: Kernel.IFuture<
      KernelMessage.IExecuteRequestMsg,
      KernelMessage.IExecuteReplyMsg
    > | null
  ) {
    this._future = value;
    if (!value) {
      return;
    }
    value.onIOPub = this._onIOPub;
  }

  get output(): IOutput | null {
    return this._output;
  }

  get stateChanged(): ISignal<KernelModel, void> {
    return this._stateChanged;
  }

  async execute(code: string): Promise<void> {
    if (!this._sessionContext || !this._sessionContext.session?.kernel) {
      return;
    }
    this.future = this._sessionContext.session?.kernel?.requestExecute({
      code
    });

    if (this.future) {
      await this.future.done; // Wait until the execution of the code was done
    }
  }

  private _onIOPub = (msg: KernelMessage.IIOPubMessage): void => {
    const msgType = msg.header.msg_type;
    switch (msgType) {
      case 'execute_result':
      case 'display_data':
      case 'update_display_data':
        this._output = msg.content as IOutput;
        console.log(this._output);
        this._stateChanged.emit();
        break;
      case 'stream': {
        // 🔹 Capture stdout/stderr (runtime print and errors)
        const content = msg.content as { name: string; text: string };
        if (content.name === "stderr") {
          console.error("STDERR:", content.text);
        } else {
          console.log("STDOUT:", content.text);
        }
        break;
      }
      case 'error': {
        // 🔹 Captures tracebacks of Python`s exceptions
        const content = msg.content as {
          ename: string;
          evalue: string;
          traceback: string[];
        };
        console.error("Python Error:", content.ename, content.evalue);
        console.error("Traceback:\n", content.traceback.join("\n"));
        break;
      }
      default:
        break;
    }
    return;
  };

  private _future: Kernel.IFuture<
    KernelMessage.IExecuteRequestMsg,
    KernelMessage.IExecuteReplyMsg
  > | null = null;
  private _output: IOutput | null = null;
  private _sessionContext: ISessionContext;
  private _stateChanged = new Signal<KernelModel, void>(this);
}
