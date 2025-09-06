import numpy as np
from matplotlib import pyplot as plt
from zipfile import ZipFile
import piplite
await piplite.install(['mini-auspex', 'scipy'])
from framework import file_civa, post_proc
from framework.data_types import ImagingROI
from imaging import saft

data = file_civa.read("SDH40mmPA_FMC_Contact.civa")
corner_roi = np.array([-10.0, 0.0, 30.0])[np.newaxis, :]
roi = ImagingROI(corner_roi, height=20.0, width=20.0, h_len=200, w_len=200)
key = saft.saft_kernel(data, roi=roi, sel_shot=0, c=5900.0)
image_out = data.imaging_results[key].image
plt.imshow(post_proc.envelope(image_out), aspect='auto',
           extent=[roi.w_points[0], roi.w_points[-1], roi.h_points[-1], roi.h_points[0]])
plt.title('SAFT')
plt.show()