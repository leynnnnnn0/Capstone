"""September 20 annotated-photo revisions. Dimensions remain illustrative."""
import math

REVISED = (3,5,6,7,8,9,10,11,12,13,14,15)

def build(i,m):
    box,frame,rod=m.box,m.frame,m.rod
    black,silver,white,wood=m.BLACK,m.SILVER,m.WHITE,m.WOOD
    mat=silver if i in (5,11,12) else white if i==15 else black
    if i in (8,9,13):
        mat=len(m.MATS)
        m.MATS.append(('Terracotta finish' if i==8 else 'Red finish',[.43,.075,.045,1] if i==8 else [.40,.025,.035,1],.35,.32))
    w={3:2.8,5:1.4,6:1.5,7:1.8,8:3.2,9:3.2,10:1.1,11:3.2,12:3.2,13:3.2,14:4.8,15:3.6}[i]
    h=2.3 if i==3 else 2.05
    count=1 if i==10 else 4 if i in (7,8,11,14,15) else 3 if i==13 else 2
    widths=[.24,.66,.66,.24] if i==7 else [w/count]*count

    def bar(name,a,b,y,thick=.025):
        box(name,mat,a,b,y,y+thick,-.014,.014)

    def stile(name,x,lo,hi,thick=.022):
        box(name,mat,x-thick/2,x+thick/2,lo,hi,-.016,.016)

    def curve(name,points,r=.005):
        for a,b in zip(points,points[1:]):rod(name,mat,a,b,r)

    def finial(x,y,floral=False):
        rod('Finial stem',mat,(x,y,0),(x,y+.14,0),.009)
        # Solid four-sided spear, with curved fleur-de-lis lobes and collar.
        tip=(x,y+.225,0)
        base=[(x-.020,y+.14,0),(x,y+.13,.014),(x+.020,y+.14,0),(x,y+.13,-.014)]
        for j in range(4):m.g.face('Sculpted spear tip',mat,[base[j],base[(j+1)%4],tip])
        if floral:
            for side in (-1,1):
                pts=[(x+side*(.008+.036*math.sin(math.pi*t/20)),y+.065+.075*t/20,0) for t in range(21)]
                curve('Fleur-de-lis curled lobes',pts,.007)
            bar('Finial collar',x-.028,x+.028,y+.052,.013)

    def flower_strip(x,lo,hi):
        # Winding botanical stem, six pointed leaves, and a tulip crown.
        curve('Winding floral stem',[(x+.024*math.sin(t*math.pi/24),lo+(hi-lo)*t/72,0) for t in range(73)])
        for j in range(6):
            y=lo+.10+j*(hi-lo-.32)/6
            s=-1 if j%2 else 1
            start=(x,y,0);tip=(x+s*.075,y+.18,0)
            for bulge in (-.018,.018):
                points=[]
                for k in range(17):
                    t=k/16
                    points.append((start[0]+(tip[0]-start[0])*t+bulge*math.sin(math.pi*t),start[1]+.18*t,0))
                curve('Pointed botanical leaf',points,.005)
        y=hi-.15
        for s in (-1,1):
            curve('Tulip petals',[(x+s*.06*math.sin(math.pi*t/32),y+.15*t/16,0) for t in range(17)],.005)

    # No roof-like box: slender installation jambs only.
    for x in (-w/2-.025,w/2+.025):stile('Outer installation jamb',x,.025,h,.045)
    a=-w/2
    for n,width in enumerate(widths):
        b=a+width
        left,right=a+.012,b-.012
        lo,hi=left+.043,right-.043
        with m.place('Leaf '+str(n+1)):
            if i==3:
                # Alternating tall straight bars and lower ornate spear pickets.
                stile('Leaf side stile',left+.02,.06,h)
                stile('Leaf side stile',right-.02,.06,h)
                bar('Bottom leaf rail',lo,hi,.06,.04)
                bar('Spear-height cross rail',lo,hi,1.65,.05)
                bar('Upper leaf rail',lo,hi,h-.035,.035)
                slots=max(4,round((hi-lo)/.075))
                for k in range(slots):
                    x=lo+(hi-lo)*(k+.5)/slots
                    if k%2==0:
                        stile('Tall bars between spears',x,.10,h-.02,.016)
                    else:
                        stile('Short spear pickets',x,.10,1.71,.016)
                        finial(x,1.69,True)
            elif i==11:
                # Center pair taller, with a segmental arched crown.
                top=lambda x:2.08+.20*math.sin(math.pi*(x+w/2)/w) if n in (1,2) else 2.03
                stile('Leaf side stile',left+.02,.06,top(left),.04)
                stile('Leaf side stile',right-.02,.06,top(right),.04)
                curve('Arched leaf header',[(left+(right-left)*k/24,top(left+(right-left)*k/24),0) for k in range(25)],.024)
                # The second solid row shares exactly the same level on all leaves.
                for y0,y1 in ((.10,.55),(.59,1.08)):
                    box('Aligned lower solid panels',mat,lo,hi,y0,y1,-.012,.012)
                    frame('Solid panel border',mat,lo,hi,y0,y1,.014,.023,.018)
                split=1.58 if n in (1,2) else 1.10
                if n in (1,2):
                    box('Center upper solid panel',mat,lo,hi,1.12,split,-.012,.012)
                    frame('Center panel border',mat,lo,hi,1.12,split,.014,.023,.018)
                for k in range(5 if n in (1,2) else 9):
                    y=split+.055+k*.105
                    if y<min(top(lo),top(hi))-.04:bar('Upper grille bars',lo,hi,y)
            else:
                frame('Leaf frame',mat,left,right,.06,h,0,.035,.046)
                if i==5:
                    box('Lower silver privacy panel',mat,lo,hi,.10,.76,-.012,.012)
                    # Mirrored narrow rectangles near the meeting stiles,
                    # with a separate two-bar outer grille and crossed midrails.
                    mid=lo+(hi-lo)*(.48 if n==0 else .52)
                    qa,qb=(mid,hi-.035) if n==0 else (lo+.035,mid)
                    oa,ob=(lo,mid-.025) if n==0 else (mid+.025,hi)
                    for t in (.32,.72):stile('Outer vertical grille',oa+(ob-oa)*t,.78,2.01,.020)
                    for y in (1.24,1.43):bar('Outer crossing grille',oa,ob,y,.02)
                    for y in (.91,1.24,1.57):
                        frame('Meeting-side rectangular motif',mat,qa,qb,y,y+.22,0,.019,.026)
                        bar('Motif outer ties',oa if n==0 else qb,qa if n==0 else ob,y+.10,.018)
                    for y in (.82,1.91):bar('Inner grille crossrail',qa,qb,y,.02)
                    stile('Inner grille divider',mid,.78,2.01,.025)
                elif i==6:
                    box('Lower solid panel',mat,lo,hi,.10,.69,-.012,.012)
                    for k in range(19):
                        y=.73+k*.064
                        m.g.face('Angled louver blades',mat,[(lo,y,.021),(hi,y,.021),(hi,y+.052,-.016),(lo,y+.052,-.016)])
                        box('Louver rolled edges',mat,lo,hi,y,y+.004,.016,.025)
                    m.handle('Horizontal handle above solid panel',(lo+hi)/2,.72,.029,mat,length=.20,horizontal=True)
                elif i in (7,8,9,10):
                    fixed=i==7 and n in (0,3)
                    # Leave genuinely open vertical margins; bars stop at inset stiles.
                    gap=min(.10,(hi-lo)*.15) if not fixed else .025
                    ia,ib=lo+gap,hi-gap
                    if i==10:ib=hi # Single open side strip, as photographed.
                    for x in ((ia,) if i==10 else (ia,ib)):stile('Inset stile beside open vertical gap',x,.10,h-.045)
                    if i==8:
                        box('Lower solid terracotta panel',mat,lo,hi,.10,1.03,-.012,.012)
                        for k in range(7):bar('Upper inset grille',ia,ib,1.09+k*.13)
                    elif i in (9,10):
                        count_boards=4 if i==10 else 5
                        for k in range(count_boards):
                            y=.15+k*(.44 if i==10 else .36)
                            box('Brown accent board' if i==10 else 'Red horizontal board',m.BROWN if i==10 else mat,ia,ib,y,y+.23 if i==10 else y+.15,-.015,.015)
                            bar('Bars between boards',ia,ib,y+.31 if i==10 else y+.24,.025)
                    else:
                        for k in range(12):bar('Fixed sidelight bars' if fixed else 'Door inset horizontal bars',ia,ib,.13+k*.153)
                elif i==12:
                    ia,ib=lo+.20,hi-.20
                    for x in (ia,ib):stile('Floral border stile',x,.10,2.01,.022)
                    for k in range(7):
                        y=.14+k*.26
                        box('Wood accent board',wood,ia,ib,y,y+.17,-.016,.016)
                        for yy in (y-.015,y+.17):bar('Silver edging above and below wood',ia,ib,yy,.015)
                        for x in (ia+.06,ib-.06):
                            for dy in (.045,.125):rod('Board rivets',silver,(x,y+dy,.016),(x,y+dy,.024),.006)
                    for x in (lo+.095,hi-.095):flower_strip(x,.12,1.98)
                    for k in range(6):finial(lo+(hi-lo)*(k+.5)/6,h,True)
                elif i==13:
                    pa,pb=lo+.060,hi-.060
                    if n==0:
                        # Two real solid polygons separated by a diagonal open slot.
                        y0,y1=.12,1.99
                        xa=pa+(pb-pa)*.16;xb=pa+(pb-pa)*.70;gap=.065
                        polygons=[[(pa,y0),(xa,y0),(xb,y1),(pa,y1)],[(xa+gap,y0),(pb,y0),(pb,y1),(xb+gap,y1)]]
                        for poly in polygons:
                            for z,points in ((.015,poly),(-.015,list(reversed(poly)))):
                                m.g.face('Slanted split solid panel',mat,[(x,y,z) for x,y in points])
                            for p,q in zip(poly,poly[1:]+poly[:1]):
                                m.g.face('Solid panel thickness',mat,[(p[0],p[1],-.015),(q[0],q[1],-.015),(q[0],q[1],.015),(p[0],p[1],.015)])
                        for shift in (0,gap):rod('Slanted slot trim',silver,(xa+shift,y0,.02),(xb+shift,y1,.02),.008)
                    else:
                        box('Inset solid privacy panel',mat,pa,pb,.12,1.99,-.015,.015)
                        frame('Raised panel molding',mat,pa,pb,.12,1.99,.02,.018,.015)
                    for y in (.25,.78,1.43,1.88):
                        bar('Panel support across side gap',lo,pa,y,.020)
                        bar('Panel support across side gap',pb,hi,y,.020)
                elif i==14:
                    for k in range(17):
                        x=lo+(hi-lo)*(k+.5)/17
                        if k%2==0:stile('Continuous alternating pickets',x,.10,2.01,.019)
                        else:
                            stile('Interrupted picket bottom',x,.10,.63,.019)
                            stile('Interrupted picket top',x,1.48,2.01,.019)
                    for y in (.23,.31,.39,.47,1.62,1.70,1.78,1.86):bar('Lattice bands',lo,hi,y,.019)
                elif i==15:
                    mid=(lo+hi)/2
                    bar('Central cross rail',lo,hi,1.015,.035)
                    stile('Central motif spine',mid,.10,2.01,.025)
                    for k,(x0,x1) in enumerate(((lo,mid-.025),(mid+.025,hi))):
                        # Opposing handed L/U returns, mirrored in adjacent leaves.
                        rightward=(k+n)%2==0
                        x=x1-.065 if rightward else x0+.065
                        end=x0 if rightward else x1
                        stile('Upper mirrored return',x,1.17,2.01,.018)
                        stile('Lower mirrored return',x,.10,.88,.018)
                        for y in (.88,1.17):bar('Mirrored motif cross return',min(x,end),max(x,end),y,.018)
            fixed=i==7 and n in (0,3)
            if not fixed:
                for y in (.28,1.74):rod('Hinge barrel',mat,(left,y-.05,.034),(left,y+.05,.034),.012)
                if i!=6 and n==(1 if i==7 else 0):m.handle('Gate pull',right-.075,.98,.03,silver if mat==silver else mat,length=.20)
        a=b
    if i==13:
        points=[(-w/2+w*k/48,h+.07+.25*math.sin(math.pi*k/48),0) for k in range(49)]
        curve('Arched upper grille rail',points,.021)
        for k in range(1,22):
            x=-w/2+w*k/22
            rod('Silver top grille bars',silver,(x,h,0),(x,h+.07+.25*math.sin(math.pi*k/22),0),.012)
