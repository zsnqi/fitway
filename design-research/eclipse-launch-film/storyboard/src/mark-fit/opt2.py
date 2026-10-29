import json,sys
from model2 import *
P=from_v1(json.load(open('fit_v1.json')))
e=err(P); print('start',round(e,2),flush=True)
keys=[]
for k,v in P.items():
    for i in range(len(v)): keys.append((k,i))
def scale(k,i,v):
    if len(v)==2 and i==0: return 0.6     # line angle, degrees
    if len(v)==5 and i==4: return 6.0     # ellipse rotation, degrees
    return 1.0
for step in (1.0,0.5,0.25,0.12,0.06):
    improved=True; r=0
    while improved and r<5:
        improved=False; r+=1
        for k,i in keys:
            cur=P[k][i]; sc=scale(k,i,P[k]); best=(e,cur)
            for dv in (-step*sc,step*sc):
                P[k][i]=cur+dv; e2=err(P)
                if e2<best[0]: best=(e2,cur+dv)
            P[k][i]=best[1]
            if best[0]<e-1e-9: improved=True; e=best[0]
    print('step',step,'err',round(e,3),flush=True)
    json.dump(P,open('fit2.json','w'),indent=1)
