import numpy as np, sys
from PIL import Image
from numpy.lib.stride_tricks import sliding_window_view
A=np.array(Image.open('/home/user/fitway/brand/fitway-logo.png'))[...,3].astype(float)/255; A=np.clip(A/0.995,0,1)
S=np.array(Image.open(sys.argv[1]))[...,3].astype(float)/255
D=S-A
print('mean |D|',np.abs(D).mean(),' pixels |D|>0.5:',(np.abs(D)>0.5).sum())
db=sliding_window_view(np.pad(D,1),(3,3)).mean(axis=(2,3))
print('box3 max',round(np.abs(db).max(),3),' box3>0.34 (≈>1px):',(np.abs(db)>0.34).sum(),' box3>0.5 (≈>1.5px):',(np.abs(db)>0.5).sum())
# integrated offset along edges: sum of D over 5x5 windows / edge length proxy
img=np.zeros((1024,1024,3),np.uint8)
img[...,0]=np.clip(D*255*3,0,255); img[...,1]=np.clip(-D*255*3,0,255); img[...,2]=(A*50).astype(np.uint8)
Image.fromarray(img).save('svg-diff.png')
# overlay: PNG in white, SVG outline in red
ov=np.zeros((1024,1024,3),np.uint8); ov[...]=(20,20,20)
ov=(ov*(1-A[...,None])+np.array([235,235,235])*A[...,None]).astype(np.uint8)
edge=(S>0.2)&(S<0.8)
ov[edge]=(229,25,53)
Image.fromarray(ov).save('svg-overlay.png')
