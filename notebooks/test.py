import numpy as np
from matplotlib import pyplot as plt
from zipfile import ZipFile
import piplite
await piplite.install(['mini-auspex', 'scipy'])
from framework import file_civa, post_proc, file_m2k
from framework.data_types import ImagingROI
from imaging import saft

# import json
# from js import JSON

def run_saft(x_roi, y_roi, z_roi):     
    #p_roy = json.loads(JSON.parse(obj_roi))
    data = file_civa.read("SDH40mmPA_FMC_Contact.civa")
    corner_roi = np.array([x_roi, y_roi, z_roi])[np.newaxis, :]
    roi = ImagingROI(corner_roi, height=20.0, width=20.0, h_len=200, w_len=200)
    key = saft.saft_kernel(data, roi=roi, sel_shot=0, c=5900.0)
    image_out = data.imaging_results[key].image
    plt.imshow(post_proc.envelope(image_out), aspect='auto',
            extent=[roi.w_points[0], roi.w_points[-1], roi.h_points[-1], roi.h_points[0]])
    plt.title('SAFT')
    plt.show()

def sum():
    1 + 1

def load_data():
    data = file_civa.read("SDH40mmPA_FMC_Contact.civa")
    readonly_params = 'false'
    insp_pars = [
        {'title': 'Inspection Type', 'name': 'inspection_params.type_insp', 'type': 'list',
            'values': {"Immersion": 'immersion', "Contact": "contact"},
            'value': data.inspection_params.type_insp, 'readonly': readonly_params},

        {'title': 'Excitation', 'name': 'inspection_params.type_capt', 'type': 'str',
            'value': data.inspection_params.type_capt, 'readonly': 'true'},

        {'title': 'Origin [mm]', 'name': 'inspection_params.point_origin', 'type': 'str',
            'value': f"{data.inspection_params.point_origin}", 'readonly': 'true'},

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
            'value': data.inspection_params.gain_hw, 'readonly': 'true',
            'decimals': 6},

        {'title': 'Digital Gain [dB]', 'name': 'inspection_params.gain_sw', 'type': 'float',
            'value': data.inspection_params.gain_sw, 'readonly': 'true',
            'decimals': 6},
    ]
    
    probe_pars = get_probe_params(data, readonly_params)

    return_data = {'insp_pars': insp_pars, "probe_pars": probe_pars}
    return return_data

def get_probe_params(data, readonly_params):
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