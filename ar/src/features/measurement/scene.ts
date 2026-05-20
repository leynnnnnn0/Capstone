import * as THREE from "three";

export interface MeasurementScene {
  camera: THREE.PerspectiveCamera;
  renderer: THREE.WebGLRenderer;
  reticle: THREE.Mesh;
  scene: THREE.Scene;
}

export function createMeasurementScene(canvas: HTMLCanvasElement): MeasurementScene {
  const renderer = new THREE.WebGLRenderer({
    canvas,
    alpha: true,
    antialias: true,
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setClearColor(0x000000, 0);
  renderer.xr.enabled = true;

  const scene = new THREE.Scene();
  scene.background = null;
  scene.add(new THREE.HemisphereLight(0xffffff, 0x475569, 1.2));

  const directional = new THREE.DirectionalLight(0xffffff, 1);
  directional.position.set(1, 2, 1);
  scene.add(directional);

  const camera = new THREE.PerspectiveCamera(
    70,
    window.innerWidth / window.innerHeight,
    0.01,
    30,
  );

  const reticleGeometry = new THREE.RingGeometry(0.045, 0.06, 48);
  reticleGeometry.applyMatrix4(new THREE.Matrix4().makeRotationX(-Math.PI / 2));

  const reticleMaterial = new THREE.MeshBasicMaterial({
    color: 0xff1744,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.9,
  });

  const reticle = new THREE.Mesh(reticleGeometry, reticleMaterial);
  reticle.matrixAutoUpdate = false;
  reticle.visible = false;
  scene.add(reticle);

  return {
    camera,
    renderer,
    reticle,
    scene,
  };
}

export function resizeMeasurementScene(measurementScene: MeasurementScene | null) {
  if (!measurementScene) return;

  measurementScene.camera.aspect = window.innerWidth / window.innerHeight;
  measurementScene.camera.updateProjectionMatrix();
  measurementScene.renderer.setSize(window.innerWidth, window.innerHeight);
}

export function disposeObject(object: THREE.Object3D) {
  object.traverse((child) => {
    const mesh = child as THREE.Mesh;
    mesh.geometry?.dispose();

    if (Array.isArray(mesh.material)) {
      mesh.material.forEach((material) => material.dispose());
    } else {
      mesh.material?.dispose();
    }

    const texture = child.userData.texture as THREE.Texture | undefined;
    texture?.dispose();
  });
}
