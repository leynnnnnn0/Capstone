"""Dependency-free structural and geometry checks for the generated GLBs."""
import json
import math
import struct
from pathlib import Path

def validate(path):
    raw=path.read_bytes()
    magic,version,length=struct.unpack_from('<4sII',raw)
    assert (magic,version,length)==(b'glTF',2,len(raw)), path
    n,kind=struct.unpack_from('<I4s',raw,12)
    assert kind==b'JSON' and n%4==0
    doc=json.loads(raw[20:20+n])
    size,kind=struct.unpack_from('<I4s',raw,20+n)
    binary=raw[28+n:]
    assert kind==b'BIN\0' and size==len(binary)==doc['buffers'][0]['byteLength']
    assert 28+n+size==len(raw)
    for view in doc['bufferViews']:
        assert view.get('byteOffset',0)+view['byteLength']<=len(binary)
    def read(index):
        a=doc['accessors'][index]
        v=doc['bufferViews'][a['bufferView']]
        code,width={5126:('f',4),5125:('I',4),5123:('H',2)}[a['componentType']]
        components={'SCALAR':1,'VEC2':2,'VEC3':3,'VEC4':4}[a['type']]
        offset=a.get('byteOffset',0)
        assert offset+a['count']*components*width<=v['byteLength']
        rows=list(struct.iter_unpack('<'+code*components,binary[v.get('byteOffset',0)+offset:v.get('byteOffset',0)+offset+a['count']*components*width]))
        assert all(math.isfinite(x) for row in rows for x in row)
        return rows
    triangles=0
    for mesh in doc['meshes']:
        for p in mesh['primitives']:
            positions=read(p['attributes']['POSITION'])
            normals=read(p['attributes']['NORMAL'])
            indices=read(p['indices'])
            assert len(normals)==len(positions)
            assert len(indices)%3==0
            assert all(0<=i[0]<len(positions) for i in indices)
            assert all(abs(sum(x*x for x in n)-1)<.001 for n in normals)
            assert 0<=p['material']<len(doc['materials'])
            if 'TEXCOORD_0' in p['attributes']:
                assert len(read(p['attributes']['TEXCOORD_0']))==len(positions)
            triangles+=len(indices)//3
    for image in doc.get('images',[]):
        assert 'uri' not in image, 'Textures must be embedded'
    assert doc['extras']['dimensionsAssumed'] is True
    print(f'PASS {path.name}: {triangles:,} triangles')

if __name__=='__main__':
    paths=sorted(Path(__file__).parent.glob('*.glb'))
    assert paths
    for path in paths: validate(path)
    print(f'{len(paths)} GLBs passed structural and geometry checks.')
