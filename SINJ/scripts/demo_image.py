import argparse
import os
import sys
import cv2
import numpy as np
import torch
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from easydict import EasyDict as edict
from SINJ.models import builder
from SINJ.utils.config import update_config
from SINJ.utils.presets import SimpleTransform3DSMPLCam
from SINJ.utils.vis import get_one_box
from torchvision import transforms as T
from torchvision.models.detection import fasterrcnn_resnet50_fpn
from tqdm import tqdm

# FORCE CPU
device = torch.device("cpu")

det_transform = T.Compose([T.ToTensor()])


# ✅ SIMPLE OBJ SAVE FUNCTION (NO PYTORCH3D)
def save_obj_simple(verts, faces, path):
    verts = verts.squeeze(0).cpu().numpy()
    faces = faces.cpu().numpy()

    with open(path, 'w') as f:
        for v in verts:
            f.write(f"v {v[0]} {v[1]} {v[2]}\n")
        for face in faces:
            f.write(f"f {face[0]+1} {face[1]+1} {face[2]+1}\n")

    print(f"Saved OBJ: {path}")


def xyxy2xywh(bbox):
    x1, y1, x2, y2 = bbox
    cx = (x1 + x2) / 2
    cy = (y1 + y2) / 2
    w = x2 - x1
    h = y2 - y1
    return [cx, cy, w, h]


parser = argparse.ArgumentParser()
parser.add_argument('--img-dir', type=str, required=True)
parser.add_argument('--out-dir', type=str, required=True)
opt = parser.parse_args()

cfg_file = 'configs/256x192_adam_lr1e-3-hrw48_cam_2x_w_pw3d_3dhp.yaml'
CKPT = './pretrained_models/sinj_hrnet.pth'

cfg = update_config(cfg_file)

bbox_3d_shape = getattr(cfg.MODEL, 'BBOX_3D_SHAPE', (2000, 2000, 2000))
bbox_3d_shape = [item * 1e-3 for item in bbox_3d_shape]

dummy_set = edict({
    'joint_pairs_17': None,
    'joint_pairs_24': None,
    'joint_pairs_29': None,
    'bbox_3d_shape': bbox_3d_shape
})

transformation = SimpleTransform3DSMPLCam(
    dummy_set,
    scale_factor=cfg.DATASET.SCALE_FACTOR,
    color_factor=cfg.DATASET.COLOR_FACTOR,
    occlusion=cfg.DATASET.OCCLUSION,
    input_size=cfg.MODEL.IMAGE_SIZE,
    output_size=cfg.MODEL.HEATMAP_SIZE,
    depth_dim=cfg.MODEL.EXTRA.DEPTH_DIM,
    bbox_3d_shape=bbox_3d_shape,
    rot=cfg.DATASET.ROT_FACTOR,
    sigma=cfg.MODEL.EXTRA.SIGMA,
    train=False,
    add_dpg=False,
    loss_type=cfg.LOSS['TYPE']
)

print("Loading detection model...")
det_model = fasterrcnn_resnet50_fpn(pretrained=True).to(device)
det_model.eval()

print("Loading SINJ model...")
hybrik_model = builder.build_sppe(cfg.MODEL).to(device)

save_dict = torch.load(CKPT, map_location=device)

try:
    hybrik_model.load_state_dict(save_dict['model'])
except:
    hybrik_model.load_state_dict(save_dict)

hybrik_model.eval()

smpl_faces = torch.from_numpy(hybrik_model.smpl.faces.astype(np.int32))

os.makedirs(opt.out_dir, exist_ok=True)

files = os.listdir(opt.img_dir)

for file in tqdm(files):
    if file.endswith(('.jpg', '.png')):

        img_path = os.path.join(opt.img_dir, file)
        basename = os.path.basename(img_path)

        image = cv2.cvtColor(cv2.imread(img_path), cv2.COLOR_BGR2RGB)

        # 🔍 Detection
        det_input = det_transform(image).to(device)
        det_output = det_model([det_input])[0]
        bbox = get_one_box(det_output)

        # 🧠 SINJ inference
        pose_input, bbox, img_center = transformation.test_transform(image, bbox)
        pose_input = pose_input.to(device)[None, :, :, :]

        pose_output = hybrik_model(
            pose_input,
            flip_test=True,
            bboxes=torch.tensor(bbox).float().unsqueeze(0).to(device),
            img_center=torch.tensor(img_center).float().unsqueeze(0).to(device)
        )

        vertices = pose_output.pred_vertices.detach()

        # 💾 SAVE OBJ (MAIN OUTPUT)
        obj_path = os.path.join(opt.out_dir, basename.replace('.jpg', '.obj').replace('.png', '.obj'))
        save_obj_simple(vertices, smpl_faces, obj_path)

print("DONE")