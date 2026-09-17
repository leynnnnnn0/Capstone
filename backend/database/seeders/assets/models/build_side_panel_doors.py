"""Generate the two photo-referenced side-panel doors, in meters, Y-up.

Run with Python 3 (standard library only). Importing the original builder also
regenerates Hanaloque 01; all three GLBs are deterministic and self-contained.
Nominal 900 x 2100 mm dimensions are assumed, not fabrication measurements.
"""
import json
import math
import struct
from pathlib import Path

import build_screen_door as core


def texture_png(width, height, pixel):
    rows = b''.join(b'\0' + b''.join(bytes(pixel(x, y)) for x in range(width)) for y in range(height))
    return (b'\x89PNG\r\n\x1a\n' + core.png_chunk(b'IHDR', struct.pack('>IIBBBBB', width, height, 8, 6, 0, 0, 0))
            + core.png_chunk(b'IDAT', core.zlib.compress(rows)) + core.png_chunk(b'IEND', b''))


def wood_pixel(x, y):
    # Fine longitudinal fibers, wavy darker growth bands, and small pores.
    warp = x + 2.0*math.sin(y*.022) + .8*math.sin(y*.071+x*.032)
    bands = math.sin(warp*.26 + .4*math.sin(y*.008))
    grain = math.sin(warp*2.2) + .45*math.sin(warp*5.6+y*.013)
    pores = max(0, math.sin(warp*4.1+y*.11))**18
    shade = 1 + .075*bands + .045*grain - .09*pores
    return tuple(max(0, min(255, round(v*shade))) for v in (174, 96, 49)) + (255,)


def make_model(wood):
    core.groups.clear()
    beam, rod, face = core.beam, core.rod, core.face
    name = 'Wood Finish Side Panel Screen Door 01' if wood else 'White Side Panel Screen Door 03'
    slug = 'wood-finish-side-panel-screen-door-01' if wood else 'white-side-panel-screen-door-03'

    def bar(label, a, b, width=.035, depth=.038, z=.015, material=0):
        beam(label, material, (*a,z), (*b,z), width, depth, .0015)

    def frame(label, l, r, lo, hi, width, depth, z, material=0):
        bar(label+' left stile', (l,lo), (l,hi), width,depth,z,material)
        bar(label+' right stile', (r,lo), (r,hi), width,depth,z,material)
        bar(label+' bottom rail', (l-width/2,lo), (r+width/2,lo),width,depth,z,material)
        bar(label+' top rail', (l-width/2,hi), (r+width/2,hi),width,depth,z,material)

    frame('Outer jamb',-.429,.429,.021,2.079,.042,.062,0)
    frame('Weather seal',-.404,.404,.046,2.054,.009,.016,.006,2)
    frame('Door leaf',-.381,.381,.069,2.031,.036,.040,.015)
    for x in (-.182,.182):
        bar('Full-height mullion '+str(x),(x,.069),(x,2.031),.038,.041)
    # The center has two tall fields; both side sections have three smaller panes.
    center=[(-.158,.158,.091,1.006),(-.158,.158,1.064,2.009)]
    sides=[]
    for l,r in [(-.357,-.206),(.206,.357)]:
        for lo,hi in [(.091,.649),(.711,1.319),(1.381,2.009)]:
            sides.append((l,r,lo,hi))
        for y in (.680,1.350):
            bar('Side cross rail '+str(l)+' '+str(y),(l-.011,y),(r+.011,y),.050,.041)
            for offset in (-.015,.015):
                bar('Cross rail raised bead '+str(l)+' '+str(y)+' '+str(offset),(l-.007,y+offset),(r+.007,y+offset),.004,.004,.039,1)
    bar('Center midrail',(-.177,1.035),(.177,1.035),.049,.041)
    for y in (1.020,1.049):
        bar('Center midrail raised bead '+str(y),(-.17,y),(.17,y),.004,.004,.039,1)

    for i,(l,r,lo,hi) in enumerate(center+sides):
        frame('Panel '+str(i)+' recessed bead',l-.003,r+.003,lo-.003,hi+.003,.006,.008,.038,1)
        # Thin rear retaining trim makes the reverse view complete too.
        frame('Panel '+str(i)+' rear bead',l-.003,r+.003,lo-.003,hi+.003,.005,.006,-.01,0)
        if wood or i < 2:
            for slope in (-1.42,1.42):
                for n in range(-12,50):
                    intercept=n*.108
                    hits=[]
                    for x in (l,r):
                        y=slope*x+intercept
                        if lo <= y <= hi: hits.append((x,y,.029))
                    for y in (lo,hi):
                        x=(y-intercept)/slope
                        if l < x < r: hits.append((x,y,.029))
                    if len(hits)==2:
                        rod('Diamond grille',1,*hits,.0018,8)
            face('Woven screen '+str(i),4,[(l,lo,.003),(r,lo,.003),(r,hi,.003),(l,hi,.003)])
        else:
            face('Clear side glass '+str(i),5,[(l,lo,.012),(r,lo,.012),(r,hi,.012),(l,hi,.012)])

    for y in (.24,1.05,1.87):
        bar('Hinge plate '+str(y),(.392,y-.035),(.392,y+.035),.032,.007,.041,3)
        rod('Hinge barrels',3,(.405,y-.04,.048),(.405,y+.04,.048),.006,16)
        for offset in (-.03,.03):
            rod('Fasteners',3,(.386,y+offset,.045),(.386,y+offset,.048),.0023,12)

    # Tall pull handle and separate cylinder, matching the visible reference hardware.
    for direction in (-1,1):
        z=.015+direction*.029
        bar('Handle backplate '+str(direction),(-.38,1.01),(-.38,1.21),.023,.008,z,3)
        for y in (1.055,1.175):
            rod('Pull handle standoffs',3,(-.38,y,z),(-.38,y,z+direction*.037),.006,16)
        beam('Rounded pull grip',3,(-.38,1.055,z+direction*.037),(-.38,1.175,z+direction*.037),.015,.019,.006)
        rod('Lock cylinder',3,(-.38,.995,z),(-.38,.995,z+direction*.006),.010,20)
        beam('Keyway',2,(-.38,.990,z+direction*.0065),(-.38,1.000,z+direction*.0065),.002,.0005,.0001)

    if not wood:
        bar('Overhead closer body',(.265,1.990),(.365,1.990),.039,.041,.063,3)
        rod('Closer spindle',3,(.287,1.99,.063),(.287,2.033,.063),.005,12)
        rod('Articulated closer arm A',3,(.287,2.033,.063),(.19,2.053,.115),.0035,12)
        rod('Articulated closer arm B',3,(.19,2.053,.115),(.335,2.073,.026),.0035,12)
        rod('Closer elbow',3,(.19,2.046,.115),(.19,2.060,.115),.006,16)

    finish = [1,1,1,1] if wood else [.82,.84,.80,1]
    grille = [.38,.145,.060,1] if wood else [.77,.80,.76,1]
    hardware = [.025,.031,.035,1] if wood else [.53,.56,.52,1]
    mats=[('Wood grain aluminum' if wood else 'Warm white powder-coated aluminum',finish,.15,.39),
          ('Copper brown grille' if wood else 'White grille and beads',grille,.25,.4),
          ('Black rubber gasket',[.018,.02,.019,1],0,.85),
          ('Black handle and hinges' if wood else 'Satin hardware',hardware,.6,.3),
          ('Fine woven insect mesh',[.065,.075,.07,1],0,.95),
          ('Clear glass',[.65,.82,.85,.13],0,.12)]
    core.doc={'asset':{'version':'2.0','generator':'SOG photo-referenced procedural models'},'scene':0,
              'scenes':[{'nodes':[0]}],'nodes':[{'name':name,'children':[]}], 'meshes':[],
              'materials':[{'name':n,'doubleSided':True,'pbrMetallicRoughness':{'baseColorFactor':c,'metallicFactor':m,'roughnessFactor':r}} for n,c,m,r in mats],
              'buffers':[],'bufferViews':[],'accessors':[],
              'extras':{'widthMeters':.9,'heightMeters':2.1,'dimensionsAssumed':True,'reference':slug+'.png','upAxis':'Y'}}
    core.binary=bytearray()
    doc=core.doc

    def add_texture(png):
        while len(core.binary)%4: core.binary.append(0)
        view=len(doc['bufferViews'])
        doc['bufferViews'].append({'buffer':0,'byteOffset':len(core.binary),'byteLength':len(png)})
        core.binary.extend(png)
        idx=len(doc.setdefault('images',[]))
        doc['images'].append({'bufferView':view,'mimeType':'image/png'})
        doc.setdefault('textures',[]).append({'source':idx,'sampler':0})
        return idx

    doc['samplers']=[{'magFilter':9729,'minFilter':9987,'wrapS':10497,'wrapT':10497}]
    screen=add_texture(texture_png(32,32,lambda x,y:(255,255,255,210 if x<3 or y<3 else 0)))
    doc['materials'][4]['alphaMode']='BLEND'
    doc['materials'][4]['pbrMetallicRoughness']['baseColorTexture']={'index':screen}
    doc['materials'][5]['alphaMode']='BLEND'
    if wood:
        tex=add_texture(texture_png(128,512,wood_pixel))
        doc['materials'][0]['pbrMetallicRoughness']['baseColorTexture']={'index':tex}

    for (label,mat),(positions,normals,indices) in core.groups.items():
        attrs={'POSITION':core.accessor(positions,'f',5126,'VEC3',34962),
               'NORMAL':core.accessor(normals,'f',5126,'VEC3',34962)}
        if mat==4:
            uvs=[(x/.002,y/.002) for x,y,z in positions]
            attrs['TEXCOORD_0']=core.accessor(uvs,'f',5126,'VEC2',34962)
        if wood and mat==0:
            spans=[max(p[k] for p in positions)-min(p[k] for p in positions) for k in range(3)]
            axis=max(range(3),key=lambda k:spans[k])
            across=1 if axis==0 else 0
            uvs=[((p[across]+p[2])/.045,p[axis]/.7) for p in positions]
            attrs['TEXCOORD_0']=core.accessor(uvs,'f',5126,'VEC2',34962)
        idx=core.accessor(indices,'I',5125,'SCALAR',34963)
        doc['nodes'][0]['children'].append(len(doc['nodes']))
        doc['nodes'].append({'name':label,'mesh':len(doc['meshes'])})
        doc['meshes'].append({'name':label,'primitives':[{'attributes':attrs,'indices':idx,'material':mat}]})
    while len(core.binary)%4: core.binary.append(0)
    doc['buffers']=[{'byteLength':len(core.binary)}]
    metadata=json.dumps(doc,separators=(',',':')).encode()
    metadata+=b' '*((-len(metadata))%4)
    glb=(struct.pack('<4sII',b'glTF',2,28+len(metadata)+len(core.binary))
         +struct.pack('<I4s',len(metadata),b'JSON')+metadata
         +struct.pack('<I4s',len(core.binary),b'BIN\0')+core.binary)
    target=Path(__file__).with_name(slug+'.glb')
    target.write_bytes(glb)
    print(f'{name}: {len(glb):,} bytes; {sum(len(v[2])//3 for v in core.groups.values()):,} triangles')


if __name__ == '__main__':
    make_model(False)
    make_model(True)
