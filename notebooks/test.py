import numpy as np
from matplotlib import pyplot as plt
import piplite
await piplite.install(['mini-auspex', 'scipy'])
from framework import file_civa, post_proc, file_m2k
from framework.data_types import ImagingROI
from imaging import saft
import os, json
import zipfile
import io
import shutil
# import json
# from js import JSON
import json

import base64
def save_bytes_as_file(b64, filename):
    data = base64.b64decode(b64)
    with open(filename, "wb") as f:
        f.write(data)
    
    extract_zip_rename_root(filename)

    return list_data()

def run_saft(roi_data, selected_insp):
    # roi_data = json.loads(roi_all)
    #p_roy = json.loads(JSON.parse(obj_roi))
    data = file_civa.read(selected_insp.strip())
    corner_roi = np.array([roi_data["x"], roi_data["y"], roi_data["z"]])[np.newaxis, :]
    roi = ImagingROI(corner_roi, height=20.0, width=20.0, h_len=200, w_len=200)
    key = saft.saft_kernel(data, roi=roi, sel_shot=0, c=5900.0)
    image_out = data.imaging_results[key].image
    plt.imshow(post_proc.envelope(image_out), aspect='auto',
            extent=[roi.w_points[0], roi.w_points[-1], roi.h_points[-1], roi.h_points[0]])
    plt.title('SAFT')
    plt.show()

def saft(params):

    data = file_civa.read(params["selected_file"].strip())

    corner_roi = np.array([params["x"], params["y"], params["z"]])[np.newaxis, :]
    roi = ImagingROI(corner_roi, height=roi.height, width=roi.width, h_len=roi.pixelheight, w_len=roi.pixelwidth)

    scattering_angle = params["scattering_angle"]

    if (params != ""):
      key = saft.saft_kernel(data, roi=roi, sel_shot=params["sel_shot"], c=params["c"], scattering_angle=scattering_angle)
    else:
      key = saft.saft_kernel(data, roi=roi, sel_shot=params["sel_shot"], c=params["c"])

    image_out = data.imaging_results[key].image

    plt.imshow(post_proc.envelope(image_out), aspect='auto',
            extent=[roi.w_points[0], roi.w_points[-1], roi.h_points[-1], roi.h_points[0]])
    plt.title('SAFT')
    plt.show()


def list_data():    
    return os.listdir(".")

def load_data(selected_insp):

    if selected_insp.endswith('.zip'):
        extract_zip_rename_root(selected_insp)

    if (selected_insp.endswith('.civa')):
        data = file_civa.read(selected_insp)
    else:
        data = file_m2k.read(selected_insp, type_insp='contact', water_path=0, freq_transd=5, bw_transd=0.8,
                     tp_transd='gaussian', sel_shots=0)
        
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

    shot = data.ascan_data.shape[3] - 1

    return_data = {'insp_pars': insp_pars, "probe_pars": probe_pars, "max_shot": shot}
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

def extract_zip_rename_root(zip_path: str, delete_zip: bool = True):    
    """
    Extract a ZIP while keeping the internal structure,
    but rename the root folder to target_folder
    """
    target_folder: str
    final_folder: str

    # 1. Remove the .zip extension
    final_folder = zip_path[:-4] if zip_path.endswith(".zip") else zip_path
    
    # 2. Create a new version replacing the ending .civa or .m2k with -civa or -m2k
    if final_folder.endswith(".civa"):
        target_folder = final_folder.replace(".civa", "-civa")
    elif final_folder.endswith(".m2k"):
        target_folder = final_folder.replace(".m2k", "-m2k")
    else:
        target_folder = final_folder  # keep it unchanged if it's neither

    os.makedirs(target_folder, exist_ok=True)

    # Read ZIP into memory
    with open(zip_path, "rb") as f:
        zip_bytes = f.read()
    zip_buffer = io.BytesIO(zip_bytes)

    with zipfile.ZipFile(zip_buffer) as zf:
        # Detect the root folder (assuming the ZIP has a single root)
        root_folders = set(f.filename.split('/')[0] for f in zf.infolist() if f.filename.strip())
        if len(root_folders) != 1:
            raise ValueError("The ZIP contains multiple root folders. Cannot rename automatically.")

        old_root = list(root_folders)[0]

        for member in zf.infolist():
            if member.filename.strip() == "":
                continue  # Ignore empty entries
            # Replace the root with target_folder
            relative_path = member.filename[len(old_root):].lstrip('/')
            final_path = os.path.join(target_folder, relative_path)
            if member.is_dir():
                os.makedirs(final_path, exist_ok=True)
            else:
                os.makedirs(os.path.dirname(final_path), exist_ok=True)
                with zf.open(member) as source, open(final_path, "wb") as dest:
                    shutil.copyfileobj(source, dest)
    os.rename(target_folder, final_folder)
    # Remove the original ZIP if requested
    if delete_zip and os.path.exists(zip_path):
        os.remove(zip_path)

