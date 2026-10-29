import numpy as np, json, copy
from PIL import Image
from numpy.lib.stride_tricks import sliding_window_view
A=np.array(Image.open('/home/user/fitway/brand/fitway-logo.png'))[...,3].astype(np.float64)/255
A=np.clip(A/0.995,0,1)
S2=np.sqrt(0.5)
def L45m(c): return [-45.0, c*S2]   # x-y=c  -> n=(cos-45, sin-45)=(.707,-.707)
def L45p(c): return [45.0, c*S2]    # x+y=c
def E(c): return [c[0],c[1],c[2],c[2],0.0]
def from_v1(P):
    Q=dict(RO=E(P['RO']),RI=E(P['RI']),AO2=E(P['AO2']),AI2=E(P['AI2']),AO3=E(P['AO3']),AI3=E(P['AI3']),DOT=list(P['DOT']),
           g1=L45p(P['g1']),g2=L45p(P['g2']),c2a=L45m(P['c2a']),c2b=L45m(P['c2b']),c3=L45m(P['c3']),
           u1=L45m(P['u1']),u2=L45m(P['u2']),l1=L45p(P['l1']),l2=L45p(P['l2']),capL=L45m(P['capL']))
    return Q
def lf(l,x,y):
    t=np.radians(l[0]); return x*np.cos(t)+y*np.sin(t)-l[1]
def ein(e,x,y):
    t=np.radians(e[4]); dx=x-e[0]; dy=y-e[1]
    u=dx*np.cos(t)+dy*np.sin(t); v=-dx*np.sin(t)+dy*np.cos(t)
    return (u/e[2])**2+(v/e[3])**2<=1
def inside(P,x,y):
    disk=lambda c:(x-c[0])**2+(y-c[1])**2<=c[2]**2
    s=x+y
    ring = ein(P['RO'],x,y) & ~ein(P['RI'],x,y) & ~((lf(P['g1'],x,y)>0)&(lf(P['g2'],x,y)<0)&(x-y<0))
    arc2 = ein(P['AO2'],x,y) & ~ein(P['AI2'],x,y) & (lf(P['c2b'],x,y)>0) & ~((lf(P['c2a'],x,y)<0)&(s<1018))
    arc3 = ein(P['AO3'],x,y) & ~ein(P['AI3'],x,y) & (lf(P['c3'],x,y)<0) & (lf(P['l1'],x,y)>0)
    U = (lf(P['u1'],x,y)>=0)&(lf(P['u2'],x,y)<=0)&ein(P['AO2'],x,y)&(lf(P['l2'],x,y)<=0)
    L = (lf(P['l1'],x,y)>=0)&(lf(P['l2'],x,y)<=0)&(lf(P['capL'],x,y)>=0)&(lf(P['u2'],x,y)<=0)
    return ring|arc2|arc3|U|L|disk(P['DOT'])
SS=4
off=(np.arange(SS)+0.5)/SS
def coverage(P,ys,xs):
    X=(xs[:,None,None]+off[None,None,:]).repeat(SS,1)
    Y=(ys[:,None,None]+off[None,:,None]).repeat(SS,2)
    return inside(P,X,Y).mean(axis=(1,2))
m=(A>0.01)&(A<0.95)
band=sliding_window_view(np.pad(m,2),(5,5)).any(axis=(2,3))
BY,BX=np.where(band)
def err(P): return ((coverage(P,BY,BX)-A[BY,BX])**2).sum()
