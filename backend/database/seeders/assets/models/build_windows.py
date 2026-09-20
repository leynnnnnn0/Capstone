"""Ten photo-referenced window GLBs. Assumed meters, Y-up; no surrounding walls."""
import sys
sys.dont_write_bytecode = True
import math
import json
import re
from pathlib import Path
from contextlib import contextmanager
import build_showers_and_gates as m

g, core = m.g, m.core
box, frame, place = m.box, m.frame, m.place
WHITE, BLACK, WOOD = m.WHITE, m.BLACK, m.WOOD

@contextmanager
def tilt(y, degrees):
    """Tilt around a horizontal hinge without changing frame thickness."""
    old = g.face
    c, s = math.cos(math.radians(degrees)), math.sin(math.radians(degrees))
    def face(name, mat, points):
        old(name, mat, [(x, y+c*(py-y)-s*z, s*(py-y)+c*z) for x,py,z in points])
    g.face = core.face = face
    try:
        yield
    finally:
        g.face = core.face = old

def screen(name, a,b,lo,hi,z,mat):
    frame(name+' surround',mat,a,b,lo,hi,z,.026,.022)
    # Fine geometric mesh, visible from both sides without external textures.
    step=.018
    for i in range(1,int((b-a)/step)):
        x=a+i*step
        box(name+' mesh',m.DARK,x,x+.0008,lo+.027,hi-.027,z-.0004,z+.0004,.0001)
    for i in range(1,int((hi-lo)/step)):
        y=lo+i*step
        box(name+' mesh',m.DARK,a+.027,b-.027,y,y+.0008,z-.0004,z+.0004,.0001)

def sash(name,a,b,lo,hi,z,mat,grid=False):
    frame(name+' sash',mat,a,b,lo,hi,z,.035,.035)
    m.sheet(name+' glass',a+.035,b-.035,lo+.035,hi-.035,z)
    frame(name+' glazing gasket',m.DARK,a+.030,b-.030,lo+.030,hi-.030,z,.005,.008)
    if grid:
        box(name+' vertical grid',mat,(a+b)/2-.009,(a+b)/2+.009,lo+.035,hi-.035,z-.006,z+.006)
        for t in (1/3,2/3):
            y=lo+(hi-lo)*t
            box(name+' horizontal grid',mat,a+.035,b-.035,y-.009,y+.009,z-.006,z+.006)

def perimeter(w,h,mat):
    frame('Outer jamb',mat,-w/2,w/2,0,h,0,.045,.070)
    box('Sill extrusion',mat,-w/2,w/2,0,.018,-.045,.055)

def sliders(w,h,mat,count=2,grid=False):
    perimeter(w,h,mat)
    for z in (-.024,.024):
        for y in (.037,h-.037):
            box('Sliding guide track',mat,-w/2+.045,w/2-.045,y-.003,y+.003,z-.003,z+.003)
    for j in range(count):
        a=-w/2+.048+j*(w-.096)/count
        b=-w/2+.048+(j+1)*(w-.096)/count
        z=-.020 if j%2 else .023
        sash('Sliding leaf '+str(j+1),a-.008,b+.008,.05,h-.05,z,mat,grid)
        m.handle('Leaf pull '+str(j+1),b-.05,h*.48,z+.02,mat,length=.10)

def awnings(w,h,cols,rows):
    perimeter(w,h,WHITE)
    for j in range(cols):
        a=-w/2+.048+j*(w-.096)/cols
        b=-w/2+.048+(j+1)*(w-.096)/cols
        for k in range(rows):
            lo=.05+k*(h-.10)/rows
            hi=.05+(k+1)*(h-.10)/rows
            frame('Awning opening',WHITE,a,b,lo,hi,0,.026,.05)
            with tilt(hi-.03,-16):
                sash('Awning leaf',a+.029,b-.029,lo+.03,hi-.03,0,WHITE)
                m.handle('Awning latch',(a+b)/2,lo+.09,.025,WHITE,length=.075)
            for x in (a+.04,b-.04):
                m.rod('Friction stay',m.SILVER,(x,hi-.10,0),(x,lo+.13,(hi-lo)*.20),.004)

def build(i):
    if i==1:
        perimeter(1.4,1.5,BLACK)
        box('Fixed center mullion',BLACK,-.025,.025,.045,1.455,-.035,.035)
        for side in (-1,1):
            with place('Casement '+str(side),x=side*.647,angle=side*20):
                a,b=(0,.637) if side<0 else (-.637,0)
                sash('Glass leaf',a,b,.05,1.45,0,BLACK)
                m.handle('Casement lever',b-.06 if side<0 else a+.06,.72,.025,BLACK,length=.11,horizontal=True)
                for y in (.25,1.20): m.rod('Hinge barrel',m.SILVER,(0,y,0),(0,y+.07,0),.007)
    elif i==2:
        awnings(1.8,1.4,3,2)
    elif i==3:
        perimeter(.75,1.45,BLACK)
        sash('Upper glass',-.327,.327,.74,1.40,0,BLACK)
        screen('Lower insect screen',-.327,.327,.05,.75,.012,BLACK)
    elif i==4:
        sliders(1.1,1.0,BLACK)
        for lo,hi in ((1.0,1.4),(-.40,0)):
            for a,b in ((-.55,0),(0,.55)): sash('Fixed light',a,b,lo,hi,0,BLACK)
    elif i==5:
        perimeter(1.2,1.3,BLACK)
        box('Center mullion',BLACK,-.025,.025,.04,1.26,-.03,.03)
        for a,b in ((-.55,-.035),(.035,.55)):
            for j in range(9):
                y=.055+j*.132
                with tilt(y+.13,-27):
                    m.sheet('Glass louver',a,b,y,y+.139,0)
                    box('Blade lower edge',BLACK,a,b,y,y+.009,-.004,.004)
                    for x in (a,b-.013): box('Blade clip',BLACK,x,x+.013,y+.01,y+.125,-.006,.006)
    elif i==6: sliders(1.3,1.2,WOOD)
    elif i==7: awnings(1.95,.8,3,1)
    elif i==8:
        sliders(1.8,1.15,WHITE,3)
        # Shallow segmental fanlight; no wall-shaped solid behind the glass.
        points=[(-.9+1.8*j/48,1.15+.42*math.sin(math.pi*j/48),0) for j in range(49)]
        for a,b in zip(points,points[1:]):
            core.beam('Arched header',WHITE,a,b,.035,.06,.001)
            g.face('Fanlight glass',m.CLEAR,[(0,1.15,0),a,b])
        for j in (12,24,36): core.beam('Fanlight radial bar',WHITE,(0,1.15,0),points[j],.025,.025,.001)
    elif i==9:
        sliders(3.2,1.20,WHITE,6,True)
        for j in range(4): sash('Transom',-1.6+j*.8,-.8+j*.8,1.2,1.55,0,WHITE)
    elif i==10:
        sliders(1.4,1.2,BLACK)
        screen('Sliding insect screen',-.65,-.05,.05,1.15,-.057,BLACK)

if __name__=='__main__':
    root=Path(__file__).parent
    names=re.findall(r"\['([^']+)',",(root.parents[1]/'WindowSeeder.php').read_text())
    manifest={}
    for i,name in enumerate(names,1):
        core.groups={}
        with place('Window',y=.4 if i==4 else 0):
            build(i)
        full=f'{name} {i:02d}'
        manifest[full]=m.export(full,'windows',i)
    (root/'window-models.json').write_text(json.dumps(manifest,indent=2)+'\n')
