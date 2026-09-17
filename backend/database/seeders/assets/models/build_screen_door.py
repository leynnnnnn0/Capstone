"""Build the SOG Hanaloque 01 GLB with Python's standard library.

Photo reference: products/screen-door/screen-door-01.png. Dimensions are
assumed: 0.90 m wide x 2.10 m high. Y-up, floor origin, front faces +Z.
Run this file to regenerate the adjacent GLB. No external textures required.
"""
import json
import math
import struct
import zlib
from pathlib import Path

groups = {}


def sub(a, b):
    return tuple(x - y for x, y in zip(a, b))


def cross(a, b):
    return (a[1]*b[2]-a[2]*b[1], a[2]*b[0]-a[0]*b[2], a[0]*b[1]-a[1]*b[0])


def unit(a):
    length = math.sqrt(sum(x*x for x in a))
    return tuple(x/length for x in a)


def face(name, material, points):
    positions, normals, indices = groups.setdefault((name, material), ([], [], []))
    normal = unit(cross(sub(points[1], points[0]), sub(points[2], points[0])))
    start = len(positions)
    positions.extend(points)
    normals.extend([normal]*len(points))
    for i in range(1, len(points)-1):
        indices.extend((start, start+i, start+i+1))


def beam(name, material, a, b, width, depth, bevel=0.001):
    # Beveled extrusion, with planar normals for crisp aluminum edge highlights.
    direction = unit(sub(b, a))
    u = unit(cross(direction, (0, 0, 1) if abs(direction[2]) < .9 else (0, 1, 0)))
    v = cross(direction, u)
    w, d = width/2, depth/2
    c = min(bevel, w*.4, d*.4)
    profile = [(-w+c,-d),(w-c,-d),(w,-d+c),(w,d-c),(w-c,d),(-w+c,d),(-w,d-c),(-w,-d+c)]
    rings = [[tuple(p[k]+x*u[k]+y*v[k] for k in range(3)) for x,y in profile] for p in (a,b)]
    face(name, material, list(reversed(rings[0])))
    face(name, material, rings[1])
    for i in range(8):
        j=(i+1)%8
        face(name, material, [rings[0][i], rings[0][j], rings[1][j], rings[1][i]])


def rod(name, material, a, b, radius, sides=8):
    direction=unit(sub(b,a))
    u=unit(cross(direction,(0,0,1) if abs(direction[2]) < .9 else (0,1,0)))
    v=cross(direction,u)
    rings=[[tuple(p[k]+radius*(math.cos(i*2*math.pi/sides)*u[k]+math.sin(i*2*math.pi/sides)*v[k]) for k in range(3)) for i in range(sides)] for p in (a,b)]
    face(name,material,list(reversed(rings[0])))
    face(name,material,rings[1])
    for i in range(sides):
        j=(i+1)%sides
        face(name,material,[rings[0][i],rings[0][j],rings[1][j],rings[1][i]])


# Outer jamb, inset leaf, rubber reveal and thin screen retaining beads.
for name, mat, left, right, bottom, top, width, depth, z in [
    ('Outer aluminum jamb',0,-.429,.429,.021,2.079,.042,.060,0),
    ('Recessed weather seal',2,-.402,.402,.049,2.051,.012,.026,.002),
    ('Door leaf aluminum frame',0,-.382,.382,.068,2.032,.034,.035,.015),
    ('Screen retaining bead',1,-.361,.361,.087,2.013,.008,.008,.038),
]:
    beam(name,mat,(left,bottom,z),(left,top,z),width,depth)
    beam(name,mat,(right,bottom,z),(right,top,z),width,depth)
    beam(name,mat,(left-width/2,bottom,z),(right+width/2,bottom,z),width,depth)
    beam(name,mat,(left-width/2,top,z),(right+width/2,top,z),width,depth)

# Clip diagonal rods to the rectangular screen opening, giving a real open grille.
x0,x1,y0,y1=-.357,.357,.091,2.009
for slope in (-1.42,1.42):
    for n in range(-9,39):
        intercept=n*.111
        hits=[]
        for x in (x0,x1):
            y=slope*x+intercept
            if y0 <= y <= y1: hits.append((x,y,.029))
        for y in (y0,y1):
            x=(y-intercept)/slope
            if x0 < x < x1: hits.append((x,y,.029))
        if len(hits)==2:
            rod('Diamond security grille',1,hits[0],hits[1],.0019)

# Embedded repeating mesh texture is mip-filtered to avoid subpixel wire shimmer.
face('Fine insect screen',4,[(x0,y0,.006),(x1,y0,.006),(x1,y1,.006),(x0,y1,.006)])

# Three barrel hinges with collars and visible screw heads.
for y in (.27,1.05,1.83):
    beam('Hinge leaves',1,(.381,y-.036,.039),(.381,y+.036,.039),.038,.008)
    rod('Hinge barrels',1,(.403,y-.041,.048),(.403,y+.041,.048),.007,16)
    for dy in (-.025,.025):
        rod('Hardware screws',3,(.38,y+dy,.043),(.38,y+dy,.045),.003,12)
    for dy in (-.038,0,.038):
        rod('Hinge collars',3,(.403,y+dy-.001,.048),(.403,y+dy+.001,.048),.0073,16)

# Lever lockset on both faces, including escutcheon, cylinder and key slot.
for side in (1,-1):
    z=.015+side*.027
    beam('Lock escutcheons',3,(-.38,.966,z),(-.38,1.074,z),.029,.009,.003)
    rod('Lever spindle',3,(-.38,1.037,z),(-.38,1.037,z+side*.029),.008,16)
    beam('Lever handles',3,(-.38,1.037,z+side*.029),(-.294,1.037,z+side*.029),.014,.017,.004)
    rod('Lock cylinders',3,(-.38,.994,z),(-.38,.994,z+side*.007),.009,20)
    beam('Key slots',2,(-.38,.989,z+side*.0072),(-.38,.999,z+side*.0072),.002,.0005,.0001)
    for y in (.975,1.066):
        rod('Escutcheon screws',1,(-.38,y,z),(-.38,y,z+side*.006),.0025,12)

materials=[
    ('Black powder-coated aluminum',[.028,.035,.040,1],.65,.31),
    ('Graphite grille and trim',[.095,.110,.115,1],.72,.34),
    ('Dark screen and rubber',[.018,.023,.025,1],.1,.85),
    ('Satin nickel hardware',[.46,.49,.51,1],.9,.27),
    ('Fine woven insect mesh',[.08,.09,.1,1],0,.95),
]
doc={'asset':{'version':'2.0','generator':'SOG procedural door model'},'scene':0,
     'scenes':[{'nodes':[0]}],'nodes':[{'name':'Premium Black Hanaloque Screen Door 01','children':[]}],
     'meshes':[],'materials':[{'name':n,'doubleSided':True,'pbrMetallicRoughness':{'baseColorFactor':c,'metallicFactor':m,'roughnessFactor':r}} for n,c,m,r in materials],
     'buffers':[],'bufferViews':[],'accessors':[],
     'extras':{'dimensionsMeters':[.9,2.1,.129],'dimensionsAssumed':True,'reference':'screen-door-01.png','upAxis':'Y'}}
binary=bytearray()


def png_chunk(kind, data):
    return struct.pack('>I',len(data))+kind+data+struct.pack('>I',zlib.crc32(kind+data))


pixels=b''.join(b'\0'+b''.join(bytes((255,255,255,210 if x<3 or y<3 else 0)) for x in range(32)) for y in range(32))
png=b'\x89PNG\r\n\x1a\n'+png_chunk(b'IHDR',struct.pack('>IIBBBBB',32,32,8,6,0,0,0))+png_chunk(b'IDAT',zlib.compress(pixels))+png_chunk(b'IEND',b'')
doc['bufferViews'].append({'buffer':0,'byteOffset':0,'byteLength':len(png)})
binary.extend(png)
doc['images']=[{'bufferView':0,'mimeType':'image/png'}]
doc['samplers']=[{'magFilter':9729,'minFilter':9987,'wrapS':10497,'wrapT':10497}]
doc['textures']=[{'source':0,'sampler':0}]
doc['materials'][4]['alphaMode']='BLEND'
doc['materials'][4]['pbrMetallicRoughness']['baseColorTexture']={'index':0}


def accessor(values, code, component, shape, target):
    while len(binary)%4: binary.append(0)
    flat=[v for row in values for v in row] if shape in ('VEC3','VEC2') else values
    raw=struct.pack('<'+code*len(flat),*flat)
    view=len(doc['bufferViews'])
    doc['bufferViews'].append({'buffer':0,'byteOffset':len(binary),'byteLength':len(raw),'target':target})
    binary.extend(raw)
    a={'bufferView':view,'componentType':component,'count':len(values),'type':shape}
    if shape=='VEC3':
        a['min']=[min(p[k] for p in values) for k in range(3)]
        a['max']=[max(p[k] for p in values) for k in range(3)]
    doc['accessors'].append(a)
    return len(doc['accessors'])-1


for (name,material),(positions,normals,indices) in groups.items():
    p=accessor(positions,'f',5126,'VEC3',34962)
    n=accessor(normals,'f',5126,'VEC3',34962)
    idx=accessor(indices,'I',5125,'SCALAR',34963)
    mesh=len(doc['meshes'])
    attributes={'POSITION':p,'NORMAL':n}
    if material==4:
        attributes['TEXCOORD_0']=accessor([(0,0),(357,0),(357,959),(0,959)],'f',5126,'VEC2',34962)
    doc['meshes'].append({'name':name,'primitives':[{'attributes':attributes,'indices':idx,'material':material}]})
    doc['nodes'][0]['children'].append(len(doc['nodes']))
    doc['nodes'].append({'name':name,'mesh':mesh})
while len(binary)%4: binary.append(0)
doc['buffers']=[{'byteLength':len(binary)}]
metadata=json.dumps(doc,separators=(',',':')).encode()
metadata+=b' '*((-len(metadata))%4)
glb=struct.pack('<4sII',b'glTF',2,28+len(metadata)+len(binary))+struct.pack('<I4s',len(metadata),b'JSON')+metadata+struct.pack('<I4s',len(binary),b'BIN\0')+binary
output=Path(__file__).with_name('premium-black-hanaloque-screen-door-01.glb')
output.write_bytes(glb)
print(f'{output}: {len(glb):,} bytes; {len(groups)} meshes; {sum(len(v[2])//3 for v in groups.values()):,} triangles')
