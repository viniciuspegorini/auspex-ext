await piplite.install(['mini-auspex', 'scipy'])

import asyncio
from pyodide.ffi import create_proxy
from js import document, window
import zipfile
import os
from os.path import exists
import io
import sys



async def load_data(selected_file):
    # Update gui    
    await asyncio.sleep(1)    
    global data
    data = await get_data("SDH40mmPA_FMC_Contact.civa")        
    await asyncio.sleep(1)

async def get_data(selected_file):
    from framework import file_civa, file_m2k

    if (selected_file.endswith('.civa')):
        data = file_civa.read(selected_file)
    else:
        data = file_m2k.read(selected_file)

    shot = data.ascan_data.shape[3] - 1

    document.getElementById('shot').max=shot

    if (data.inspection_params.type_capt == 'PWI'):
        document.getElementById('angles').value = data.inspection_params.angles

    readonly_params = False
    insp_pars = await get_insp_params(data, readonly_params)
    await mount_table('tb-data-insp-parameters', insp_pars)

    probe_pars = await get_probe_params(data, readonly_params)
    await mount_table('tb-data-probe-parameters', probe_pars)

    spec_pars = await get_spec_params(data, readonly_params)
    await mount_table('tb-data-spec-parameters', spec_pars)

    roi_pars = await get_roi_params(data, readonly_params)
    await mount_table('tb-data-roi-parameters', roi_pars)

    return data




async def process_algorithm(event):
    # Update gui
    window.blockUI(True, 'Processing algorithm...')
    document.getElementById("display-data").innerHTML = ''
    await asyncio.sleep(1)

    # get the selected file
    select = document.getElementById('algorithm')
    selected_file = document.getElementById('selected-file')
    algorithm = select.value

    if (selected_file.value != ''):
        if algorithm == 'saft':
            await saft(selected_file.value)
        elif algorithm == 'b-scan':
            await bscan(selected_file.value)
        elif algorithm == 'tfm':
            await tfm(selected_file.value)
        elif algorithm == 'cpwc':
            asyncio.ensure_future(cpwc(selected_file.value))
    else:
        document.getElementById("display-data").innerHTML = '<h5>Select a file first.</h5>'

    # Update gui
    window.blockUI(False, 'Finished...')
    await asyncio.sleep(1)

async def saft(selected_file):
    print('Saft')
    import numpy as np
    from matplotlib import pyplot as plt
    from zipfile import ZipFile
    from framework import file_civa, post_proc
    from framework.data_types import ImagingROI
    from imaging import saft

    params = await load_params('saft')
    data = await get_data(selected_file)

    roi = await get_roi()
    corner_roi = np.array([roi.xcoordinate, roi.ycoordinate, roi.zcoordinate])[np.newaxis, :]
    roi = ImagingROI(corner_roi, height=roi.height, width=roi.width, h_len=roi.pixelheight, w_len=roi.pixelwidth)

    if hasattr(params, 'scattering_angle'):
      key = saft.saft_kernel(data, roi=roi, sel_shot=params.sel_shot, c=params.c, scattering_angle=params.scattering_angle)
    else:
      key = saft.saft_kernel(data, roi=roi, sel_shot=params.sel_shot, c=params.c)

    image_out = data.imaging_results[key].image

    plt.imshow(post_proc.envelope(image_out), aspect='auto',
            extent=[roi.w_points[0], roi.w_points[-1], roi.h_points[-1], roi.h_points[0]])
    plt.title('SAFT')
    document.getElementById("display-data").innerHTML = ''
    display(plt, target = 'display-data')

class Parms:
    def __init__(self):
        self.envelope = False
        self.c = 5900

class RoiParms:
    def __init__(self):
        self.xcoordinate = 0
        self.ycoordinate = 0
        self.zcoordinate = 0
        self.height = 20
        self.pixelheight = 200
        self.width = 20
        self.pixelwidth = 200

async def load_params(algorithm):
    import numpy as np
    params = Parms()
    input = document.getElementById('envelope').value

    if input == 'True':
        params.envelope = True
    else:
        params.envelope = False

    if (document.getElementById('c-speed').value != '') :
      params.c = float(document.getElementById('c-speed').value)
    else :
      params.c = 5900.0

    if (algorithm == 'tfm' or algorithm == 'saft'):
      if (document.getElementById('scattering-angle').value != '') :
        params.scattering_angle = int(document.getElementById('scattering-angle').value)
      else :
        params.scattering_angle = None

    if (algorithm == 'cpwc'):
      if (document.getElementById('angles').value != '') :
        params.angles = np.fromstring(document.getElementById('angles').value.replace('[','').replace(']', ''), dtype=int, sep=' ')
        # params.angles = document.getElementById('angles').value
      else :
        params.angles = None

    if (document.getElementById('shot').value != '') :
      params.sel_shot = int(document.getElementById('shot').value)
    else :
      params.sel_shot = 0

    return params

async def get_roi():
    roiParams = RoiParms()
    if (document.getElementById('xcoordinate').value) :
      roiParams.xcoordinate= float(document.getElementById('xcoordinate').value)

    if (document.getElementById('ycoordinate').value) :
      roiParams.ycoordinate= float(document.getElementById('ycoordinate').value)

    if (document.getElementById('zcoordinate').value) :
      roiParams.zcoordinate= float(document.getElementById('zcoordinate').value)


    if (document.getElementById('height').value.isnumeric()) :
      if (int(document.getElementById('height').value) > 0):
        roiParams.height= int(document.getElementById('height').value)
      elif (int(document.getElementById('height').value) <= 0):
        roiParams.height=20
        document.getElementById('height').value  = 20

    if (document.getElementById('pixelheight').value.isnumeric()) :
      if (int(document.getElementById('pixelheight').value) > 0):
        roiParams.pixelheight= int(document.getElementById('pixelheight').value)
      elif (int(document.getElementById('pixelheight').value) <= 0):
        roiParams.pixelheight=200
        document.getElementById('pixelheight').value  = 200

    if (document.getElementById('width').value.isnumeric()) :
      if (int(document.getElementById('width').value) > 0):
        roiParams.width= int(document.getElementById('width').value)
      elif (int(document.getElementById('width').value) <= 0):
        roiParams.width=20
        document.getElementById('width').value  = 20

    if (document.getElementById('pixelwidth').value.isnumeric()) :
      if (int(document.getElementById('pixelwidth').value) > 0):
        roiParams.pixelwidth= int(document.getElementById('pixelwidth').value)
      elif (int(document.getElementById('pixelwidth').value) <= 0):
        roiParams.pixelwidth=200
        document.getElementById('pixelwidth').value  = 200


    return roiParams

async def bscan(selected_file):
    print('B-scan')
    import numpy as np
    from matplotlib import pyplot as plt
    from zipfile import ZipFile

    from framework import file_civa, post_proc
    from framework.data_types import ImagingROI
    from imaging import bscan

    data = await get_data(selected_file)

    params = await load_params('b-scan')

    roi = await get_roi()
    corner_roi = np.array([roi.xcoordinate, roi.ycoordinate, roi.zcoordinate])[np.newaxis, :]
    roi = ImagingROI(corner_roi, height=roi.height, width=roi.width, h_len=roi.pixelheight, w_len=roi.pixelwidth)

    key = bscan.bscan_kernel(data, roi=roi, sel_shot=params.sel_shot, c=params.c)
    image_out = data.imaging_results[key].image

    plt.imshow(post_proc.envelope(image_out), aspect='auto',
            extent=[roi.w_points[0], roi.w_points[-1], roi.h_points[-1], roi.h_points[0]])
    plt.title('B-scan')
    document.getElementById("display-data").innerHTML = ''
    display(plt, target = 'display-data')

async def tfm(selected_file):
    print('TFM')
    import numpy as np
    from matplotlib import pyplot as plt

    from framework import post_proc
    from framework.data_types import ImagingROI
    from imaging import tfm

    data = await get_data(selected_file)
    params = await load_params('tfm')

    roi = await get_roi()
    corner_roi = np.array([roi.xcoordinate, roi.ycoordinate, roi.zcoordinate])[np.newaxis, :]
    roi = ImagingROI(corner_roi, height=roi.height, width=roi.width, h_len=roi.pixelheight, w_len=roi.pixelwidth)

    if hasattr(params, 'scattering_angle'):
      key = tfm.tfm_kernel(data, roi=roi, sel_shot=params.sel_shot, c=params.c, scattering_angle=params.scattering_angle)
    else:
      key = tfm.tfm_kernel(data, roi=roi, sel_shot=params.sel_shot, c=params.c)

    image_out = data.imaging_results[key].image

    plt.imshow(post_proc.envelope(image_out) if params.envelope else image_out, aspect='auto',
            extent=[roi.w_points[0], roi.w_points[-1], roi.h_points[-1], roi.h_points[0]])
    plt.title('TFM')
    document.getElementById("display-data").innerHTML = ''
    display(plt, target = 'display-data')

async def cpwc(selected_file):
    print('CPWC')
    import numpy as np
    from matplotlib import pyplot as plt

    from framework import post_proc
    from framework.data_types import ImagingROI
    from imaging import cpwc

    data = await get_data(selected_file)
    params = await load_params('cpwc')

    roi = await get_roi()
    corner_roi = np.array([roi.xcoordinate, roi.ycoordinate, roi.zcoordinate])[np.newaxis, :]
    roi = ImagingROI(corner_roi, height=roi.height, width=roi.width, h_len=roi.pixelheight, w_len=roi.pixelwidth)

    if hasattr(params, 'angles') and params.angles != None:
      key = cpwc.cpwc_kernel(data, roi=roi, sel_shot=params.sel_shot, c=params.c, angles=params.angles)
    else:
      key = cpwc.cpwc_kernel(data, roi=roi, sel_shot=params.sel_shot, c=params.c)

    image_out = data.imaging_results[key].image

    plt.imshow(post_proc.envelope(image_out) if params.envelope else image_out, aspect='auto',
            extent=[roi.w_points[0], roi.w_points[-1], roi.h_points[-1], roi.h_points[0]])
    plt.title('CPWC')
    document.getElementById("display-data").innerHTML = ''
    display(plt, target = 'display-data')


async def get_insp_params(data, readonly_params):
    insp_pars = [
        {'title': 'Inspection Type', 'name': 'inspection_params.type_insp', 'type': 'list',
            'values': {"Immersion": 'immersion', "Contact": "contact"},
            'value': data.inspection_params.type_insp, 'readonly': readonly_params},

        {'title': 'Excitation', 'name': 'inspection_params.type_capt', 'type': 'str',
            'value': data.inspection_params.type_capt, 'readonly': True},

        {'title': 'Origin [mm]', 'name': 'inspection_params.point_origin', 'type': 'str',
            'value': f"{data.inspection_params.point_origin}", 'readonly': True},

        {'title': 'Water Path [mm]', 'name': 'inspection_params.water_path', 'type': 'float',
            'value': data.inspection_params.water_path if data.inspection_params.water_path is not None
            else 0, 'readonly': readonly_params},

        {'title': 'Couplant L-Speed [m/s]', 'name': 'inspection_params.coupling_cl', 'type': 'float',
            'value': data.inspection_params.coupling_cl, 'readonly': readonly_params,
            'decimals': 6},

        {'title': 'Sample Frequency [MHz]', 'name': 'inspection_params.sample_freq', 'type': 'float',
            'value': data.inspection_params.sample_freq, 'readonly': readonly_params},

        {'title': 'Gate start [us]', 'name': 'inspection_params.gate_start', 'type': 'float',
            'value': data.inspection_params.gate_start, 'readonly': readonly_params},

        {'title': 'Nb. Samples', 'name': 'inspection_params.gate_samples', 'type': 'float',
            'value': data.inspection_params.gate_samples, 'readonly': readonly_params,
            'decimals': 6},

        {'title': 'Hardware Gain [dB]', 'name': 'inspection_params.gain_hw', 'type': 'float',
            'value': data.inspection_params.gain_hw, 'readonly': True,
            'decimals': 6},

        {'title': 'Digital Gain [dB]', 'name': 'inspection_params.gain_sw', 'type': 'float',
            'value': data.inspection_params.gain_sw, 'readonly': True,
            'decimals': 6},
    ]
    return insp_pars

async def get_probe_params(data, readonly_params):
    # parametros do probe
    elem_dim = np.asarray(data.probe_params.elem_dim) if \
        hasattr(data.probe_params.elem_dim, "__len__") else data.probe_params.elem_dim
    elem_dim_type = 'ndarray' if hasattr(elem_dim, "__len__") else 'float'
    probe_pars = [
        {'title': 'Probe Type', 'name': 'data.probe_params.type_probe', 'type': 'str',
            'value': data.probe_params.type_probe, 'readonly': readonly_params},

        {'title': 'Element Dimension [mm]', 'name': 'data.probe_params.elem_dim', 'type': elem_dim_type,
            'value': elem_dim,
            'readonly': readonly_params},

        {'title': 'Central Frequency [MHz]', 'name': 'data.probe_params.contral_freq', 'type': 'float',
            'value': data.probe_params.central_freq, 'readonly': readonly_params},

        {'title': 'Pulse Bandwidth [-6dB]', 'name': 'data.probe_params.bw', 'type': 'float',
            'value': data.probe_params.bw, 'readonly': readonly_params}
    ]

    if data.probe_params.type_probe == 'linear':
        probe_pars.append({'title': 'Nb. Elements', 'name': 'data.probe_params.num_elem', 'type': 'int',
                            'value': data.probe_params.num_elem, 'readonly': readonly_params})

        probe_pars.append({'title': 'Pitch [mm]', 'name': 'data.probe_params.pitch', 'type': 'float',
                            'value': data.probe_params.pitch, 'readonly': readonly_params})
    return probe_pars

async def get_spec_params(data, readonly_params):
    # parametros do objeto de inspeção
    spec_pars = [
        {'title': 'L-Speed in material [m/s]', 'name': 'data.specimen_params.cl', 'type': 'float',
            'value': data.specimen_params.cl, 'readonly': readonly_params, 'decimals': 6},
        {'title': 'T-Speed in material [m/s]', 'name': 'data.specimen_params.cs', 'type': 'float',
            'value': data.specimen_params.cs, 'readonly': readonly_params, 'decimals': 6},
        {'title': 'Surface Roughness [mm]', 'name': 'data.specimen_params.roughness', 'type': 'float',
            'value': data.specimen_params.roughness, 'readonly': readonly_params, 'decimals': 6},
    ]
    return spec_pars

async def get_roi_params(data, readonly_params):
    # cria uma roi
    zi = 0
    zf = data.time_grid.shape[0]

    if data.probe_params.type_probe == 'linear':
        xi = data.probe_params.elem_center[0][0]
        xf = data.probe_params.elem_center[-1][0]

    elif data.probe_params.type_probe == 'matricial' or data.probe_params.type_probe == 'generic':
        xi = data.probe_params.elem_center[:, 0].min()
        xf = data.probe_params.elem_center[:, 0].max()

    else:  # data.probe_params.type_probe is 'mono':
        xi = data.inspection_params.step_points[0][0]
        xf = data.inspection_params.step_points[-1][0]

    if data.inspection_params.type_insp == 'immersion':
        # mantem o transdutor em (0, 0, 0)
        zf -= zi
        zi -= zi

    dt = data.time_grid[1][0] - data.time_grid[0][0]
    zi = dt * zi * data.specimen_params.cl * 10e-4 * 0.5 + data.probe_params.elem_center[0, 2]
    zf = dt * zf * data.specimen_params.cl * 10e-4 * 0.5 + data.probe_params.elem_center[0, 2]
    # parametros da ROI
    roi_pars = [
        {'name': 'X Coordinate [mm]', 'type': 'float', 'value': xi, 'readonly': readonly_params},
        {'name': 'Y Coordinate [mm]', 'type': 'float', 'value': 0, 'readonly': readonly_params},
        {'name': 'Z Coordinate [mm]', 'type': 'float', 'value': zi, 'readonly': readonly_params},
        {'name': 'Height [mm]', 'type': 'float', 'value': zf-zi, 'limits': (0, sys.maxsize), 'readonly': readonly_params},
        {'name': 'Pixels in height', 'type': 'float', 'value': 0, 'limits': (2, sys.maxsize), 'readonly': readonly_params},
        {'name': 'Width [mm]', 'type': 'float', 'value': 0, 'limits': (0, sys.maxsize), 'readonly': readonly_params},
        {'name': 'Pixels in width', 'type': 'float', 'value': 0, 'limits': (2, sys.maxsize), 'readonly': readonly_params},
        {'name': 'Depth [mm]', 'type': 'float', 'value': 10, 'limits': (0, sys.maxsize), 'readonly': readonly_params},
        {'name': 'Pixels in depth', 'type': 'float', 'value': 0, 'limits': (1, sys.maxsize), 'readonly': readonly_params},
    ]
    return roi_pars

async def mount_table(table_name, parameters):
    table = document.getElementById(table_name)
    table.innerHTML = ''
    for child in parameters:
        row = table.insertRow()
        cell1 = row.insertCell(0)
        if 'title' in child:
            cell1.innerHTML = child['title']
        else:
            cell1.innerHTML = child['name']
        cell2 = row.insertCell(1)
        if 'readonly' in child and child['readonly']==False:
            if child['type']=='list':
                select = document.createElement("select")
                select.id = child['name']
                select.disabled = True
                for item in child['values']:
                    option = document.createElement("option")
                    option.value = child['values'][item]
                    option.text = item
                    if child['values'][item] == child['value']:
                        option.selected = True
                    select.appendChild(option)
                cell2.appendChild(select)
            else:
                input = document.createElement("input")
                input.id = child['name']
                input.value = child['value']
                input.disabled = True
                cell2.appendChild(input)
        else:
          cell2.innerHTML = str(child['value'])
        table.appendChild(row)

async def draw_bscan(data, img=None):
    """ Desenha um B-scan no ``PlotWidget`` esquerdo. Pode também desenhar uma imagem qualquer.
    Caso não seja passada uma imagem, irá desenhar um B-scan dos dados presentes no ``DataInsp`` carregado, e os
    eixos serão calculados automaticamente, na escala de milímetros no eixo horizontal, e amostras no vertical.
    O *slice* é escolhido através dos `spinboxes` presentes na tela.
    Parameters
    ----------
        img : :class:`numpy.ndarray` ou None
            Imagem a ser desenhada. Também pode ser ´None´ para desenhar um B-scan dos dados carregados.
    """
    from framework import post_proc
    import numpy as np
    from matplotlib import pyplot as plt

    ascan_max = 0
    emissor = 0
    shot = 0

    # coloca a imagem do arquivo no imageview
    if img is None:
        max = ascan_max
        if data.inspection_params.type_capt == "sweep":
            # se for sweep, mostra todos os passos
            img = post_proc.normalize(np.real(data.ascan_data[:, 0, 0, :]), image_max=max, image_min=-max)

        elif data.inspection_params.type_capt == "FMC":
            # mostra o passo selecionado
            img = post_proc.normalize(np.real(data.ascan_data[:, emissor, :, shot]), image_max=max, image_min=-max)

        elif data.inspection_params.type_capt == "PWI":
            # mostra o passo e angulo selecionado
            img = post_proc.normalize(np.real(data.ascan_data[:, emissor, :, shot]), image_max=max, image_min=-max)

        elif data.inspection_params.type_capt == "Unisequential":
            img = post_proc.normalize(np.real(data.ascan_data[:, emissor, :, shot]), image_max=max, image_min=-max)

        elif data.inspection_params.type_capt == "FMC_sum":
            img = post_proc.normalize(np.real(data.ascan_data[:, :, emissor, shot]), image_max=max, image_min=-max)

        else:
            # ErrorWindow("Only possible for the following excitation types: sweep, FMC, PWI or Unisequential")
            return
    # desenha a imagem
    plt.figure(figsize=(4.5,3.0))
    plt.imshow(img, aspect='auto')
    plt.title('B-scan')
    document.getElementById("display-bscan").innerHTML = ''
    display(plt, target = 'display-bscan')

async def draw_ascan(selected_file):
    """ Desenha o A-scan determinado pelos `spinboxes` na tela.
    """
    import numpy as np
    from matplotlib import pyplot as plt

    data = await get_data(selected_file)
    channel = 0
    sequence = 0
    shot = 0

    ascan = np.real(data.ascan_data[:, sequence, channel, shot])
    # desenha a imagem
    # plt.imshow(ascan, aspect='auto')
    # plt.title('A-scan')
    # document.getElementById("display-ascan").innerHTML = ''
    # display(plt, target = 'display-ascan')


async def main():
    print('Loading main() - auspex.py')
    # Create a Python proxy for the callback function
    # process_file() is your function to process events from FileReader
    execute_event = create_proxy(process_algorithm)

    # Set the listener to the callback
    e = document.getElementById("button")
    e.addEventListener("click", execute_event, False)

    execute_load_data = create_proxy(load_data)
    e = document.getElementById("btn-load-data")
    e.addEventListener("click", execute_load_data, False)


    print('Finished loading main() - auspex.py')

asyncio.ensure_future(main())


