"""Photo-referenced pantry cabinet; assumed 1500 W x 2100 H x 380 D mm.

Y-up, floor origin, front +Z. Cabinet only (no photographed contents/wall).
The lower-right bay remains open, without a counter or support leg.
Run with Python 3 to rebuild.
"""
import sys
sys.dont_write_bytecode = True
import json
import struct
from pathlib import Path
import build_screen_door as core

core.groups = {}
beam, rod = core.beam, core.rod

def box(name, mat, x0, x1, y0, y1, z0, z1, bevel=.001):
    beam(name, mat, ((x0+x1)/2,y0,(z0+z1)/2),
         ((x0+x1)/2,y1,(z0+z1)/2),x1-x0,z1-z0,bevel)

def frame(name, x0, x1, y0, y1, z, width=.026, depth=.030, mat=0):
    box(name,mat,x0,x0+width,y0,y1,z-depth/2,z+depth/2)
    box(name,mat,x1-width,x1,y0,y1,z-depth/2,z+depth/2)
    box(name,mat,x0+width,x1-width,y0,y0+width,z-depth/2,z+depth/2)
    box(name,mat,x0+width,x1-width,y1-width,y1,z-depth/2,z+depth/2)

def door(name, x0,x1,y0,y1,handle_x):
    frame(name+' dark glass gasket',x0+.019,x1-.019,y0+.019,y1-.019,.192,.010,.009,3)
    frame(name+' powder coated frame',x0,x1,y0,y1,.198)
    box(name+' clear glazing',2,x0+.026,x1-.026,y0+.026,y1-.026,.190,.194,.0002)
    # Slim brushed-metal bow pull and two standoffs.
    cy=(y0+y1)/2
    for y in (cy-.06,cy+.06):
        rod(name+' pull mounts',1,(handle_x,y,.214),(handle_x,y,.242),.005,16)
    rod(name+' pull',1,(handle_x,cy-.065,.242),(handle_x,cy+.065,.242),.006,20)
    hinge_x=x0+.011 if handle_x>(x0+x1)/2 else x1-.011
    for y in (y0+.09,y1-.09):
        rod(name+' hinge barrels',1,(hinge_x,y-.023,.216),(hinge_x,y+.023,.216),.004,12)
        box(name+' hinge plates',0,hinge_x-.010,hinge_x+.010,y-.02,y+.02,.209,.217)

# Left full-height tower, closed back and gables, recessed plinth.
box('Recessed toe kick',3,-.728,-.268,.0,.085,-.17,.125)
box('Tower left gable',0,-.75,-.732,.065,2.1,-.19,.19)
box('Tower right gable',0,-.262,-.244,.065,2.1,-.19,.19)
box('Tower back panel',0,-.732,-.262,.075,2.08,-.19,-.178)
for y in (.085,1.47,2.09):
    box('Tower structural shelf',0,-.732,-.262,y-.010,y+.010,-.178,.19)
for y in (.49,.94,1.78):
    box('Tower glass shelves',2,-.730,-.264,y-.003,y+.003,-.170,.168,.0004)
    for x in (-.727,-.267):
        for z in (-.12,.13):
            rod('Shelf support pins',1,(x-.004,y-.007,z),(x+.004,y-.007,z),.003,10)
door('Tall display door',-.740,-.254,.105,1.452,-.275)
door('Upper tower door',-.740,-.254,1.486,2.08,-.275)

# Double overhead cabinet with white interior and transparent shelf.
box('Bridge back',0,-.244,.75,1.47,2.1,-.19,-.178)
box('Bridge right gable',0,.732,.75,1.47,2.1,-.19,.19)
for y in (1.48,2.09):
    box('Bridge top and bottom',0,-.244,.732,y-.010,y+.010,-.178,.19)
box('Bridge glass shelf',2,-.240,.729,1.778,1.784,-.169,.165,.0004)
door('Overhead left door',-.235,.244,1.497,2.08,.221)
door('Overhead right door',.250,.740,1.497,2.08,.274)
# Small concealed catches at door closures.
for x in (-.280,.222,.272):
    box('Door magnetic catches',3,x-.012,x+.012,2.045,2.06,.157,.180)

# Open bay: no table, countertop, or floor-standing support.

materials=[
    {'name':'Satin white powder coat','pbrMetallicRoughness':{'baseColorFactor':[.88,.90,.91,1],'metallicFactor':.18,'roughnessFactor':.3}},
    {'name':'Brushed nickel hardware','pbrMetallicRoughness':{'baseColorFactor':[.55,.59,.62,1],'metallicFactor':.9,'roughnessFactor':.24}},
    {'name':'Clear glass','doubleSided':True,'alphaMode':'BLEND','pbrMetallicRoughness':{'baseColorFactor':[.72,.87,.89,.20],'metallicFactor':.05,'roughnessFactor':.08},'extensions':{'KHR_materials_ior':{'ior':1.5}}},
    {'name':'Gaskets and recessed feet','pbrMetallicRoughness':{'baseColorFactor':[.12,.14,.15,1],'metallicFactor':0,'roughnessFactor':.8}},
]
core.doc={'asset':{'version':'2.0','generator':'SOG photo-referenced pantry cabinet'},'scene':0,'scenes':[{'nodes':[0]}],
    'nodes':[{'name':'White Glass-Front Pantry Cabinet','children':[]}],'meshes':[],'materials':materials,
    'buffers':[],'bufferViews':[],'accessors':[],'extensionsUsed':['KHR_materials_ior'],
    'extras':{'dimensionsMeters':[1.5,2.1,.438],'carcassDepthMeters':.38,'dimensionsAssumed':True,
              'reference':'white-glass-front-pantry-cabinet.jpg','inferredFeatures':[],'upAxis':'Y'}}
core.binary=bytearray()
for (name,material),(positions,normals,indices) in core.groups.items():
    attributes={'POSITION':core.accessor(positions,'f',5126,'VEC3',34962),'NORMAL':core.accessor(normals,'f',5126,'VEC3',34962)}
    idx=core.accessor(indices,'I',5125,'SCALAR',34963)
    core.doc['nodes'][0]['children'].append(len(core.doc['nodes']))
    core.doc['nodes'].append({'name':name,'mesh':len(core.doc['meshes'])})
    core.doc['meshes'].append({'name':name,'primitives':[{'attributes':attributes,'indices':idx,'material':material}]})
while len(core.binary)%4: core.binary.append(0)
core.doc['buffers']=[{'byteLength':len(core.binary)}]
metadata=json.dumps(core.doc,separators=(',',':')).encode()
metadata+=b' '*((-len(metadata))%4)
glb=struct.pack('<4sII',b'glTF',2,28+len(metadata)+len(core.binary))+struct.pack('<I4s',len(metadata),b'JSON')+metadata+struct.pack('<I4s',len(core.binary),b'BIN\0')+core.binary
output=Path(__file__).with_name('white-glass-front-pantry-cabinet.glb')
output.write_bytes(glb)
print(f'{output}: {len(glb):,} bytes; {sum(len(v[2])//3 for v in core.groups.values()):,} triangles')
