// ARPlace.jsx
// Step 2 — AR placement page. Receives width (w) and height (h) in cm as URL params.
// Supports WebXR hit-test AND a manual fallback for non-supported devices.
import { useEffect, useRef, useState } from 'react';
import { usePage } from '@inertiajs/react';


// ── mode detection ────────────────────────────────────────────────────────────
async function detectMode() {
    if (!window.isSecureContext) return 'insecure';
    if (!navigator.xr) return 'unsupported';
    const ok = await navigator.xr
        .isSessionSupported('immersive-ar')
        .catch(() => false);
    return ok ? 'webxr' : 'unsupported';
}

// ══════════════════════════════════════════════════════════════════════════════
// FALLBACK: camera feed + actual 3D model rendered on top via Three.js
// No WebXR needed — just camera + canvas overlay
// User drags the model to position it, pinches to resize
// ══════════════════════════════════════════════════════════════════════════════
function ManualFallback({ widthCm, heightCm }) {
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const [camError, setCamError] = useState(null);
    const [loading, setLoading] = useState(true);
    const [hint, setHint] = useState('Drag to position · Pinch to resize');

    useEffect(() => {
        let stream, renderer, scene, camera, model, rafId;
        let alive = true;

        // position & scale state (in screen px, mapped to 3D units)
        const state = {
            x: 0,
            y: 0,
            z: -1.5, // 3D position — z controls depth
            scale: 1,
            dragging: false,
            lastX: 0,
            lastY: 0,
            pinchDist: 0,
        };

        async function init() {
            // ── camera ────────────────────────────────────────────────────────
            try {
                stream = await navigator.mediaDevices.getUserMedia({
                    video: {
                        facingMode: 'environment',
                        width: { ideal: 1280 },
                        height: { ideal: 720 },
                    },
                });
                if (!alive) return;
                videoRef.current.srcObject = stream;
                await videoRef.current.play();
            } catch (e) {
                setCamError(
                    'Camera access denied. Please allow camera permission.',
                );
                return;
            }

            // ── Three.js setup ────────────────────────────────────────────────
            const THREE = await import('three');
            const { GLTFLoader } =
                await import('three/examples/jsm/loaders/GLTFLoader.js');
            if (!alive) return;

            const canvas = canvasRef.current;
            renderer = new THREE.WebGLRenderer({
                canvas,
                alpha: true,
                antialias: true,
            });
            renderer.setPixelRatio(window.devicePixelRatio);
            renderer.setSize(window.innerWidth, window.innerHeight);
            renderer.setClearColor(0x000000, 0); // transparent bg — camera shows through

            scene = new THREE.Scene();
            camera = new THREE.PerspectiveCamera(
                60,
                window.innerWidth / window.innerHeight,
                0.01,
                100,
            );
            camera.position.set(0, 0, 0);

            scene.add(new THREE.AmbientLight(0xffffff, 1.0));
            const dir = new THREE.DirectionalLight(0xffffff, 0.8);
            dir.position.set(2, 4, 3);
            scene.add(dir);
            const back = new THREE.DirectionalLight(0x88aaff, 0.3);
            back.position.set(-2, -1, -3);
            scene.add(back);

            // ── load GLB ─────────────────────────────────────────────────────
            try {
                const gltf = await new Promise((res, rej) =>
                    new GLTFLoader().load(
                        '/models/window.glb',
                        res,
                        undefined,
                        rej,
                    ),
                );
                if (!alive) return;
                model = gltf.scene;
                model.traverse((c) => {
                    if (c.isMesh) {
                        c.castShadow = true;
                    }
                });

                // scale to entered dimensions
                const widthM = widthCm / 100;
                const heightM = heightCm / 100;
                const box = new THREE.Box3().setFromObject(model);
                const size = new THREE.Vector3();
                box.getSize(size);
                const scaleX = size.x > 0 ? widthM / size.x : 1;
                const scaleY = size.y > 0 ? heightM / size.y : 1;
                const scaleZ = Math.min(scaleX, scaleY);
                model.scale.set(scaleX, scaleY, scaleZ);

                // center the model at origin
                const centeredBox = new THREE.Box3().setFromObject(model);
                const center = new THREE.Vector3();
                centeredBox.getCenter(center);
                model.position.sub(center);

                // start in center of screen
                model.position.z = -1.5;
                scene.add(model);
                setLoading(false);
            } catch (e) {
                setCamError(
                    'Could not load window.glb — check public/models/window.glb',
                );
                return;
            }

            // ── touch handlers ────────────────────────────────────────────────
            function onTouchStart(e) {
                e.preventDefault();
                if (e.touches.length === 1) {
                    state.dragging = true;
                    state.lastX = e.touches[0].clientX;
                    state.lastY = e.touches[0].clientY;
                } else if (e.touches.length === 2) {
                    state.dragging = false;
                    state.pinchDist = Math.hypot(
                        e.touches[0].clientX - e.touches[1].clientX,
                        e.touches[0].clientY - e.touches[1].clientY,
                    );
                }
            }

            function onTouchMove(e) {
                e.preventDefault();
                if (!model) return;

                if (e.touches.length === 1 && state.dragging) {
                    // convert screen px delta to 3D world units at current depth
                    const dx =
                        (e.touches[0].clientX - state.lastX) /
                        window.innerWidth;
                    const dy =
                        (e.touches[0].clientY - state.lastY) /
                        window.innerHeight;
                    const depth = Math.abs(model.position.z);
                    const fovRad = (camera.fov * Math.PI) / 180;
                    const viewH = 2 * Math.tan(fovRad / 2) * depth;
                    const viewW = viewH * camera.aspect;
                    model.position.x += dx * viewW;
                    model.position.y -= dy * viewH;
                    state.lastX = e.touches[0].clientX;
                    state.lastY = e.touches[0].clientY;
                } else if (e.touches.length === 2) {
                    const newDist = Math.hypot(
                        e.touches[0].clientX - e.touches[1].clientX,
                        e.touches[0].clientY - e.touches[1].clientY,
                    );
                    if (state.pinchDist > 0) {
                        const factor = newDist / state.pinchDist;
                        const newScale = Math.max(
                            0.1,
                            Math.min(5, model.scale.x * factor),
                        );
                        model.scale.setScalar(newScale);
                    }
                    state.pinchDist = newDist;
                }
            }

            function onTouchEnd(e) {
                if (e.touches.length === 0) state.dragging = false;
                if (e.touches.length < 2) state.pinchDist = 0;
            }

            canvas.addEventListener('touchstart', onTouchStart, {
                passive: false,
            });
            canvas.addEventListener('touchmove', onTouchMove, {
                passive: false,
            });
            canvas.addEventListener('touchend', onTouchEnd, { passive: true });

            // ── render loop ───────────────────────────────────────────────────
            function animate() {
                if (!alive) return;
                rafId = requestAnimationFrame(animate);
                renderer.render(scene, camera);
            }
            animate();
        }

        init();

        return () => {
            alive = false;
            cancelAnimationFrame(rafId);
            renderer?.dispose();
            stream?.getTracks().forEach((t) => t.stop());
        };
    }, []);

    return (
        <div style={fb.root}>
            {/* camera feed as background */}
            <video ref={videoRef} style={fb.video} playsInline muted autoPlay />

            {/* Three.js canvas on top — transparent background shows camera */}
            <canvas ref={canvasRef} style={fb.canvas} />

            {camError && (
                <div style={fb.camError}>
                    <div style={{ fontSize: 32 }}>📷</div>
                    <p>{camError}</p>
                </div>
            )}

            {loading && !camError && (
                <div style={fb.loadingWrap}>
                    <div style={fb.spinner} />
                    <span>Loading 3D model…</span>
                </div>
            )}

            {!loading && !camError && (
                <div style={fb.bar}>
                    <div style={fb.barRow}>
                        <div style={fb.barItem}>
                            <span style={fb.barIcon}>☝</span>
                            <span>Drag to move</span>
                        </div>
                        <div style={fb.barItem}>
                            <span style={fb.barIcon}>✌</span>
                            <span>Pinch to resize</span>
                        </div>
                    </div>
                    <div style={fb.dimBadge}>
                        {widthCm} × {heightCm} cm
                    </div>
                </div>
            )}
        </div>
    );
}

// ══════════════════════════════════════════════════════════════════════════════
// WEBXR: hit-test based placement
// ══════════════════════════════════════════════════════════════════════════════
function WebXRPlace({ widthCm, heightCm }) {
    const canvasRef = useRef(null);
    const overlayRef = useRef(null);
    const [status, setStatus] = useState('starting');
    const [errorMsg, setErrorMsg] = useState('');

    useEffect(() => {
        let session, renderer, scene, camera, reticle, placedModel;
        let hitTestSource, refSpace;
        let isPlaced = false;
        let THREE_REF = null;

        const widthM = widthCm / 100;
        const heightM = heightCm / 100;

        async function start() {
            try {
                const THREE = await import('three');
                const { GLTFLoader } =
                    await import('three/examples/jsm/loaders/GLTFLoader.js');
                THREE_REF = THREE;

                renderer = new THREE.WebGLRenderer({
                    canvas: canvasRef.current,
                    alpha: true,
                    antialias: true,
                });
                renderer.setPixelRatio(window.devicePixelRatio);
                renderer.setSize(window.innerWidth, window.innerHeight);
                renderer.xr.enabled = true;

                scene = new THREE.Scene();
                camera = new THREE.PerspectiveCamera(
                    70,
                    window.innerWidth / window.innerHeight,
                    0.01,
                    20,
                );
                scene.add(new THREE.AmbientLight(0xffffff, 0.9));
                const dir = new THREE.DirectionalLight(0xffffff, 0.7);
                dir.position.set(1, 2, 3);
                scene.add(dir);

                // reticle — flat ring on detected surface
                const rGeo = new THREE.RingGeometry(0.03, 0.045, 32).rotateX(
                    -Math.PI / 2,
                );
                const rMat = new THREE.MeshBasicMaterial({
                    color: 0x608DB9,
                    side: THREE.DoubleSide,
                });
                reticle = new THREE.Mesh(rGeo, rMat);
                reticle.matrixAutoUpdate = false;
                reticle.visible = false;
                scene.add(reticle);

                // preload the GLB NOW — so tap is instant, no delay
                setStatus('loading');
                let loadedGltf;
                try {
                    loadedGltf = await new Promise((res, rej) =>
                        new GLTFLoader().load(
                            '/models/window.glb',
                            res,
                            undefined,
                            rej,
                        ),
                    );
                } catch (e) {
                    setStatus('error');
                    setErrorMsg(
                        'Could not load window.glb — check public/models/window.glb exists',
                    );
                    return;
                }

                session = await navigator.xr.requestSession('immersive-ar', {
                    requiredFeatures: ['hit-test'],
                    optionalFeatures: ['dom-overlay'],
                    domOverlay: { root: overlayRef.current },
                });

                renderer.xr.setReferenceSpaceType('local');
                await renderer.xr.setSession(session);

                refSpace = await session.requestReferenceSpace('local');
                const viewerSpace =
                    await session.requestReferenceSpace('viewer');
                hitTestSource = await session.requestHitTestSource({
                    space: viewerSpace,
                });

                setStatus('scanning');

                // tap to place — model is already loaded, placement is instant
                session.addEventListener('select', () => {
                    if (isPlaced || !reticle.visible) return;
                    isPlaced = true;
                    setStatus('placed');

                    const model = loadedGltf.scene.clone();
                    model.traverse((c) => {
                        if (c.isMesh) {
                            c.castShadow = true;
                            c.receiveShadow = true;
                        }
                    });

                    // scale model to the user-entered dimensions
                    const box = new THREE.Box3().setFromObject(model);
                    const size = new THREE.Vector3();
                    box.getSize(size);
                    const scaleX = size.x > 0 ? widthM / size.x : 1;
                    const scaleY = size.y > 0 ? heightM / size.y : 1;
                    const scaleZ = Math.min(scaleX, scaleY);
                    model.scale.set(scaleX, scaleY, scaleZ);

                    // get the hit position from the reticle
                    const hitPos = new THREE.Vector3();
                    const hitQuat = new THREE.Quaternion();
                    reticle.matrix.decompose(
                        hitPos,
                        hitQuat,
                        new THREE.Vector3(),
                    );

                    // face model toward camera (world-up orientation — never tilts)
                    const camPos = new THREE.Vector3();
                    camera.getWorldPosition(camPos);
                    const toCamera = new THREE.Vector3().subVectors(
                        camPos,
                        hitPos,
                    );
                    toCamera.y = 0; // keep it horizontal — don't tilt up/down
                    toCamera.normalize();

                    // right = toCamera × worldUp, then recompute up
                    const worldUp = new THREE.Vector3(0, 1, 0);
                    const right = new THREE.Vector3()
                        .crossVectors(worldUp, toCamera)
                        .normalize();
                    const forward = new THREE.Vector3()
                        .crossVectors(right, worldUp)
                        .normalize();

                    const rotMatrix = new THREE.Matrix4().makeBasis(
                        right,
                        worldUp,
                        forward,
                    );
                    model.setRotationFromMatrix(rotMatrix);

                    // center the model at the hit point
                    model.position.copy(hitPos);

                    // correct for bounding box center offset after rotation
                    const scaledBox = new THREE.Box3().setFromObject(model);
                    const scaledCenter = new THREE.Vector3();
                    scaledBox.getCenter(scaledCenter);
                    model.position.x += hitPos.x - scaledCenter.x;
                    model.position.z += hitPos.z - scaledCenter.z;
                    // keep y at hit point bottom
                    const scaledSize = new THREE.Vector3();
                    scaledBox.getSize(scaledSize);
                    model.position.y = hitPos.y + scaledSize.y / 2;

                    reticle.visible = false;
                    scene.add(model);
                    placedModel = model;
                });

                renderer.setAnimationLoop((_, frame) => {
                    if (!frame) return;
                    if (!isPlaced) {
                        const results = frame.getHitTestResults(hitTestSource);
                        if (results.length > 0) {
                            const pose = results[0].getPose(refSpace);
                            reticle.visible = true;
                            reticle.matrix.fromArray(pose.transform.matrix);
                        } else {
                            reticle.visible = false;
                        }
                    }
                    renderer.render(scene, camera);
                });

                session.addEventListener('end', () => {
                    renderer.setAnimationLoop(null);
                });
            } catch (err) {
                setStatus('error');
                setErrorMsg(err.message || 'Failed to start AR');
            }
        }

        start();
        return () => {
            session?.end().catch(() => {});
            renderer?.setAnimationLoop(null);
            renderer?.dispose();
        };
    }, []);

    return (
        <div
            style={{
                position: 'relative',
                width: '100vw',
                height: '100vh',
                background: '#000',
            }}
        >
            <canvas
                ref={canvasRef}
                style={{
                    position: 'absolute',
                    inset: 0,
                    width: '100%',
                    height: '100%',
                }}
            />

            <div
                ref={overlayRef}
                style={{
                    position: 'absolute',
                    inset: 0,
                    pointerEvents: 'none',
                    fontFamily: "'Segoe UI', sans-serif",
                    zIndex: 10,
                }}
            >
                {/* top bar */}
                <div style={xr.topBar}>
                    <button style={xr.backBtn} onClick={() => history.back()}>
                        ✕ Exit
                    </button>
                    <div style={xr.dimBadge}>
                        {widthCm} × {heightCm} cm
                    </div>
                </div>

                {/* status hints */}
                {(status === 'starting' || status === 'loading') && (
                    <div style={xr.hint}>
                        <div style={xr.spinner} />
                        {status === 'loading'
                            ? 'Loading 3D model…'
                            : 'Starting AR…'}
                    </div>
                )}

                {status === 'scanning' && (
                    <div style={xr.hint}>
                        <div style={xr.hintIcon}>🎯</div>
                        Point camera at any surface and tap to place
                    </div>
                )}

                {status === 'placed' && (
                    <div style={xr.successBar}>
                        <span>
                            ✓ Window placed — {widthCm} × {heightCm} cm
                        </span>
                    </div>
                )}

                {status === 'error' && (
                    <div style={xr.errorBar}>{errorMsg}</div>
                )}

                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
        </div>
    );
}

// ══════════════════════════════════════════════════════════════════════════════
// MAIN: detect capability and render the right experience
// ══════════════════════════════════════════════════════════════════════════════
export default function ARPlace() {
    const { w, h } = usePage().props; // passed from Inertia router
    const widthCm = parseFloat(w) || 90;
    const heightCm = parseFloat(h) || 210;

    const [mode, setMode] = useState(null); // null=checking | webxr | unsupported | insecure

    useEffect(() => {
        detectMode().then(setMode);
    }, []);

    if (!mode) {
        return (
            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: '100vh',
                    background: '#f5f7fa',
                    fontFamily: "'Segoe UI',sans-serif",
                }}
            >
                <div style={{ textAlign: 'center', color: '#7a91a8' }}>
                    <div style={{ fontSize: 32, marginBottom: 12 }}>⚙️</div>
                    Checking device compatibility…
                </div>
            </div>
        );
    }

    if (mode === 'insecure') {
        return (
            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: '100vh',
                    background: '#f5f7fa',
                    fontFamily: "'Segoe UI',sans-serif",
                    padding: 24,
                }}
            >
                <div style={{ textAlign: 'center', maxWidth: 320 }}>
                    <div style={{ fontSize: 40, marginBottom: 12 }}>🔒</div>
                    <h2 style={{ color: '#1a2332', marginBottom: 8 }}>
                        HTTPS Required
                    </h2>
                    <p style={{ color: '#7a91a8', fontSize: 14 }}>
                        AR features require a secure connection. Please access
                        this page over HTTPS.
                    </p>
                    <button
                        onClick={() => history.back()}
                        style={{
                            marginTop: 20,
                            padding: '10px 24px',
                            background: '#608DB9',
                            color: 'white',
                            border: 'none',
                            borderRadius: 10,
                            fontWeight: 700,
                            cursor: 'pointer',
                        }}
                    >
                        Go Back
                    </button>
                </div>
            </div>
        );
    }

    if (mode === 'unsupported') {
        return <ManualFallback widthCm={widthCm} heightCm={heightCm} />;
    }

    return <WebXRPlace widthCm={widthCm} heightCm={heightCm} />;
}

// ── styles ────────────────────────────────────────────────────────────────────
const fb = {
    root: {
        position: 'relative',
        width: '100vw',
        height: '100vh',
        overflow: 'hidden',
        background: '#000',
    },
    video: {
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        objectFit: 'cover',
    },
    canvas: {
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        touchAction: 'none',
    },
    camError: {
        position: 'absolute',
        inset: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'white',
        gap: 12,
        padding: 24,
        textAlign: 'center',
        zIndex: 10,
    },
    loadingWrap: {
        position: 'absolute',
        inset: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'white',
        gap: 12,
        zIndex: 10,
        background: 'rgba(0,0,0,0.5)',
    },
    spinner: {
        width: 28,
        height: 28,
        border: '3px solid rgba(255,255,255,0.2)',
        borderTopColor: '#608DB9',
        borderRadius: '50%',
        animation: 'spin 0.8s linear infinite',
    },
    bar: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        background: 'rgba(10,10,20,0.88)',
        backdropFilter: 'blur(12px)',
        padding: '14px 20px 32px',
        borderRadius: '20px 20px 0 0',
        zIndex: 10,
    },
    barRow: {
        display: 'flex',
        justifyContent: 'center',
        gap: 32,
        marginBottom: 10,
    },
    barItem: {
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        color: 'white',
        fontSize: 13,
    },
    barIcon: { fontSize: 18 },
    dimBadge: {
        textAlign: 'center',
        color: '#608DB9',
        fontSize: 13,
        fontWeight: 700,
    },
};

const xr = {
    topBar: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '16px 20px',
        pointerEvents: 'auto',
    },
    backBtn: {
        background: 'rgba(0,0,0,0.55)',
        color: 'white',
        border: '1px solid rgba(255,255,255,0.2)',
        borderRadius: 8,
        padding: '8px 14px',
        fontSize: 14,
        cursor: 'pointer',
    },
    dimBadge: {
        background: 'rgba(158,180,201,0.2)',
        color: '#608DB9',
        border: '1px solid rgba(158,180,201,0.4)',
        borderRadius: 20,
        padding: '5px 14px',
        fontSize: 13,
        fontWeight: 700,
    },
    hint: {
        position: 'absolute',
        bottom: 100,
        left: 20,
        right: 20,
        background: 'rgba(0,0,0,0.78)',
        backdropFilter: 'blur(12px)',
        borderRadius: 14,
        padding: '14px 18px',
        color: 'white',
        fontSize: 14,
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        justifyContent: 'center',
        textAlign: 'center',
    },
    hintIcon: { fontSize: 20 },
    spinner: {
        width: 18,
        height: 18,
        border: '2.5px solid rgba(255,255,255,0.2)',
        borderTopColor: '#608DB9',
        borderRadius: '50%',
        animation: 'spin 0.8s linear infinite',
        flexShrink: 0,
    },
    successBar: {
        position: 'absolute',
        bottom: 100,
        left: 20,
        right: 20,
        background: 'rgba(0,200,100,0.15)',
        backdropFilter: 'blur(12px)',
        border: '1px solid rgba(0,200,100,0.3)',
        borderRadius: 14,
        padding: '14px 18px',
        color: '#00e676',
        fontSize: 14,
        textAlign: 'center',
    },
    errorBar: {
        position: 'absolute',
        bottom: 100,
        left: 20,
        right: 20,
        background: 'rgba(255,60,60,0.15)',
        backdropFilter: 'blur(12px)',
        border: '1px solid rgba(255,60,60,0.3)',
        borderRadius: 14,
        padding: '14px 18px',
        color: '#ff6b6b',
        fontSize: 14,
        textAlign: 'center',
    },
};
