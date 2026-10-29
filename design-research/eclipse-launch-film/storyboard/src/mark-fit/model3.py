import numpy as np, json, copy, math
from PIL import Image
from numpy.lib.stride_tricks import sliding_window_view
A=np.array(Image.open('/home/user/fitway/brand/fitway-logo.png'))[...,3].astype(np.float64)/255
A=np.clip(A/0.995,0,1)
K={'RO':6,'RI':6,'AO2':4,'AI2':4,'AO3':4,'AI3':4}
def from_fit2(P2):
    Q={}
    for k in K:
        cx,cy,a,b,phi=P2[k]
        c=[cx,cy,(a+b)/2]
        # k=2 term from the ellipse: r ≈ r0 + (a-b)/2 cos 2(θ-φ)
        h=(a-b)/2; p=math.radians(phi)
        coefs=[0.0]*(2*(K[k]-1))
        coefs[0]=h*math.cos(2*p); coefs[1]=h*math.sin(2*p)
        Q[k]=c+coefs
    for k in ('g1','g2','c2a','c2b','c3','u1','u2','l1','l2','capL'): Q[k]=list(P2[k])
    Q['u2L']=list(P2['u2'])
    Q['DOT']=list(P2['DOT'])
    return Q
def rad(e,K_,x,y):
    dx=x-e[0]; dy=y-e[1]; th=np.arctan2(dy,dx)
    r=e[2]+0*th
    for i,k in enumerate(range(2,K_+1)):
        r=r+e[3+2*i]*np.cos(k*th)+e[4+2*i]*np.sin(k*th)
    return np.hypot(dx,dy), r
def ein(P,name,x,y):
    d,r=rad(P[name],K[name],x,y); return d<=r
def lf(l,x,y):
    t=np.radians(l[0]); return x*np.cos(t)+y*np.sin(t)-l[1]
def inside(P,x,y):
    s=x+y
    ring = ein(P,'RO',x,y) & ~ein(P,'RI',x,y) & ~((lf(P['g1'],x,y)>0)&(lf(P['g2'],x,y)<0)&(x-y<0))
    arc2 = ein(P,'AO2',x,y) & ~ein(P,'AI2',x,y) & (lf(P['c2b'],x,y)>0) & ~((lf(P['c2a'],x,y)<0)&(s<1018))
    arc3 = ein(P,'AO3',x,y) & ~ein(P,'AI3',x,y) & (lf(P['c3'],x,y)<0) & (lf(P['l1'],x,y)>0)
    U = (lf(P['u1'],x,y)>=0)&(lf(P['u2'],x,y)<=0)&ein(P,'AO2',x,y)&(lf(P['l2'],x,y)<=0)
    L = (lf(P['l1'],x,y)>=0)&(lf(P['l2'],x,y)<=0)&(lf(P['capL'],x,y)>=0)&(lf(P['u2L'],x,y)<=0)
    D=P['DOT']; dot=(x-D[0])**2+(y-D[1])**2<=D[2]**2
    return ring|arc2|arc3|U|L|dot
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
