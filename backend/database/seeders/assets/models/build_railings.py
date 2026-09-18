"""Five photo-referenced railing visualizations, assumed meters, Y-up.

No stairs, floor or walls are included. Posts, rectangular handrails, glass,
clamps, mounting plates and screws are geometry. Not fabrication drawings.
"""
import sys
sys.dont_write_bytecode = True
import json
import re
from pathlib import Path
import build_showers_and_gates as m

def post(x,base,mat):
    m.box('Square mounting foot',mat,x-.06,x+.06,base,base+.012,-.06,.06,.003)
    m.box('Post base cover',mat,x-.038,x+.038,base+.012,base+.036,-.038,.038,.003)
    m.box('Rectangular upright',mat,x-.025,x+.025,base+.018,base+1.105,-.025,.025,.002)
    m.box('Post end cap',mat,x-.026,x+.026,base+1.105,base+1.11,-.026,.026,.001)
    for dx in (-.043,.043):
        for z in (-.043,.043):
            m.rod('Anchor screw heads',m.SILVER,(x+dx,base+.012,z),(x+dx,base+.015,z),.004)

def clamp(x,y,direction):
    left,right=sorted((x,x+direction*.04))
    m.box('Glass clamp body',m.SILVER,left,right,y-.024,y+.024,-.012,.018,.005)
    m.box('Clamp rubber pad',m.DARK,left+.002,right-.002,y-.018,y+.018,-.004,.004,.001)
    m.rod('Clamp screw',m.GOLD,((left+right)/2,y,.018),((left+right)/2,y,.021),.004)

def run(length=2.4,slope=0,mat=m.SILVER,brace=False,skip_first=False,bottom=False,bays=2):
    points=[-length/2+length*i/bays for i in range(bays+1)]
    height=lambda x:(x+length/2)*slope
    for i,x in enumerate(points):
        if not(skip_first and i==0):post(x,height(x),mat)
        for direction in (-1,1):
            if (i==0 and direction<0) or (i==bays and direction>0):continue
            for dy in (.29,.86):clamp(x+direction*.025,height(x)+dy,direction)
    m.core.beam('Continuous rectangular handrail',mat,(-length/2-.035,height(-length/2)+1.10,0),(length/2+.035,height(length/2)+1.10,0),.050,.048,.002)
    if bottom:
        m.core.beam('Lower frame rail',mat,(-length/2,.13,0),(length/2,height(length/2)+.13,0),.030,.040,.001)
    for a,b in zip(points,points[1:]):
        a+=.043;b-=.043
        # Four exposed edges give the clear pane visible thickness from oblique views.
        p=[(a,height(a)+.16,0),(b,height(b)+.16,0),(b,height(b)+1.045,0),(a,height(a)+1.045,0)]
        m.g.face('Clear glass infill',m.CLEAR,p)
        for j in range(4):
            m.core.beam('Polished glass edges',m.CLEAR,p[j],p[(j+1)%4],.004,.008,.0005)
        if brace:
            m.rod('Diagonal metal accent',m.SILVER,(a,height(a)+.18,-.017),(b,height(b)+1.02,-.017),.009)

def build(i):
    if i==1:
        run(4.0,bays=4)
        with m.place('Silver balcony corner return',x=2.0,z=-1.0,angle=90):
            run(2.0,skip_first=True,bays=2)
    elif i==2:run(2.0,.58,brace=True)
    elif i==3:run(2.0,bays=4)
    elif i==4:
        run(2.4,mat=m.BLACK,bottom=True,bays=4)
        with m.place('Balcony corner return',x=1.2,z=-.6,angle=90):
            run(1.2,mat=m.BLACK,skip_first=True,bottom=True,bays=3)
    elif i==5:run(2.4,.62)

if __name__=='__main__':
    names=re.findall(r"\['([^']+)',",(Path(__file__).parents[2]/'RailSeeder.php').read_text())
    manifest={}
    for i,name in enumerate(names,1):
        m.core.groups={}
        build(i)
        full=f'{name} {i:02}'
        manifest[full]=m.export(full,'rails',i)
    Path(__file__).with_name('railing-models.json').write_text(json.dumps(manifest,indent=2)+'\n')
