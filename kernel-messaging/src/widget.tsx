import { ReactWidget, UseSignal} from '@jupyterlab/apputils';
//import { IFileBrowserFactory } from '@jupyterlab/filebrowser';

import * as React from 'react';

import { KernelModel } from './model';
import { IMimeBundle } from '@jupyterlab/nbformat';

import { ScrollContainer } from "./scroll-container"; // caminho relativo

async function runPythonFunction(model: KernelModel, functionCall: string) {
  // Call the function from python file
  await model.execute(functionCall);
}

export class KernelView extends ReactWidget {
  private _loading = false;
  private _scriptLoaded = false;
  private _dataReloaded = false;
  private _fileReloaded = false;
  private _xRoi = 0;
  private _yRoi = 0;
  private _zRoi = 0;
  private _height = 0;
  private _pix_height = 0;
  private _width = 0;
  private _pix_width = 0;
  private _shot = 0;
  private _c = 0;
  private _scattering_angle = 0;
  private _model: KernelModel;
  private _data = {
              inspectionType: 'Contact',
              excitation: 'FMC',
              origin: '[40. 0. 0.]',
              waterPath: 0,
              cSpeed: 1483,
              sampleFreq: 100,
              gateStart: 0,
              nbSamples: 2046,
              hardwareGain: 0.0,
              digitalGain: 0.0,
              probeType: 'linear',
              elementDimen: 0.7,
              centralFreq: 5,
              pulseBandwidth: 0.5,
              nbElements: 32,
              pitch: 0.7999999,
              lSpeed: 5900,
              tSpeed: 3250,
              surfaceRoughness: 0
            };

  constructor(model: KernelModel) {
    super();
    this._model = model;
  }

  private async loadPythonScript(scriptUrl: string) {
    const res = await fetch(scriptUrl);
    const script = await res.text();

    // Load the python script
    await this._model.execute(script);
    console.log('python script loaded');
  }

  private getValue(model: KernelModel): any {
    //let test;    
    // if (model.output) {
    //   test = (model.output.data as IMimeBundle)['image/png'];
    // }

    let value: any = null;
    const outputData = model.output;
    console.log("Model Out 0: ")
    console.log(model.output)
    console.log("Model Out Data :0 ")
    console.log(model.output?.data)
    if (outputData && 'text/plain' in outputData) {
      console.log("Model Out 1: ")
      console.log(model.output)
      console.log("Model Out Data: ")
      console.log(model.output?.data)
      value = (outputData as IMimeBundle)['text/plain'];
    } else if (outputData) {
      console.log("Model Out 2: ")
      console.log(model.output)
      console.log("Model Out Data: ")
      console.log(model.output?.data)
      // value = (outputData.data as IMimeBundle)['image/png'];
      // value = (outputData as IMimeBundle)['text/plain'];
      let raw = (model.output.data as IMimeBundle)['text/plain'];

      // normaliza para string
      let text: string;
      if (Array.isArray(raw)) {
        text = raw.join("\n");
      } else {
        text = raw as string;
      }

      let result: any;
      try {
        result = JSON.parse(text.replace(/'/g, '"'));
      } catch {
        result = text; // fallback: devolve como string pura
      }
      console.log(result)
    }

    return value;
  }

  protected render(): React.ReactElement<any> {
    return (
      <div style={{ height: "100vh" }}>
        <ScrollContainer topOffset={50}>
          <div className="kernel-container">
            <div className='head'>
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
            </div>
            
            <div className='container'>
              <div className='selected-file'>
                <h3>Selected File: </h3>
              </div>
              
              <div className="grid-layout">
                <div className="sidebar">
                  <div className="card-files">
                    <h3>Files</h3>
                    <button
                      disabled={this._loading}
                      className={`jp-example-button ${this._loading ? 'disabled-button' : ''}`}
                      onClick={async (): Promise<void> => {
                        this._loading = true;
                        this.update();
                        if (!this._fileReloaded) {
                          this._fileReloaded = true;
                          console.log('file reloaded');
                        }
                        this._loading = false;
                        this._model.execute('3+5');
                        this.update();
                      }}
                    >
                      Load zip file (civa or m2k)
                    </button>
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
                          await runPythonFunction(
                            this._model,
                            `load_data()`
                          );
                          this._height; this._pix_height; this._width; this._pix_width; this._shot; this._c; this._scattering_angle;
                          this._loading = false;
                          this.update();
                        }}
                      >
                        Run Load Data
                    </button>

                    <div className="files-list">
                        
                      Arquivo 1
                          
                    </div>
                  </div>

                  <br />

                  <div className="card-data">
                    <div className='h3'>
                      <h3>Data</h3>
                    </div>
                    <button
                      disabled={this._loading}
                      className={`jp-example-button ${this._loading ? 'disabled-button' : ''}`}
                      onClick={async (): Promise<void> => {
                        this._loading = true;
                        this.update();

                        await new Promise(resolve => setTimeout(resolve, 1000));
                        this._data;
                        if (!this._dataReloaded) {
                          this._dataReloaded = true;
                          console.log('data reloaded');
                        }
                        this._loading = false;
                        this.update();
                      }}
                    >
                      Reload Data
                    </button>

                    {this._dataReloaded && this._data && (
                      <div className="data-table">
                        <h4>Inspection Parameters</h4>
                        <table>
                          <tr>
                            <td>Inspection Type</td>
                            <td>
                              <select name="inspection-type" id="inspection-type">
                                <option value="type">
                                  {this._data.inspectionType}
                                </option>
                              </select>
                            </td>
                          </tr>
                          <tr>
                            <td>Excitation</td>
                            <td>{this._data.excitation}</td>
                          </tr>
                          <tr>
                            <td>Origin [mm]</td>
                            <td>{this._data.origin}</td>
                          </tr>
                          <tr>
                            <td>Water Path [mm]</td>
                            <td>{this._data.waterPath}</td>
                          </tr>
                          <tr>
                            <td>Couplant L-Speed [m/s]</td>
                            <td>{this._data.cSpeed}</td>
                          </tr>
                          <tr>
                            <td>Sample Frequency [MHz]</td>
                            <td>{this._data.sampleFreq}</td>
                          </tr>
                          <tr>
                            <td>Gate start [µs]</td>
                            <td>{this._data.gateStart}</td>
                          </tr>
                          <tr>
                            <td>Nb. Samples</td>
                            <td>{this._data.nbSamples}</td>
                          </tr>
                          <tr>
                            <td>Hardware Gain [dB]</td>
                            <td>{this._data.hardwareGain}</td>
                          </tr>
                          <tr>
                            <td>Digital Gain [dB]</td>
                            <td>{this._data.digitalGain}</td>
                          </tr>
                        </table>

                        <br />
                        <h4>Probe Parameters</h4>
                        <table>
                          <tr>
                            <td>Probe Type</td>
                            <td>{this._data.probeType}</td>
                          </tr>
                          <tr>
                            <td>Element Dimension [mm]</td>
                            <td>{this._data.elementDimen}</td>
                          </tr>
                          <tr>
                            <td>Central Frequency [MHz]</td>
                            <td>{this._data.centralFreq}</td>
                          </tr>
                          <tr>
                            <td>Pulse Bandwidth [-6dB]</td>
                            <td>{this._data.pulseBandwidth}</td>
                          </tr>
                          <tr>
                            <td>Nb. Elements</td>
                            <td>{this._data.nbElements}</td>
                          </tr>
                          <tr>
                            <td>Pitch [mm]</td>
                            <td>{this._data.pitch}</td>
                          </tr>
                        </table>

                        <br />
                        <h4>Specimen Parameters</h4>
                        <table>
                          <tr>
                            <td>L-Speed in material [m/s]</td>
                            <td>{this._data.lSpeed}</td>
                          </tr>
                          <tr>
                            <td>T-Speed in material [m/s]</td>
                            <td>{this._data.tSpeed}</td>
                          </tr>
                          <tr>
                            <td>Surface Roughness [mm]</td>
                            <td>{this._data.surfaceRoughness}</td>
                          </tr>
                        </table>

                      </div>
                    )}
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
                              this._shot = Number(e.target.value)
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
                          await runPythonFunction(
                            this._model,
                            `run_saft(${this._xRoi}, ${this._yRoi}, ${this._zRoi})`
                          );
                          this._height; this._pix_height; this._width; this._pix_width; this._shot; this._c; this._scattering_angle;
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
                      <div className='result'>
                        <UseSignal signal={this._model.stateChanged}>
                          {(): JSX.Element => (
                            <>
                              {this._loading ? (
                                <div style={{ padding: '1em' }}>⏳ Loading...</div>
                              ) : this.getValue(this._model) ? (
                                <>
                                  <br />
                                  <img
                                    src={`data:image/png;base64,${this.getValue(this._model)}`}
                                    alt="Resultado SAFT"
                                  />
                                </>
                              ) : (
                                <div style={{ padding: '1em' }}>
                                  Clique em <b>Run Saft</b> para executar
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
