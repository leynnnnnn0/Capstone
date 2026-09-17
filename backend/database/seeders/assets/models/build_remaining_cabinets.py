"""Build ten photo-referenced cabinet GLBs using Python's standard library.

All measurements are assumed, not fabrication dimensions. Y-up, meters;
front +Z. Appliances, room walls and photographed belongings are excluded.
The custom-service model is a representative wardrobe from its collage.
Run: python3 backend/database/seeders/assets/models/build_remaining_cabinets.py
"""
import sys
sys.dont_write_bytecode = True
import json
import math
import struct
from contextlib import contextmanager
from pathlib import Path
import build_screen_door as core
from build_side_panel_doors import texture_png, wood_pixel

WHITE, SILVER, GLASS, DARK, WOOD, BROWN, BLACK, GOLD, STONE = range(9)
MATERIALS = [
    ('Satin white aluminum', [.88,.90,.91,1], .18,.27),
    ('Brushed aluminum hardware', [.55,.59,.62,1], .88,.25),
    ('Clear display glass', [.77,.9,.92,.14], .04,.09),
    ('Recesses and seals', [.035,.044,.049,1], .05,.78),
    ('Warm wood-finish aluminum', [1,1,1,1], .15,.34),
    ('Analoque brown panels', [.105,.069,.058,1], .32,.3),
    ('Glossy black aluminum', [.018,.023,.028,1], .4,.12),
    ('Brushed gold handles', [.66,.40,.12,1], .82,.25),
    ('Warm white counter surface', [.85,.84,.80,1], .04,.25),
]
original_face = core.face
transform = (0,0,0,0)
prefix = ''

def face(name, material, points):
    angle,ox,oy,oz = transform
    c,s = math.cos(angle),math.sin(angle)
    original_face(prefix+name,material,[(c*x+s*z+ox,y+oy,-s*x+c*z+oz) for x,y,z in points])

core.face = face

@contextmanager
def place(name, x=0,y=0,z=0,angle=0):
    global transform,prefix
    previous=(transform,prefix)
    transform=(math.radians(angle),x,y,z)
    prefix=name+' / '
    try:
        yield
    finally:
        transform,prefix=previous

def box(name, mat, x0,x1,y0,y1,z0,z1, bevel=.001):
    assert x1>x0 and y1>y0 and z1>z0, (name,x0,x1,y0,y1,z0,z1)
    core.beam(name,mat,((x0+x1)/2,y0,(z0+z1)/2),((x0+x1)/2,y1,(z0+z1)/2),x1-x0,z1-z0,bevel)

def frame(name, mat,x0,x1,y0,y1,z,width=.023,depth=.023):
    box(name,mat,x0,x0+width,y0,y1,z-depth/2,z+depth/2)
    box(name,mat,x1-width,x1,y0,y1,z-depth/2,z+depth/2)
    box(name,mat,x0+width,x1-width,y0,y0+width,z-depth/2,z+depth/2)
    box(name,mat,x0+width,x1-width,y1-width,y1,z-depth/2,z+depth/2)

def pull(name,x,y,z,mat=SILVER,horizontal=False,length=.13):
    a=(x-length/2,y,z+.030) if horizontal else (x,y-length/2,z+.030)
    b=(x+length/2,y,z+.030) if horizontal else (x,y+length/2,z+.030)
    core.rod(name+' grip',mat,a,b,.005,16)
    for p in (a,b):
        core.rod(name+' mounts',mat,(p[0],p[1],z),p,.004,12)

def front(name,x0,x1,y0,y1,z,mat=WHITE,style='slab',handle='rail'):
    trim=DARK if mat==BROWN else mat
    if style=='glass':
        frame(name+' gasket',DARK,x0+.015,x1-.015,y0+.015,y1-.015,z-.008,.009,.009)
        # Single glazing surface avoids unnecessary double alpha compositing.
        face(name+' glazing',GLASS,[(x0+.025,y0+.025,z),(x1-.025,y0+.025,z),(x1-.025,y1-.025,z),(x0+.025,y1-.025,z)])
        frame(name+' glazing frame',trim,x0,x1,y0,y1,z+.004)
    elif style=='louver':
        frame(name+' outer frame',mat,x0,x1,y0,y1,z,.038,.024)
        n=max(1,int((y1-y0-.08)/.045))
        for i in range(n):
            y=y0+.04+i*(y1-y0-.08)/n
            # Sloped overlapping slats, not a painted stripe texture.
            a,b=x0+.038,x1-.038
            h=(y1-y0-.08)/n
            face(name+' angled louver blades',mat,[(a,y,z+.012),(b,y,z+.012),(b,y+h-.002,z-.004),(a,y+h-.002,z-.004)])
            box(name+' louver lips',mat,a,b,y,y+.003,z+.008,z+.014)
        box(name+' opaque louver backing',mat,x0+.038,x1-.038,y0+.038,y1-.038,z-.017,z-.014)
    else:
        box(name+' inset panel',mat,x0+.013,x1-.013,y0+.013,y1-.013,z-.013,z+.006)
        frame(name+' edge extrusion',trim,x0,x1,y0,y1,z,.016,.022)
    if handle=='rail':
        box(name+' finger pull shadow',DARK,x0+.012,x1-.012,y1-.015,y1-.010,z+.011,z+.014)
        box(name+' continuous finger pull',SILVER,x0+.006,x1-.006,y1-.009,y1-.003,z+.012,z+.024)
    elif handle=='gold':
        pull(name,x1-.055,y0+.22,z+.014,GOLD)
    elif handle=='vertical':
        pull(name,x1-.037,(y0+y1)/2,z+.014,DARK if mat==BROWN else SILVER)
    elif handle=='recessed':
        box(name+' recessed sliding pull',DARK,x1-.028,x1-.015,(y0+y1)/2-.065,(y0+y1)/2+.065,z+.016,z+.018)
    if style=='glass' and handle!='recessed':
        for y in (y0+.06,y1-.06):
            box(name+' glass door hinges',SILVER,x0+.006,x0+.023,y-.018,y+.018,z+.012,z+.023)

def shell(name,w,y0,y1,d,mat=WHITE,shelves=()):
    for a,b in ((-w/2,-w/2+.018),(w/2-.018,w/2)):
        box(name+' gables',mat,a,b,y0,y1,0,d)
    box(name+' back',mat,-w/2+.018,w/2-.018,y0,y1,0,.012)
    for y in (y0+.009,y1-.009,*shelves):
        box(name+' shelves',mat,-w/2+.018,w/2-.018,y-.009,y+.009,.012,d-.015)

def unit(name,w=.6,y0=.10,y1=.86,d=.56,mat=WHITE,drawers=0,style='slab',handle='rail',doors=1):
    shell(name,w,y0,y1,d,mat,() if drawers else ((y0+y1)/2,))
    if y0<.2:
        box(name+' recessed plinth',DARK,-w/2+.018,w/2-.018,0,y0,.04,d-.065)
    if drawers:
        for i in range(drawers):
            a=y0+i*(y1-y0)/drawers+.003
            b=y0+(i+1)*(y1-y0)/drawers-.003
            front(name+' drawer '+str(i),-w/2+.003,w/2-.003,a,b,d+.013,mat,handle=handle)
    else:
        for i in range(doors):
            a=-w/2+i*w/doors+.003
            b=-w/2+(i+1)*w/doors-.003
            front(name+' door '+str(i),a,b,y0+.003,y1-.003,d+.013,mat,style,handle)

def counter(name,w,d=.6):
    box(name,STONE,-w/2-.012,w/2+.012,.86,.895,-.005,d+.020,.003)

def kitchen(kind):
    lower=WOOD if kind=='two-tone' else BLACK if kind=='black' else WHITE
    upper=BLACK if kind=='black' else WHITE
    count=5 if kind=='two-tone' else 4
    length=count*.6
    back=-.9 if kind!='two-tone' else -.3
    for i in range(count):
        x=-length/2+.3+i*.6
        with place('Back base '+str(i),x=x,z=back):
            unit('Cabinet',mat=lower,drawers=3 if (kind=='two-tone' and i==1) else 2 if (kind=='handleless' and i in (1,3)) else 0)
            # The two-tone installation is photographed without a countertop.
            if kind!='two-tone': counter('Countertop',.6)
        with place('Back wall '+str(i),x=x,z=back):
            short=(kind in ('black','handleless') and i==2)
            microwave=(kind=='white-l' and i==3)
            unit('Overhead',y0=1.99 if microwave else 1.84 if short else 1.49,y1=2.35,d=.33,mat=upper,
                 style='glass' if kind=='handleless' and i==0 else 'slab')
            if microwave:
                shell('Open appliance niche',.6,1.49,1.99,.33,WHITE)
    if kind!='two-tone':
        # Back run owns both corners; returns start beyond its front edge.
        for side in ([-1,1] if kind=='handleless' else [-1]):
            for i in range(2):
                with place(('Left' if side<0 else 'Right')+' return '+str(i),x=side*length/2,z=0+i*.6,angle=90 if side<0 else -90):
                    unit('Return base',mat=lower,drawers=2 if kind=='black' and i==1 else 0)
                    counter('Return counter',.6)
                    if kind!='handleless':
                        unit('Return overhead',y0=1.49,y1=2.35,d=.33,mat=upper)

def louvered():
    for i in range(3):
        with place('Back louvered '+str(i),x=-.9+i*.6,z=-.8):
            unit('Wall cabinet',y0=1.5,y1=2.35,d=.34,style='louver',handle='gold')
    for i in range(2):
        with place('Right louvered '+str(i),x=.6,z=-.16+i*.6,angle=-90):
            unit('Return wall cabinet',y0=1.5,y1=2.35,d=.34,style='louver',handle='gold')

def entertainment():
    for i in range(5):
        with place('Low media storage '+str(i),x=-1.2+i*.6,z=-.225):
            unit('Base',y1=.60,d=.45)
            box('Continuous media top',WHITE,-.3,.3,.60,.625,0,.47)
    for i in range(4):
        with place('Media bridge '+str(i),x=-1.2+i*.6,z=-.225):
            unit('Overhead',y0=1.85,y1=2.4,d=.32)
    with place('Glass display tower',x=1.2,z=-.225):
        shell('Display tower',.6,.625,2.4,.34,WHITE,(1.06,1.5,1.94))
        front('Lower display door',-.29,.29,.638,1.51,.36,style='glass',handle='vertical')
        front('Upper display door',-.29,.29,1.518,2.39,.36,style='glass',handle='vertical')
    box('Recessed media back panel',WHITE,-1.5,.9,.625,1.85,-.225,-.207)
    # Cable grommet: black recess with a metal rim, no included electronics.
    core.rod('Cable grommet',SILVER,(0,.76,-.207),(0,.76,-.202),.022,24)
    core.rod('Cable opening',DARK,(0,.76,-.202),(0,.76,-.201),.016,24)

def sliding():
    with place('Sliding glass cabinet',z=-.22):
        shell('Carcass',1.25,.06,2.1,.44,WHITE,(.55,1.07,1.59))
        box('Plinth',DARK,-.59,.59,0,.06,.03,.36)
        for y0,y1 in ((.08,1.055),(1.085,2.08)):
            for y in (y0,y1):
                for z in (.451,.474):
                    box('Twin sliding tracks',SILVER,-.6,.6,y-.004,y+.004,z-.004,z+.004)
            # Partly slid front panel reveals right-hand shelves, like the photo.
            front('Rear sliding pane '+str(y0),-.595,.025,y0+.006,y1-.006,.454,style='glass',handle='recessed')
            front('Front sliding pane '+str(y0),-.36,.26,y0+.012,y1-.012,.481,style='glass',handle='recessed')

def wardrobe(custom=False):
    if custom:
        with place('Custom example wardrobe',z=-.275):
            shell('Full height carcass',1.8,.08,2.2,.55,WHITE,(1.97,))
            box('Toe kick',DARK,-.87,.87,0,.08,.035,.46)
            box('Organizer divider',WHITE,.28,.30,.08,2.2,.012,.54)
            core.rod('Hanging rail',SILVER,(-.86,1.85,.28),(.26,1.85,.28),.012,20)
            for y in (.70,1.02,1.36):
                box('Right organizer shelves',WHITE,.3,.882,y-.009,y+.009,.015,.53)
            for i,y in enumerate((.10,.36)):
                z=.70 if i==0 else .57
                front('Organizer drawer '+str(i),.305,.88,y,y+.245,z)
                box('Drawer bottom '+str(i),WHITE,.32,.867,y+.008,y+.026,z-.43,z-.015)
                for a,b in ((.32,.335),(.852,.867)):
                    box('Drawer sides',WHITE,a,b,y+.026,y+.19,z-.43,z-.015)
                box('Drawer back',WHITE,.335,.852,y+.026,y+.19,z-.43,z-.415)
            front('Sliding wardrobe glazing',-.88,-.03,.10,2.17,.572,style='glass',handle='recessed')
            front('Sliding wardrobe glazing second',-.38,.28,.10,2.17,.603,style='glass',handle='recessed')
        return
    # Photo shows two side towers with an overhead bridge and open walk-in bay.
    for side in (-1,1):
        with place(('Left' if side<0 else 'Right')+' wardrobe tower',x=side*.95,z=-.29):
            shell('Tower',.6,.08,2.4,.58,BROWN,(.56,1.77,2.08))
            box('Toe kick',DARK,-.28,.28,0,.08,.04,.50)
            front('Lower drawer',-.294,.294,.09,.55,.594,BROWN,handle='rail')
            front('Tall wardrobe door',-.294,.294,.566,1.76,.594,BROWN,handle='vertical')
            front('Tower overhead',-.294,.294,1.78,2.075,.594,BROWN,handle='none')
            front('Top storage',-.294,.294,2.085,2.39,.594,BROWN,handle='none')
            core.rod('Interior hanging rod',SILVER,(-.27,1.66,.3),(.27,1.66,.3),.011,16)
    for i in range(4):
        with place('Wardrobe bridge '+str(i),x=-.4875+i*.325,z=-.29):
            unit('Bridge cupboard',w=.325,y0=1.77,y1=2.08,d=.58,mat=BROWN,handle='none')
            unit('Top cupboard',w=.325,y0=2.08,y1=2.4,d=.58,mat=BROWN,handle='none')

def prism(name,mat,outline,z0,z1):
    # Outline is CCW in the XY plane.
    face(name,mat,[(x,y,z1) for x,y in outline])
    face(name,mat,[(x,y,z0) for x,y in reversed(outline)])
    for i,(x,y) in enumerate(outline):
        a,b=outline[(i+1)%len(outline)]
        face(name,mat,[(x,y,z0),(a,b,z0),(a,b,z1),(x,y,z1)])

def under_stair():
    def height(x): return 1.8-(x+.65)*.68
    with place('Tall left storage',x=-1.0,z=-.3):
        unit('Double cupboard',w=.7,y0=.08,y1=1.8,d=.60,doors=2,handle='none')
    # Angled carcass extends down to the right; no staircase included.
    for i,(a,b) in enumerate(((-.65,.10),(.10,.75),(.75,1.35))):
        lo=.08
        outline=[(a,lo),(b,lo),(b,height(b)),(a,height(a))]
        prism('Angled back '+str(i),WHITE,outline,-.30,-.285)
        for x in (a,b-.018):
            box('Angled dividers',WHITE,x,x+.018,.08,height(x+.018),-.285,.30)
        box('Bay floor',WHITE,a+.018,b-.018,.08,.10,-.285,.30)
        # Top follows the stair pitch, including a slim exposed aluminum rim.
        core.beam('Sloping cap',WHITE,(a,height(a),0),(b,height(b),0),.023,.60)
        segments=[(.105,.65),(.665,None)] if i==0 else [(.105,None)]
        for j,(bottom,top) in enumerate(segments):
            left,right=a+.025,b-.025
            lt=min(height(left)-.025,top) if top else height(left)-.025
            rt=min(height(right)-.025,top) if top else height(right)-.025
            outline=[(left,bottom),(right,bottom),(right,rt),(left,lt)]
            z=.48 if i==0 and j==0 else .318
            prism('Shaped pull-out front '+str(i)+' '+str(j),WHITE,outline,z-.018,z)
            for k,(x,y) in enumerate(outline):
                q=outline[(k+1)%4]
                core.beam('Front perimeter extrusions',WHITE,(x,y,z+.005),(*q,z+.005),.014,.012)
            if z>.4:
                box('Extended drawer bottom',WHITE,left+.013,right-.013,bottom+.016,bottom+.034,z-.54,z-.019)
                for x in (left+.013,right-.027):
                    box('Extended drawer walls',WHITE,x,x+.014,bottom+.034,bottom+.29,z-.54,z-.019)
                    box('Exposed drawer runners',SILVER,x-.002,x+.016,bottom+.12,bottom+.14,z-.53,z-.04)
                box('Extended drawer rear',WHITE,left+.027,right-.027,bottom+.034,bottom+.29,z-.54,z-.526)
    box('Continuous recessed toe kick',DARK,-1.32,1.32,0,.079,-.26,.24)

MODELS=[
    ('White Under-Stair Pull-Out Cabinet',under_stair,'One drawer shown partially extended; stair pitch and bay sizes assumed.'),
    ('White L-Shaped Modular Kitchen Cabinet',lambda:kitchen('white-l'),'L-shaped cabinet-only approximation; counter included for layout, appliances omitted.'),
    ('Two-Tone Modular Kitchen Cabinet',lambda:kitchen('two-tone'),'Straight run with wood-finish base and white uppers; no countertop as in installation photo.'),
    ('Analoque Brown Walk-In Wardrobe Cabinet',wardrobe,'Closed-door view of towers and bridge; depth and concealed internals assumed.'),
    ('White Louvered Overhead Kitchen Cabinet',louvered,'Wall-mounted L-shaped run with modeled louver blades and gold handles.'),
    ('Glossy Black Modular Kitchen Cabinet',lambda:kitchen('black'),'L-shaped approximation; appliances and tiled room excluded.'),
    ('Handleless White Modular Kitchen Cabinet',lambda:kitchen('handleless'),'U-shaped base run with raised center overhead section; appliances excluded.'),
    ('White Modular Entertainment Cabinet',entertainment,'Cabinet only; television and electronics not included.'),
    ('White Sliding Glass Storage Cabinet',sliding,'Both front sliding panes shown partially open to reveal shelving.'),
    ('Customized Modular Cabinet',lambda:wardrobe(True),'Representative wardrobe from collage, not a fixed custom-service specification.'),
]

def export(name,note):
    slug=name.lower().replace(' ','-')
    doc={'asset':{'version':'2.0','generator':'SOG photo-referenced cabinet collection'},'scene':0,
         'scenes':[{'nodes':[0]}],'nodes':[{'name':name,'children':[]}],'meshes':[],
         'materials':[{'name':n,'pbrMetallicRoughness':{'baseColorFactor':c,'metallicFactor':m,'roughnessFactor':r}} for n,c,m,r in MATERIALS],
         'buffers':[],'bufferViews':[],'accessors':[],
         'extras':{'dimensionsAssumed':True,'units':'meters','upAxis':'Y','reference':slug+'.jpg','modelingNotes':note}}
    doc['materials'][GLASS].update({'alphaMode':'BLEND','doubleSided':True})
    core.doc=doc
    core.binary=bytearray()
    if any(mat==WOOD for _,mat in core.groups):
        # The kitchen reference is a deeper reddish wood than the screen door.
        def kitchen_grain(x,y):
            r,g,b,a=wood_pixel(x,y)
            return round(r*.74),round(g*.58),round(b*.60),a
        png=texture_png(128,512,kitchen_grain)
        doc['bufferViews'].append({'buffer':0,'byteOffset':0,'byteLength':len(png)})
        core.binary.extend(png)
        doc['images']=[{'bufferView':0,'mimeType':'image/png'}]
        doc['textures']=[{'source':0,'sampler':0}]
        doc['samplers']=[{'magFilter':9729,'minFilter':9987,'wrapS':10497,'wrapT':10497}]
        doc['materials'][WOOD]['pbrMetallicRoughness']['baseColorTexture']={'index':0}
    bounds=[[],[],[]]
    for (label,mat),(positions,normals,indices) in core.groups.items():
        attrs={'POSITION':core.accessor(positions,'f',5126,'VEC3',34962),'NORMAL':core.accessor(normals,'f',5126,'VEC3',34962)}
        for p in positions:
            for k in range(3): bounds[k].append(p[k])
        if mat==WOOD:
            attrs['TEXCOORD_0']=core.accessor([((x+z)/.24,y/.9) for x,y,z in positions],'f',5126,'VEC2',34962)
        idx=core.accessor(indices,'I',5125,'SCALAR',34963)
        doc['nodes'][0]['children'].append(len(doc['nodes']))
        doc['nodes'].append({'name':label,'mesh':len(doc['meshes'])})
        doc['meshes'].append({'name':label,'primitives':[{'attributes':attrs,'indices':idx,'material':mat}]})
    doc['extras']['dimensionsMeters']=[round(max(b)-min(b),4) for b in bounds]
    while len(core.binary)%4: core.binary.append(0)
    doc['buffers']=[{'byteLength':len(core.binary)}]
    metadata=json.dumps(doc,separators=(',',':')).encode()
    metadata+=b' '*((-len(metadata))%4)
    glb=struct.pack('<4sII',b'glTF',2,28+len(metadata)+len(core.binary))+struct.pack('<I4s',len(metadata),b'JSON')+metadata+struct.pack('<I4s',len(core.binary),b'BIN\0')+core.binary
    output=Path(__file__).with_name(slug+'.glb')
    output.write_bytes(glb)
    print(f'{slug}: {len(glb):,} bytes; {sum(len(v[2])//3 for v in core.groups.values()):,} triangles')

if __name__=='__main__':
    for name,build,note in MODELS:
        core.groups={}
        build()
        export(name,note)
