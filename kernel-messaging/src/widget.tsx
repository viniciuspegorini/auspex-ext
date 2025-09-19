import { ReactWidget, UseSignal} from '@jupyterlab/apputils';
//import { IFileBrowserFactory } from '@jupyterlab/filebrowser';

import * as React from 'react';
//import {useState} from 'react';

import { KernelModel } from './model';
import { IMimeBundle } from '@jupyterlab/nbformat';

import { ScrollContainer } from "./scroll-container"; // caminho relativo


async function runPythonFunction(model: KernelModel, functionCall: string) {
  // Call the function from python file
  await model.execute(functionCall);
}

type ParamType = "list" | "str" | "float";

interface Parameter {
  title?: string;
  name: string;
  type: ParamType;
  value: string | number;
  readonly: string;
  values?: Record<string, string>; // só quando type = "list"
  decimals?: number;              // só quando type = "float"
}
export class KernelView extends ReactWidget {
  private _loading = false;
  private _loadingMessage = "Loading";
  private _scriptLoaded = false;    
  private _xRoi = 0;
  private _yRoi = 0;
  private _zRoi = 0;
  private _height = 0;
  private _pix_height = 0;
  private _width = 0;
  private _pix_width = 0;
  private _sel_shot = 0;
  private _c = 0;
  private _scattering_angle = 0;
  private _model: KernelModel;
    
  constructor(model: KernelModel) {
    super();
    this._model = model;

    this.loadFiles();  
  }
  
  private async loadPythonScript(scriptUrl: string) {
    const res = await fetch(scriptUrl);
    const script = await res.text();

    // Load the python script
    await this._model.execute(script);
    console.log('python script loaded');
  }

  private async loadFiles() {
    this._loading = true;
    this._loadingMessage = "Loading Pyodide Kernel..."
    this.update();
    await this._model.sessionContext.ready;
    if (!this._scriptLoaded) {      
      await this.loadPythonScript('http://localhost:8000/files/test.py');      
      this._scriptLoaded = true;
    }    
    await runPythonFunction(this._model, `list_data()`);
    this._loading = false;
    this._loadingMessage = ""
    this.update();
  }

  private getValue(model: KernelModel): any {
    let result;
    if (model.output?.data) {
      const data = model.output.data as IMimeBundle;
      console.log("Dados:");
      console.log(model.output?.data);
      if ('image/png' in data) {
        result = (model.output.data as IMimeBundle)['image/png'];
      } else if ('text/plain' in data) {
        let raw = (model.output.data as IMimeBundle)['text/plain'];
        // normaliza para string
        let text: string;
        if (Array.isArray(raw)) {
          text = raw.join("\n");
        } else {
          text = raw as string;
        }
        
        if (text.includes("insp_pars")) {
          let tab_insp: Parameter[];
          let tab_probe: Parameter[];
          try {
            // substitui aspas simples por duplas e tenta converter para JSON
            const parsed = JSON.parse(text.replace(/'/g, '"'));
            tab_insp = parsed.insp_pars as Parameter[]
            tab_probe = parsed.probe_pars as Parameter[]                    
          } catch( error ) {
            if (error instanceof Error) {
              console.error("Erro:", error.message);   // só a mensagem
              console.error("Stack:", error.stack);    // rastreio da stack
            } else {
              console.error("Erro desconhecido:", error);
            }
            tab_insp = [];
            tab_probe = [];          
          }        
          this.mountTable('tab_insp', tab_insp)
          this.mountTable('tab_probe', tab_probe)
        } else if (text.includes(".civa")) {
          
          const files = JSON.parse(text.replace(/'/g, '"'));          
          
          const filtered = files.filter(
            (f: string) => f.endsWith(".civa") || f.endsWith(".m2k") || f.endsWith(".civa.zip") || f.endsWith(".m2k.zip")
          );
          const select = document.getElementById("insp-file") as HTMLElement;          
          select.innerHTML = "";
          const option = document.createElement("option");
          option.value = "";
          option.text = "(select an inspection)";
          select.appendChild(option);
          filtered.forEach((f: string) => {
            console.log("select" + f);
            const option = document.createElement("option");
            option.value = f;
            option.text = f;            
            select.appendChild(option);
          })

          const selectFile = document.getElementById("insp-file") as HTMLSelectElement;
          const input = document.getElementById("file-input") as HTMLInputElement;
          let fileName; 
          if (input && input.files && input.files.length > 0) {            
            fileName = input.files[0].name;
            selectFile.value = fileName.replace(".zip", "");
          }
          input.value = "";          
        }
      } else {
        console.log("Formato não reconhecido", data);
      }
    }    
    return result;
  }

  private mountTable(tableName: string, parameters: Parameter[]): void {
    const table = document.getElementById(tableName) as HTMLTableElement | null;
    
    if (!table) return;
    table.innerHTML = "";

    for (const child of parameters) {
      const row = table.insertRow();

      // Coluna 1: título
      const cell1 = row.insertCell(0);
      cell1.innerHTML = child.title || child.name;
      // Coluna 2: valor ou input
      const cell2 = row.insertCell(1);

      if (child.readonly === 'false') {
        let inputElement: HTMLElement;

        if (child.type === 'list') {          
          // SELECT
          const select = document.createElement("select");
          select.id = child.name;

          for (const key in child.values) {
            const option = document.createElement("option");
            option.value = child.values[key];
            option.text = key;
            if (child.values[key] === child.value) {
              option.selected = true;
            }
            select.appendChild(option);
          }
          inputElement = select;

        } else if (child.type === "float") {
          // NUMBER
          const input = document.createElement("input");
          input.type = "number";
          input.id = child.name;
          input.value = String(child.value ?? "");
          input.step =
            child.decimals !== undefined
              ? (1 / Math.pow(10, child.decimals)).toFixed(child.decimals)
              : "any";
          inputElement = input;

        } else {
          // STRING
          const input = document.createElement("input");
          input.type = "text";
          input.id = child.name;
          input.value = String(child.value ?? "");
          inputElement = input;
        }

        cell2.appendChild(inputElement);        
      } else {
        // READONLY
        cell2.innerHTML = String(child.value ?? "");
      }
    }
  }

  private  handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    this._loading = true;
    this.update();

    const arrayBuffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);

    // Converte para Base64 em blocos para não estourar a pilha
    const base64Data = this.uint8ToBase64(uint8Array);

    const filename = file.name;
    if (!this._scriptLoaded) {
      await this.loadPythonScript('http://localhost:8000/files/test.py');
      this._scriptLoaded = true;
    }
    console.log("Save file start");
    await runPythonFunction(this._model, `save_bytes_as_file("${base64Data}", "${filename}")`);
    
    this._loading = false;
    this.update();
  }

  private uint8ToBase64(uint8Array: Uint8Array): string {
    let binary = "";
    const chunkSize = 0x8000; // 32 KB
    for (let i = 0; i < uint8Array.length; i += chunkSize) {
      const chunk = uint8Array.subarray(i, i + chunkSize);
      binary += String.fromCharCode.apply(null, chunk as any);
    }
    return btoa(binary);
  }



  protected render(): React.ReactElement<any> {    
    return (
      <div style={{ height: "100vh" }}>
        {this._loading && (
          <div className="loading-overlay">
            <div className="loading-spinner" />
            <span> {this._loadingMessage !== ""  ? this._loadingMessage : "Loading..."}</span>
          </div>
        )}
        <ScrollContainer topOffset={50}>
          <div className="kernel-container">
            {/* <div className='head'>
              <div className='img'>
                <img
                  src='kernel-messaging/src/LASSIP-Icon.jpg'
                  alt="Lassip Icon"
                />
              </div>
              <div className='div-copy'>
                <button 
                  className='button-copy'
                  onClick={async (): Promise<void> => {
                  }}
                  >
                  Copyright
                </button>
              </div>
            </div> */}
            
            <div className='container'>
              <div className='selected-file'>
                <h3>Selected File: </h3>
              </div>
              
              <div className="grid-layout">
                <div className="sidebar">
                  <div className="card-files">
                    <h3>Files</h3>

                    <div className="file-select-wrapper">
                      <label>
                        Upload file:
                        <input type="file" id="file-input" style={{width: '95%'}} onChange={this.handleFileChange} />
                      </label>
                    </div>
                    <button
                      disabled={this._loading}
                      className={`jp-example-button ${this._loading ? 'disabled-button' : ''}`}
                      onClick={async (): Promise<void> => {
                        this._loading = true;
                        this.update();
                        if (!this._scriptLoaded) {
                          await this.loadPythonScript('http://localhost:8000/files/test.py');
                          this._scriptLoaded = true;
                        }
                        
                        await runPythonFunction(this._model, `list_data()`);

                        this._loading = false;                        
                        this.update();
                      }}
                    >
                      Load inspections
                    </button>
                    <div className="file-select-wrapper">
                      <label htmlFor="insp-file">Select an inspection:</label>
                      <select
                        id="insp-file"
                        onChange={async (): Promise<void> => {
                          this._loading = true;
                          this.update();
                          if (!this._scriptLoaded) {
                            await this.loadPythonScript('http://localhost:8000/files/test.py');
                            this._scriptLoaded = true;
                          }
                          const select = document.getElementById("insp-file") as HTMLSelectElement;
                          const file = select.value as string;
                          if (file !== "") {
                            await runPythonFunction(this._model,`load_data("${file}")`);
                          }
                          this._height; this._pix_height; this._width; this._pix_width; this._sel_shot; this._c; this._scattering_angle;
                          this._loading = false;
                          this.update();
                        }}
                      >
                        <option value="">(select an inspection)</option>                        
                      </select>
                    </div>
                    <button
                        disabled={this._loading}
                        className={`jp-example-button ${this._loading ? 'disabled-button' : ''}`}
                        onClick={async (): Promise<void> => {
                          this._loading = true;
                          this.update();
                          if (!this._scriptLoaded) {
                            await this.loadPythonScript('http://localhost:8000/files/test.py');
                            this._scriptLoaded = true;
                          }
                          const select = document.getElementById("insp-file") as HTMLSelectElement;
                          const file = select.value as string;
                          if (file !== "") {
                            await runPythonFunction(this._model,`load_data("${file}")`);
                          }
                          this._height; this._pix_height; this._width; this._pix_width; this._sel_shot; this._c; this._scattering_angle;
                          this._loading = false;
                          this.update();
                        }}
                      >
                        Load inspection data
                    </button>                    
                  </div>

                  <br />

                  <div className="card-data">
                    <div className='h3'>
                      <h3>Data</h3>
                    </div>
                    <div className="table-wrapper table-scroll">
                      <div className="table-title">Inspection Parameters</div>
                      <table className="jupyter" id='tab_insp'>
                        <thead>
                          <tr>
                            <th>Parâmetro</th>
                            <th>Valor</th>
                          </tr>
                        </thead>
                        <tbody></tbody>
                      </table>
                    </div>
                    <br />                      
                    <div className="table-wrapper table-scroll">
                      <div className="table-title">Probe Parameters</div>
                      <table className="jupyter" id='tab_probe'>
                        <thead>
                            <tr>
                              <th>Parâmetro</th>
                              <th>Valor</th>
                            </tr>
                        </thead>
                        <tbody></tbody>                        
                      </table>
                    </div>                                        
                  </div>
                </div>

                <div className="main-panel">
                  <div className="card">
                    <h3>SAFT Algorithm</h3>
                    <div className='parameters'>
                    <div className="roi-section">
                      <h4>ROI</h4>
                      <div className="roi-parameters">
                        <label>
                          X Coord. [mm]
                          <input
                            type="number"
                            defaultValue="0"
                            onChange={(e) => {
                              this._xRoi = Number(e.target.value)
                            }}
                          />
                        </label>
                        <label>
                          Y Coord. [mm]
                          <input
                            type="number"
                            defaultValue="0"
                            onChange={(e) => {
                              this._yRoi = Number(e.target.value)
                            }}
                          />
                        </label>
                        <label>
                          Z Coord. [mm]
                          <input
                            type="number"
                            defaultValue="0"
                            onChange={(e) => {
                              this._zRoi = Number(e.target.value)
                            }}
                          />
                        </label>
                        <label>
                          Height [mm]
                          <input
                            type="number"
                            defaultValue="20"
                            onChange={(e) => {
                              this._height = Number(e.target.value)
                            }}
                          />
                        </label>
                        <label>
                          Pixels in height
                          <input
                            type="number"
                            defaultValue="200"
                            onChange={(e) => {
                              this._pix_height = Number(e.target.value)
                            }}
                          />
                        </label>
                        <label>
                          Width [mm]
                          <input
                            type="number"
                            defaultValue="20"
                            onChange={(e) => {
                              this._width = Number(e.target.value)
                            }}
                          />
                        </label>
                        <label>
                          Pixels in width
                          <input
                            type="number"
                            defaultValue="200"
                            onChange={(e) => {
                              this._pix_width = Number(e.target.value)
                            }}
                          />
                        </label>
                      </div>

                      
                    </div>

                    <div className="parameters-grid">
                      <label>
                          Shot
                          <input
                            type="number"
                            defaultValue="0"
                            onChange={(e) => {
                              this._sel_shot = Number(e.target.value)
                            }}
                          />
                        </label>
                        <label>
                          C
                          <input
                            type="number"
                            defaultValue="5900"
                            onChange={(e) => {
                              this._c = Number(e.target.value)
                            }}
                          />
                        </label>
                        <label>
                          Scattering Angle
                          <input
                            type="number"
                            defaultValue="0"
                            onChange={(e) => {
                              this._scattering_angle = Number(e.target.value)
                            }}
                          />
                        </label>
                      </div>
                    </div>

                    <div className="envelope-container">
                      <div className='div-env'>
                        <input type="checkbox" id="env" />
                        <label htmlFor="env">Envelope</label>
                      </div>

                      <button
                        disabled={this._loading}
                        className={`jp-example-button ${this._loading ? 'disabled-button' : ''}`}
                        onClick={async (): Promise<void> => {
                          this._loading = true;
                          this.update();
                          if (!this._scriptLoaded) {
                            await this.loadPythonScript('http://localhost:8000/files/test.py');
                            this._scriptLoaded = true;
                          }                          
                          const select = document.getElementById("insp-file") as HTMLSelectElement;                          
                          const file = select.value as string;                          
                          if (file !== "") {                  
                            const params = {
                                            x: this._xRoi,
                                            y: this._yRoi,
                                            z: this._zRoi,
                                            scattering_angle: this._scattering_angle,
                                            selected_file: file,
                                            c: this._c,
                                            sel_shot: this._sel_shot
                                          };
                          const paramsJson = JSON.stringify(params).replace(/"/g, '\\"');      
                            await runPythonFunction(
                              this._model,
`import json
params = json.loads("${paramsJson}")
run_saft(params, "${file}")`
                            );
                          }
                          this._height; this._pix_height; this._width; this._pix_width; this.sel_shot; this._c; this._scattering_angle;
                          this._loading = false;
                          this.update();
                        }}
                      >
                        Run Saft
                      </button>
                    </div>
                    
                  </div>

                  <br />

                  <div className="card-result">
                    <h3>Result</h3>
                      <div className='image-container'>
                        <UseSignal signal={this._model.stateChanged}>
                          {(): JSX.Element => (
                            <>
                              {this._loading ? (
                                <div style={{ padding: '1em' }}>⏳ Loading...</div>
                              ) : this.getValue(this._model) ? (
                                <>                                  
                                  <img
                                    src={`data:image/png;base64,${this.getValue(this._model)}`}
                                    alt="Resultado SAFT"
                                  />
                                </>
                              ) : (
                                <div style={{ padding: '1em' }}>
                                  Click <b>Run Saft</b> to execute
                                </div>
                              )}
                            </>
                          )}
                        </UseSignal>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </ScrollContainer>
      </div>
    );
  }
}
