import json, math, numpy as np
from PIL import Image
A=np.array(Image.open('/home/user/fitway/brand/fitway-logo.png'))[...,3].astype(float)/255; A=np.clip(A/0.995,0,1)
S=np.array(Image.open('svg3-raster.png'))[...,3].astype(float)/255
D=S-A
P=json.load(open('fit3.json')); K={'RO':6,'RI':6,'AO2':4,'AI2':4,'AO3':4,'AI3':4}
def bil(img,x,y):
    x0=np.floor(x-0.5).astype(int); y0=np.floor(y-0.5).astype(int); fx=x-0.5-x0; fy=y-0.5-y0
    return img[y0,x0]*(1-fx)*(1-fy)+img[y0,x0+1]*fx*(1-fy)+img[y0+1,x0]*(1-fx)*fy+img[y0+1,x0+1]*fx*fy
def r_of(n,th):
    e=P[n]; r=e[2]
    for i,k in enumerate(range(2,K[n]+1)): r+=e[3+2*i]*math.cos(k*th)+e[4+2*i]*math.sin(k*th)
    return r
def edge(px,py,nx,ny): return abs(bil(A,px-nx*2.5,py-ny*2.5)-bil(A,px+nx*2.5,py+ny*2.5))>0.85
allv=[]
for n in list(K)+['DOT']:
    vals=[]
    for a in np.arange(0,360,1.0):
        th=math.radians(a); nx,ny=math.cos(th),math.sin(th)
        if n=='DOT': cx,cy,r=P['DOT']
        else: cx,cy=P[n][0],P[n][1]; r=r_of(n,th)
        px,py=cx+r*nx,cy+r*ny
        tx,ty=-ny,nx
        if not (edge(px,py,nx,ny) and edge(px+tx*5,py+ty*5,nx,ny) and edge(px-tx*5,py-ty*5,nx,ny)): continue
        t=np.linspace(-3.5,3.5,71); vals.append(bil(D,px+nx*t,py+ny*t).sum()*(t[1]-t[0]))
    v=np.abs(np.array(vals)); allv+=list(v)
    print(f'{n:4s} n={len(v):3d} rms={np.sqrt((v**2).mean()):.2f} max={v.max():.2f} >1px={(v>1).sum()}')
for n in ('g1','g2','c2a','c3','u1','l1','l2','capL'):
    th=math.radians(P[n][0]); nx,ny=math.cos(th),math.sin(th); tx,ty=-ny,nx; vals=[]
    for s in np.arange(-800,800,2.0):
        px=nx*P[n][1]+tx*s; py=ny*P[n][1]+ty*s
        if not (4<px<1019 and 4<py<1019): continue
        if not (edge(px,py,nx,ny) and edge(px+tx*4,py+ty*4,nx,ny) and edge(px-tx*4,py-ty*4,nx,ny)): continue
        t=np.linspace(-3.5,3.5,71); vals.append(bil(D,px+nx*t,py+ny*t).sum()*(t[1]-t[0]))
    if vals:
        v=np.abs(np.array(vals)); allv+=list(v); print(f'{n:4s} n={len(v):3d} rms={np.sqrt((v**2).mean()):.2f} max={v.max():.2f}')
allv=np.array(allv); print('ALL edges: n',len(allv),'rms %.2f'%np.sqrt((allv**2).mean()),'p95 %.2f'%np.percentile(allv,95),'max %.2f'%allv.max(),'share>1px %.1f%%'%(100*(allv>1).mean()))
