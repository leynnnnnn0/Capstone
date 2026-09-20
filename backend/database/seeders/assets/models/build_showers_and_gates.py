"""Photo-referenced catalog GLBs; assumed dimensions, meters, Y-up.

All 18 shower listings and all 15 gates. No room fixtures or fence returns.
Run this file to rebuild assets and the explicit seeder manifest.
"""
import sys
sys.dont_write_bytecode = True
import json
import math
import re
import struct
from pathlib import Path
import build_remaining_cabinets as g
from build_side_panel_doors import texture_png, wood_pixel

core=g.core
box,frame,place=g.box,g.frame,g.place
WHITE,SILVER,CLEAR,DARK,WOOD,BROWN,BLACK,GOLD,FROST=range(9)
MATS=[('White powder coat',[.88,.9,.91,1],.2,.3),
      ('Polished silver hardware',[.65,.68,.7,1],.92,.19),
      ('Clear glass',[.70,.86,.88,.17],.03,.07),
      ('Rubber seals',[.025,.03,.032,1],0,.8),
      ('Wood finish',[1,1,1,1],.15,.35),
      ('Warm brown panel',[.32,.09,.035,1],.2,.34),
      ('Black powder coat',[.025,.032,.038,1],.55,.28),
      ('Fasteners',[.42,.44,.46,1],.8,.3),
      ('Frosted privacy glass',[.70,.79,.8,.78],0,.68)]

def rod(name,mat,a,b,r=.008): core.rod(name,mat,a,b,r,16)

def sheet(name,x0,x1,y0,y1,z,mat=CLEAR):
    g.face(name,mat,[(x0,y0,z),(x1,y0,z),(x1,y1,z),(x0,y1,z)])
    # Thin visible perimeter edges suggest the nominal pane thickness.
    for a,b in [((x0,y0,z),(x0,y1,z)),((x1,y0,z),(x1,y1,z))]:
        rod(name+' glass edges',CLEAR,a,b,.002)

def pane(name,x0,x1,y0,y1,z,style='clear',framed=None):
    if style in ('band','stripe'):
        lo,hi=y0+(y1-y0)*.23,y0+(y1-y0)*.76
        sheet(name+' lower clear',x0,x1,y0,lo,z)
        sheet(name+' privacy band',x0,x1,lo,hi,z,FROST)
        sheet(name+' upper clear',x0,x1,hi,y1,z)
        if style=='stripe':
            for i in range(1,int((x1-x0)/.012)):
                x=x0+i*.012
                g.face(name+' etched stripes',FROST,[(x,y0,z+.0005),(x+.0016,y0,z+.0005),(x+.0016,y1,z+.0005),(x,y1,z+.0005)])
    else: sheet(name,x0,x1,y0,y1,z,FROST if style=='frost' else CLEAR)
    if framed is not None: frame(name+' frame',framed,x0-.012,x1+.012,y0-.012,y1+.012,z,.023,.028)
    else:
        box(name+' lower seal',CLEAR,x0,x1,y0,y0+.009,z-.004,z+.004)

def handle(name,x,y,z,mat=SILVER,length=.20,horizontal=False):
    g.pull(name,x,y,z,mat,horizontal,length)

def hinges(name,x,z,mat=SILVER):
    for y in (.28,1.64):
        box(name+' hinge plate',mat,x-.021,x+.021,y-.038,y+.038,z-.012,z+.014)
        rod(name+' hinge pin',mat,(x,y-.043,z+.017),(x,y+.043,z+.017),.008)
        for dy in (-.022,.022): rod(name+' screws',GOLD,(x-.010,y+dy,z+.014),(x-.010,y+dy,z+.017),.003)

def ring(name,x,y,z):
    for i in range(32):
        a,b=i*math.tau/32,(i+1)*math.tau/32
        rod(name,SILVER,(x+.024*math.cos(a),y+.024*math.sin(a),z),(x+.024*math.cos(b),y+.024*math.sin(b),z),.004)

def sliding(w,style,mat=None,roller=False):
    a,b=-w/2,w/2
    if roller:
        rod('Top sliding rail',SILVER,(a,1.87,.020),(b,1.87,.020),.016)
        for x in (a+.03,b-.03):
            rod('Rail wall sockets',SILVER,(x,1.87,-.012),(x,1.87,.026),.024)
    else:
        frame('Perimeter jamb',mat,a-.026,b+.026,.012,2.03,0,.030,.052)
        for y in (.035,2.00):
            for z in (-.015,.025):
                box('Twin running tracks',mat,a,b,y-.003,y+.003,z-.004,z+.004)
    pane('Fixed left pane',a+.014,.035,.06,1.99,-.014,style,None if roller else mat)
    pane('Sliding right pane',-.030,b-.014,.06,1.99,.025,style,None if roller else mat)
    if roller:
        for x in (.07,b-.10):
            rod('Exposed roller wheels',SILVER,(x,1.91,.022),(x,1.91,.052),.027)
            rod('Roller axle',GOLD,(x,1.91,.052),(x,1.91,.056),.008)
            box('Roller door brackets',SILVER,x-.012,x+.012,1.84,1.94,.021,.035)
        ring('Circular recessed pull',.08,1.02,.034)
        box('Floor guide',SILVER,-.03,.04,.02,.06,-.024,.040)
    else:
        handle('Sliding pull',b-.065,1.0,.045,mat)
        handle('Reverse sliding pull',-.0,1.,-.035,mat)

def hinged(w,style='clear',single=False,corner=False):
    a,b=-w/2,w/2
    split=a if single else b-.65
    if not single:
        pane('Fixed panel',a,split-.006,.03,2.,0,style)
        for y in (.09,1.93): box('Fixed panel wall clamps',SILVER,a-.012,a+.024,y-.02,y+.02,-.012,.014)
    pane('Hinged door',split+.005,b,.035,2.,0,style)
    hinges('Door',b-.015,0)
    handle('Door pull',split+.075,1.,.009,length=.22,horizontal=False)
    if corner:
        with place('Return glass',x=a,z=-.45,angle=90):
            pane('Fixed side',-.45,.45,.03,2.,0,style)
            for x in (-.42,.42): box('Return corner clamps',SILVER,x-.023,x+.023,1.94,1.98,-.012,.014)

def rounded_frame(name,mat,a,b,lo,hi,z,r=.016):
    for start,end in [((a,lo,z),(a,hi,z)),((b,lo,z),(b,hi,z)),((a,lo,z),(b,lo,z)),((a,hi,z),(b,hi,z))]:
        rod(name,mat,start,end,r)

def shower(i):
    if i==4:
        rounded_frame('Rounded silver perimeter',SILVER,-.70,.70,.03,2.03,0,.025)
        for name,a,b,z in [('Fixed pane',-.675,.018,-.012),('Sliding pane',-.018,.675,.024)]:
            pane(name,a,b,.06,2.,z,'stripe')
            rounded_frame(name+' rounded edging',SILVER,a,b,.06,2.,z,.010)
        handle('Rounded door pull',.60,1.0,.045,SILVER,length=.24)
    elif i==16:
        # Left two-leaf sliding opening, right fixed panel; two transom lights.
        with place('Two-panel sliding section',x=-.45):
            sliding(1.2,'frost',WHITE)
        pane('Single fixed right partition',.18,1.05,.035,2.015,0,'frost',WHITE)
        frame('Transom perimeter',WHITE,-1.076,1.076,2.035,2.4,0,.03,.05)
        for a,b in ((-1.046,.15),(.18,1.046)):
            pane('Transom glass',a,b,2.065,2.37,0,'frost')
        box('Transom divider',WHITE,.15,.18,2.035,2.4,-.025,.025)
    elif i in (1,2,5):
        sliding(1.4,'band' if i==2 else 'frost',BLACK if i==1 else WHITE)
    elif i in (3,10,12): sliding(1.1 if i==10 else 1.4,'frost' if i==12 else 'clear',roller=True)
    elif i in (7,8,11,13):
        hinged(.76 if i==11 else 1.15 if i==13 else 1.4,'frost' if i==8 else 'band' if i==11 else 'clear',i==11,i==13)
        if i==7: handle('Towel bar',.28,1.05,.015,length=.42,horizontal=True)
    elif i in (9,14,18):
        w=.85 if i==9 else .9
        mat=WHITE if i==18 else BLACK
        pane('Fixed shower screen',-w/2,w/2,.03,2.05,0,'frost' if i==18 else 'clear',mat)
        if i!=9:
            box('Grid mullion',mat,-.012,.012,.03,2.05,-.014,.014)
            for y in (.53,1.04,1.55): box('Grid crossrails',mat,-w/2,w/2,y-.012,y+.012,-.014,.014)
    elif i in (6,15):
        mat=WHITE if i==6 else SILVER
        sliding(1.1,'frost' if i==6 else 'stripe',mat)
        with place('Corner return',x=-.574,z=-.45,angle=90):
            pane('Fixed return',-.45,.45,.025,2.017,0,'frost' if i==6 else 'stripe',mat)
        if i==15: handle('Tall corner handle',.48,1.05,.055,length=.5)
    elif i==17:
        # Quarter-circle quadrant with two fixed side panels and curved sliders.
        radius=.9
        for angle in (0,90):
            with place('Quadrant side '+str(angle),x=-.45 if angle==90 else 0,z=0 if angle==90 else -.45,angle=angle):
                pane('Fixed side glass',-.45,.45,.03,2.0,0,'stripe',SILVER)
        for y in (.025,2.015):
            for j in range(48):
                a,b=j*math.pi/96,(j+1)*math.pi/96
                rod('Curved tracks',SILVER,(-.45+radius*math.sin(a),y,-.45+radius*math.cos(a)),(-.45+radius*math.sin(b),y,-.45+radius*math.cos(b)),.018)
        for j in range(48):
            a,b=j*math.pi/96,(j+1)*math.pi/96
            x,z=-.45+radius*math.sin(a),-.45+radius*math.cos(a)
            xx,zz=-.45+radius*math.sin(b),-.45+radius*math.cos(b)
            g.face('Curved clear glass',CLEAR,[(x,.05,z),(xx,.05,zz),(xx,1.99,zz),(x,1.99,z)])
            if j%2==0: rod('Curved etched detail',FROST,(x,.50,z),(x,1.4,z),.0008)
        for a in (0,math.pi/4-.018,math.pi/4+.018,math.pi/2):
            x,z=-.45+radius*math.sin(a),-.45+radius*math.cos(a)
            rod('Curved door stiles',SILVER,(x,.035,z),(x,2.,z),.012)
        handle('Curved door pull',.17,1.,.22,length=.35)

GATES=list(range(1,16))

def floral(x,lo,hi):
    # Curved stems and paired leaf outlines in the narrow decorative side strips.
    for j in range(3):
        y=lo+(hi-lo)*(j+.5)/3
        for side in (-1,1):
            pts=[(x+side*.06*math.sin(math.pi*t/16),y-.12+.24*t/16,0) for t in range(17)]
            for a,b in zip(pts,pts[1:]):rod('Floral leaf outline',SILVER,a,b,.004)
        rod('Floral stem',SILVER,(x,lo,0),(x,hi,0),.004)

def remaining_gate(i):
    red=len(MATS)
    MATS.append(('Terracotta red' if i==8 else 'Deep red finish',[.43,.075,.045,1] if i==8 else [.40,.025,.035,1],.35,.32))
    mat=SILVER if i in (11,12) else red if i in (8,9,13) else BLACK
    w=1.5 if i==7 else 3.2
    leaves=3 if i==7 else 4 if i==11 else 2
    h=2.05
    frame('Gate perimeter',mat,-w/2-.035,w/2+.035,.025,h,0,.035,.065)
    for n in range(leaves):
        a=-w/2+n*w/leaves+.012;b=-w/2+(n+1)*w/leaves-.012
        frame('Leaf frame '+str(n),mat,a,b,.06,h-.025,0,.04,.046)
        lo,hi=a+.045,b-.045
        if i==4:
            for k in range(7):
                y=1.22+k*.108
                box('Upper horizontal slats',mat,lo,hi,y,y+.062,-.02,.02)
            for k in range(4):
                y=.12+k*.115
                box('Lower horizontal slats',mat,lo,hi,y,y+.063,-.02,.02)
            for y in (.57,1.16):box('Geometric band rails',mat,lo,hi,y,y+.035,-.02,.02)
            for k in range(10):
                x=lo+(hi-lo)*k/10
                end=lo+(hi-lo)*(k+1)/10
                core.beam('Angled geometric grille',mat,(x,.605,0),(end,1.16,0),.018,.023,.002)
                core.beam('Crossed geometric grille',mat,(end,.605,0),(x,1.16,0),.018,.023,.002)
        elif i==7:
            for k in range(12):
                y=.13+k*.153
                box('Open horizontal bars',mat,lo,hi,y,y+.027,-.015,.015)
            x=lo+(hi-lo)*.72
            box('Offset vertical stile',mat,x,x+.018,.10,2.,-.016,.016)
        elif i in (8,11):
            split=1.08 if i==8 else 1.35 if n in (1,2) else .83
            box('Solid lower panel',mat,lo,hi,.11,split,-.012,.012)
            for y in (.14,split-.035):box('Panel border',mat,lo,hi,y,y+.025,.012,.026)
            if i==11:
                for y in (.50,.87):box('Lower panel separators',mat,lo,hi,y,y+.04,.012,.027)
            count=6 if i==8 else 5 if n in (1,2) else 8
            for k in range(count):
                y=split+.065+k*(1.96-split-.07)/count
                box('Upper grille bars',mat,lo,hi,y,y+.025,-.014,.014)
        elif i==9:
            for k in range(5):
                y=.13+k*.37
                box('Broad red horizontal panel',mat,lo,hi,y,y+.15,-.017,.017)
                box('Slim intervening bar',mat,lo,hi,y+.24,y+.26,-.014,.014)
            for x in (lo+.055,hi-.070):box('Inset vertical accent',mat,x,x+.015,.10,1.99,-.019,.019)
        elif i==12:
            inner_a,inner_b=lo+.17,hi-.17
            for x in (inner_a-.023,inner_b):box('Floral strip stile',mat,x,x+.023,.10,1.98,-.017,.017)
            for k in range(7):
                y=.14+k*.26
                box('Wood-look boards',WOOD,inner_a,inner_b,y,y+.17,-.016,.016)
                for x in (inner_a+.06,inner_b-.06):
                    for dy in (.045,.125):rod('Silver board studs',SILVER,(x,y+dy,.016),(x,y+dy,.022),.006)
            for x in (lo+.075,hi-.075):floral(x,.12,1.96)
            for k in range(6):
                x=lo+(hi-lo)*(k+.5)/6
                rod('Finial stem',mat,(x,h,0),(x,h+.18,0),.008)
                for side in (-1,1):
                    pts=[(x+side*.026*math.sin(math.pi*t/12),h+.10+.06*t/12,0) for t in range(13)]
                    for aa,bb in zip(pts,pts[1:]):rod('Fleur finial',mat,aa,bb,.005)
        elif i==13:
            box('Solid red privacy leaf',mat,lo,hi,.10,1.99,-.015,.015)
            frame('Raised panel molding',mat,lo+.022,hi-.022,.13,1.96,.021,.018,.014)
            box('Slim silver accent',SILVER,lo+.065,lo+.085,.15,1.93,.017,.022)
        for y in (.30,1.73):rod('Hinge barrel',mat,(a,y-.05,.026),(a,y+.05,.026),.013)
        if n==0:handle('Gate pull',b-.075,.98,.033,SILVER,length=.23)
    if i==13:
        pts=[(-w/2+w*j/48,h+.08+.25*math.sin(math.pi*j/48),0) for j in range(49)]
        for a,b in zip(pts,pts[1:]):rod('Arched upper grille rail',mat,a,b,.021)
        for j in range(1,20):
            x=-w/2+w*j/20
            rod('Silver upper grille picket',SILVER,(x,h,0),(x,h+.08+.25*math.sin(math.pi*j/20),0),.012)
    # Keep material index valid until export, then the caller restores it.

def gate(i):
    import gate_photo_refinements
    if i in gate_photo_refinements.REVISED:
        gate_photo_refinements.build(i,sys.modules[__name__])
        return
    if i in (4,7,8,9,11,12,13):
        remaining_gate(i)
        return
    w=1.4 if i==5 else 1.1 if i==10 else 3.2
    h=2.0
    mat=SILVER if i==5 else WHITE if i==15 else BLACK
    leaves=1 if i==10 else 4 if i in (1,6,14,15) else 2
    frame('Outer gate posts',mat,-w/2-.04,w/2+.04,.012,h+.04,0,.04,.07)
    for n in range(leaves):
        a=-w/2+n*w/leaves+.01
        b=-w/2+(n+1)*w/leaves-.01
        with place('Gate leaf '+str(n)):
            frame('Leaf frame',mat,a,b,.06,h,0,.035,.046)
            lo,hi=a+.045,b-.045
            if i==1:
                for k in range(9):
                    y=.78+k*.13
                    box('Wood-look horizontal boards',WOOD,lo,hi,y,y+.125,-.015,.015)
                    for x in (lo+.03,hi-.03): rod('Board rivets',BLACK,(x,y+.06,.015),(x,y+.06,.019),.003)
                for y in (.17,.28,.39,.50,.61,.72):box('Lower ventilation bars',mat,lo,hi,y,y+.018,-.012,.012)
            elif i in (2,10):
                for k in range(5 if i==2 else 4):
                    y=.12+k*(.36 if i==2 else .45)
                    box('Accent panel',WOOD if i==2 else BROWN,lo,hi,y,y+.23,-.015,.015)
                    frame('Panel perimeter',mat,lo,hi,y,y+.23,.005,.014,.026)
            elif i==3:
                for k in range(max(2,int((hi-lo)/.07))):
                    x=lo+.02+k*.07
                    box('Vertical pickets',mat,x,x+.012,.1,1.82,-.01,.01)
                    # Faceted spear finial, rather than an image on a plane.
                    points=[(x-.016,1.80,0),(x+.006,1.91,0),(x+.028,1.80,0),(x+.006,1.77,.014)]
                    for aa,bb,cc in ((0,1,3),(1,2,3),(2,0,3),(2,1,0)):g.face('Spear finials',mat,[points[aa],points[bb],points[cc]])
                box('Picket cross rail',mat,lo,hi,1.72,1.75,-.014,.014)
            elif i==5:
                box('Lower privacy panel',SILVER,lo,hi,.105,.83,-.012,.012)
                for x in (lo+.035,hi-.035):box('Tall grille bars',SILVER,x,x+.012,.85,1.94,-.012,.012)
                for y in (.92,1.23,1.54):
                    frame('Rectangular grille motif',SILVER,lo+.085,hi-.065,y,y+.21,0,.016,.026)
                    box('Motif left ties',SILVER,lo,lo+.085,y+.097,y+.113,-.012,.012)
                    box('Motif right ties',SILVER,hi-.065,hi,y+.097,y+.113,-.012,.012)
            elif i==6:
                box('Lower solid panel',mat,lo,hi,.10,.69,-.012,.012)
                for k in range(19):
                    y=.73+k*.064
                    g.face('Angled louver blades',mat,[(lo,y,.021),(hi,y,.021),(hi,y+.052,-.016),(lo,y+.052,-.016)])
                    box('Louver rolled edges',mat,lo,hi,y,y+.004,.016,.025)
            elif i==14:
                for k in range(max(2,int((hi-lo)/.068))):
                    x=lo+.012+k*.068
                    box('Full-height vertical bars',mat,x,x+.012,.10,1.95,-.014,.014)
                for y in (.20,.27,.34,.41,1.60,1.67,1.74,1.81):box('Lattice bands',mat,lo,hi,y,y+.013,.016,.032)
            elif i==15:
                box('Central cross rail',mat,lo,hi,.99,1.025,-.017,.017)
                for k in range(3):
                    x=lo+(hi-lo)*k/3+.014
                    box('Tall geometric bars',mat,x,x+.014,.10,1.95,-.014,.014)
                    q=min(x+.10,hi)
                    for y in (.83,1.19):box('Rectangular returns',mat,x,q,y,y+.014,-.014,.014)
                    for bottom,top in ((.10,.844),(1.19,1.95)):
                        box('Return verticals',mat,q-.014,q,bottom,top,-.014,.014)
            for y in (.27,1.72):
                rod('Gate hinge barrels',mat,(a,y-.05,.035),(a,y+.05,.035),.012)
            if n==leaves-1:
                handle('Gate pull',a+.055,1.,.028,SILVER if mat==SILVER else mat,length=.23)
                box('Latch plate',mat,a+.025,a+.085,.91,1.10,.025,.035)
                rod('Lock cylinder',SILVER,(a+.055,.95,.035),(a+.055,.95,.044),.01)

def export(name,kind,number):
    slug=name.lower().replace(' ','-')
    doc={'asset':{'version':'2.0','generator':'SOG photo-referenced showers and planar gates'},'scene':0,'scenes':[{'nodes':[0]}],
         'nodes':[{'name':name,'children':[]}],'meshes':[],'materials':[{'name':n,'pbrMetallicRoughness':{'baseColorFactor':c,'metallicFactor':m,'roughnessFactor':r}} for n,c,m,r in MATS],
         'buffers':[],'bufferViews':[],'accessors':[],
         'extras':{'dimensionsAssumed':True,'units':'meters','upAxis':'Y','reference':f'products/{kind}/product-{number:02}/image-01',
                   'modelingNotes':'Photo-referenced visualization, not measured fabrication geometry. No surrounding structures or fixtures. Static doors; no animation.', 'planarAssembly':kind=='gates'}}
    for k in (CLEAR,FROST):doc['materials'][k].update({'alphaMode':'BLEND','doubleSided':True})
    core.doc,core.binary=doc,bytearray()
    if any(mat==WOOD for _,mat in core.groups):
        png=texture_png(128,512,wood_pixel)
        doc['bufferViews'].append({'buffer':0,'byteOffset':0,'byteLength':len(png)})
        core.binary.extend(png)
        doc['images']=[{'bufferView':0,'mimeType':'image/png'}]
        doc['textures']=[{'source':0,'sampler':0}]
        doc['samplers']=[{'magFilter':9729,'minFilter':9987,'wrapS':10497,'wrapT':10497}]
        doc['materials'][WOOD]['pbrMetallicRoughness']['baseColorTexture']={'index':0}
    bounds=[[],[],[]]
    for (label,mat),(positions,normals,indices) in core.groups.items():
        attrs={'POSITION':core.accessor(positions,'f',5126,'VEC3',34962),'NORMAL':core.accessor(normals,'f',5126,'VEC3',34962)}
        if mat==WOOD:attrs['TEXCOORD_0']=core.accessor([(y/.13,x/.9) for x,y,z in positions],'f',5126,'VEC2',34962)
        idx=core.accessor(indices,'I',5125,'SCALAR',34963)
        doc['nodes'][0]['children'].append(len(doc['nodes']))
        doc['nodes'].append({'name':label,'mesh':len(doc['meshes'])})
        doc['meshes'].append({'name':label,'primitives':[{'attributes':attrs,'indices':idx,'material':mat}]})
        for p in positions:
            for k in range(3):bounds[k].append(p[k])
    doc['extras']['dimensionsMeters']=[round(max(b)-min(b),4) for b in bounds]
    while len(core.binary)%4:core.binary.append(0)
    doc['buffers']=[{'byteLength':len(core.binary)}]
    meta=json.dumps(doc,separators=(',',':')).encode()
    meta+=b' '*((-len(meta))%4)
    glb=struct.pack('<4sII',b'glTF',2,28+len(meta)+len(core.binary))+struct.pack('<I4s',len(meta),b'JSON')+meta+struct.pack('<I4s',len(core.binary),b'BIN\0')+core.binary
    Path(__file__).with_name(slug+'.glb').write_bytes(glb)
    print(f'{slug}: {len(glb):,} bytes')
    return slug+'.glb'

if __name__=='__main__':
    manifest={}
    for seeder,kind,numbers,builder in [('ShowerEnclosureSeeder.php','shower-enclosures',range(1,19),shower),('GateSeeder.php','gates',GATES,gate)]:
        names=re.findall(r"\['([^']+)',",(Path(__file__).parents[2]/seeder).read_text())
        for i in numbers:
            core.groups={}
            builder(i)
            name=f'{names[i-1]} {i:02}'
            manifest[name]=export(name,kind,i)
            del MATS[9:]
    Path(__file__).with_name('shower-gate-models.json').write_text(json.dumps(manifest,indent=2)+'\n')
