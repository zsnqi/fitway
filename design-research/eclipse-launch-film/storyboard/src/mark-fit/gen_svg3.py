import json, math, numpy as np
P=json.load(open('fit3.json'))
K={'RO':6,'RI':6,'AO2':4,'AI2':4,'AO3':4,'AI3':4}
def r_of(name,th):
    e=P[name]; r=e[2]
    for i,k in enumerate(range(2,K[name]+1)): r+=e[3+2*i]*math.cos(k*th)+e[4+2*i]*math.sin(k*th)
    return r
def pt(name,th):
    e=P[name]; r=r_of(name,th); return (e[0]+r*math.cos(th), e[1]+r*math.sin(th))
def line(name):
    th=math.radians(P[name][0]); return (math.cos(th),math.sin(th)),P[name][1]
def lval(name,p):
    n,c=line(name); return n[0]*p[0]+n[1]*p[1]-c
def x_curve_line(cname,lname,approx):
    # find theta near approx (radians) where the curve meets the line
    f=lambda th: lval(lname,pt(cname,th))
    best=None
    ths=np.linspace(approx-0.6,approx+0.6,241)
    vals=[f(t) for t in ths]
    for i in range(len(ths)-1):
        if vals[i]==0 or vals[i]*vals[i+1]<0:
            a,b=ths[i],ths[i+1]
            for _ in range(60):
                m=(a+b)/2
                if f(a)*f(m)<=0: b=m
                else: a=m
            th=(a+b)/2
            if best is None or abs(th-approx)<abs(best-approx): best=th
    assert best is not None,(cname,lname)
    return best
def x_line_line(a,b):
    (n1,c1),(n2,c2)=line(a),line(b); return tuple(np.linalg.solve(np.array([n1,n2]),np.array([c1,c2])))
def ang(name,p):
    e=P[name]; return math.atan2(p[1]-e[1],p[0]-e[0])
def curve_path(name,t0,t1,step=math.radians(1.5)):
    # cubic Beziers (Catmull-Rom through samples) from angle t0 to t1 (t1 may be < t0)
    n=max(2,int(abs(t1-t0)/step)+1)
    ts=np.linspace(t0,t1,n+1)
    pts=[pt(name,t) for t in ts]
    # tangent by derivative
    h=1e-4
    def d(t):
        a=pt(name,t-h); b=pt(name,t+h); return ((b[0]-a[0])/(2*h),(b[1]-a[1])/(2*h))
    out=[]
    for i in range(n):
        ta,tb=ts[i],ts[i+1]; dt=tb-ta
        pa,pb=pts[i],pts[i+1]; da,db=d(ta),d(tb)
        c1=(pa[0]+da[0]*dt/3,pa[1]+da[1]*dt/3); c2=(pb[0]-db[0]*dt/3,pb[1]-db[1]*dt/3)
        out.append(f"C{c1[0]:.3f} {c1[1]:.3f} {c2[0]:.3f} {c2[1]:.3f} {pb[0]:.3f} {pb[1]:.3f}")
    return " ".join(out)
F=lambda p:f"{p[0]:.3f} {p[1]:.3f}"
R=math.radians
paths={}
# ring: outer from the gap's upper end (g1, ~148 deg) clockwise round the top to the lower end (g2, ~123 deg + 360)
a_ro_g1=x_curve_line('RO','g1',R(148)); a_ro_g2=x_curve_line('RO','g2',R(123))
a_ri_g1=x_curve_line('RI','g1',R(150)); a_ri_g2=x_curve_line('RI','g2',R(121))
paths['ring']=f"M{F(pt('RO',a_ro_g1))} "+curve_path('RO',a_ro_g1,a_ro_g2+2*math.pi)+f" L{F(pt('RI',a_ri_g2+2*math.pi))} "+curve_path('RI',a_ri_g2+2*math.pi,a_ri_g1)+" Z"
# arc2: from the upper-left cut c2a (~-122 deg) clockwise over the top to c2b (~+45 deg)
a_ao2_a=x_curve_line('AO2','c2a',R(-125)); a_ai2_a=x_curve_line('AI2','c2a',R(-128))
a_ao2_b=x_curve_line('AO2','c2b',R(45)); a_ai2_b=x_curve_line('AI2','c2b',R(45))
paths['arc2']=f"M{F(pt('AO2',a_ao2_a))} "+curve_path('AO2',a_ao2_a,a_ao2_b)+f" L{F(pt('AI2',a_ai2_b))} "+curve_path('AI2',a_ai2_b,a_ai2_a)+" Z"
# arc3: from the lower-right cut c3 (~+45 deg) clockwise round the bottom to l1 (~+150 deg)
a_ao3_c=x_curve_line('AO3','c3',R(48)); a_ai3_c=x_curve_line('AI3','c3',R(50))
a_ao3_l=x_curve_line('AO3','l1',R(150)); a_ai3_l=x_curve_line('AI3','l1',R(155))
paths['arc3']=f"M{F(pt('AO3',a_ao3_c))} "+curve_path('AO3',a_ao3_c,a_ao3_l)+f" L{F(pt('AI3',a_ai3_l))} "+curve_path('AI3',a_ai3_l,a_ai3_c)+" Z"
# upper arm: cap on AO2 between u1 and u2 (~-150 deg), far end at l2
a_u1=x_curve_line('AO2','u1',R(-150)); a_u2=x_curve_line('AO2','u2',R(-138))
p3=x_line_line('u2','l2'); p4=x_line_line('u1','l2')
paths['armU']=f"M{F(pt('AO2',a_u1))} "+curve_path('AO2',a_u1,a_u2)+f" L{F(p3)} L{F(p4)} Z"
q=[x_line_line('l1','capL'),x_line_line('l2','capL'),x_line_line('l2','u2L'),x_line_line('l1','u2L')]
paths['armL']="M"+" L".join(F(p) for p in q)+" Z"
D=P['DOT']
svg='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024" width="1024" height="1024">\n<g fill="#FFFFFF">\n'+"\n".join(f'<path id="{k}" d="{v}"/>' for k,v in paths.items())+f'\n<circle id="dot" cx="{D[0]:.3f}" cy="{D[1]:.3f}" r="{D[2]:.3f}"/>\n</g>\n</svg>\n'
open('fitway-mark-v3.svg','w').write(svg)
# construction geometry: the ideal circles (centre and base radius) and the lines
geo=dict(viewBox=1024,paths=paths,dot=dict(cx=D[0],cy=D[1],r=D[2]),
  circles={k:dict(cx=P[k][0],cy=P[k][1],r=P[k][2]) for k in K},
  lines={k:dict(angle=P[k][0],c=P[k][1]) for k in ('g1','g2','c2a','c2b','c3','u1','u2','u2L','l1','l2','capL')},
  nodes=dict(ring=[pt('RO',a_ro_g1),pt('RO',a_ro_g2),pt('RI',a_ri_g1),pt('RI',a_ri_g2)],
             arc2=[pt('AO2',a_ao2_a),pt('AI2',a_ai2_a),pt('AO2',a_ao2_b),pt('AI2',a_ai2_b)],
             arc3=[pt('AO3',a_ao3_c),pt('AI3',a_ai3_c),pt('AO3',a_ao3_l),pt('AI3',a_ai3_l)],
             arms=[pt('AO2',a_u1),pt('AO2',a_u2),p3,p4]+q))
json.dump(geo,open('mark-geometry-v3.json','w'),indent=1)
print(len(svg),'bytes')
