import json
from model3 import *
P=from_fit2(json.load(open('fit2.json')))
X=BX+0.5; Y=BY+0.5
def near(name):
    v=P[name]
    if name in K:
        d,r=rad(v,K[name],X,Y); return np.where(np.abs(d-r)<4)[0]
    if name=='DOT':
        return np.where(np.abs(np.hypot(X-v[0],Y-v[1])-v[2])<4)[0]
    return np.where(np.abs(lf(v,X,Y))<4)[0]
idx={k:near(k) for k in P}
cov=coverage(P,BY,BX); tgt=A[BY,BX]
e=((cov-tgt)**2).sum(); print('start',round(e,2),{k:len(v) for k,v in idx.items()},flush=True)
def local_err(k):
    ii=idx[k]; c=coverage(P,BY[ii],BX[ii]); return c, ((c-tgt[ii])**2).sum()
for step in (0.5,0.25,0.12,0.06,0.03):
    for rnd in range(6):
        improved=False
        for k,v in P.items():
            ii=idx[k]
            for i in range(len(v)):
                sc = (0.4 if (len(v)==2 and i==0) else (0.5 if (k in K and i>=3) else 1.0))
                cur=v[i]; c0,e0=local_err(k); best=(e0,cur,c0)
                for dv in (-step*sc,step*sc):
                    v[i]=cur+dv; c1,e1=local_err(k)
                    if e1<best[0]-1e-9: best=(e1,cur+dv,c1)
                v[i]=best[1]
                if best[1]!=cur: improved=True; cov[ii]=best[2]
        e=((cov-tgt)**2).sum()
        if not improved: break
    print('step',step,'err',round(e,3),flush=True)
    json.dump(P,open('fit3.json','w'),indent=1)
