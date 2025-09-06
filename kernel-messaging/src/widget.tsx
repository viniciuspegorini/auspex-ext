import { ReactWidget, UseSignal } from '@jupyterlab/apputils';

import * as React from 'react';

import { KernelModel } from './model';
import { IMimeBundle } from '@jupyterlab/nbformat';

async function runPythonFunction(model: KernelModel, functionCall: string) {
  // Call the function from python file
  await model.execute(functionCall);
}

export class KernelView extends ReactWidget {
  private _loading = false;
  private _scriptLoaded = false;
  private _xRoi = 0;
  private _yRoi = 0;
  private _zRoi = 0;
  
  constructor(model: KernelModel) {
    super();
    this._model = model;
    
  }

  private async loadPythonScript(scriptUrl: string) {
    const res = await fetch(scriptUrl);
    const script = await res.text();

    // Load the python script
    await this._model.execute(script);
    console.log("python script loaded")
  }
    
  private getValue(model: KernelModel): any {
    let test;
    console.log("output");
    console.log(model.output)
    if (model.output) {
      test = (model.output.data as IMimeBundle)["image/png"];
    }
    return test;
  }

  protected render(): React.ReactElement<any> {    

    return (
      <React.Fragment>
        <button
          key="header-thread"
          disabled={this._loading}
          className={`jp-example-button ${this._loading ? 'disabled-button' : ''}`}          
          onClick={async (): Promise<void> => {
            this._loading = true;
            this.update();
            if (!this._scriptLoaded) {
              await this.loadPythonScript('http://localhost:8000/files/test.py');  
              await this.loadPythonScript('http://localhost:8000/files/src/auspex.py');  
              this._scriptLoaded = true;
              console.log("script loaded");
            }
            await runPythonFunction(this._model, `load_data("SDH40mmPA_FMC_Contact.civa")`);
            console.log("OK DATA");
            await runPythonFunction(this._model, `run_saft(${this._xRoi}, ${this._yRoi}, ${this._zRoi})`);
            
            this._loading = false;
            this.update();
          }          
        }          
        >
          Run Saft
        </button>
        <br />
        <label>
          Roi X:
          <input
            type="number"
            defaultValue="0"
            onChange={(e) => {
              this._xRoi = Number(e.target.value);
            }}
          />
        </label>
        <label>
          Roi Y:
          <input
            type="number"
            defaultValue="0"
            onChange={(e) => {
              this._yRoi = Number(e.target.value);
            }}
          />
        </label>
        <label>
          Roi Z:
          <input
            type="number"
            defaultValue="0"
            onChange={(e) => {
              this._zRoi = Number(e.target.value);
            }}
          />
        </label>        
        <br/>
        <input id='shot' />
        <input id='angles' />
        <UseSignal signal={this._model.stateChanged}>
          {(): JSX.Element => (
            <>
            {this._loading ? (
                <>
                  <div style={{ padding: '1em' }}>🔄 Carregando...</div>
                </>
              ) : this.getValue(this._model) ? (
              <>                
                <br />
                <img src={`data:image/png;base64,${this.getValue(this._model)}`}/>
                <table id="b-data-insp-parameters"></table>
              </>
              ) : (
                <>
                  <br />
                  <div style={{ padding: '1em' }}>Clique em "Run Saft" para executar</div>
                </>
              )}
            </>
          )}
        </UseSignal>
      </React.Fragment>
    );
  }

  private _model: KernelModel;
}
