import * as THREE from "three";

export function createLabel(text: string, color: string) {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 128;

  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("Unable to create label canvas.");
  }

  context.clearRect(0, 0, canvas.width, canvas.height);
  context.font = "650 36px Arial, sans-serif";
  context.fillStyle = color;
  context.strokeStyle = "rgba(2, 6, 23, 0.82)";
  context.lineWidth = 7;
  context.shadowColor = "rgba(2, 6, 23, 0.75)";
  context.shadowBlur = 8;
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.strokeText(text, canvas.width / 2, canvas.height / 2);
  context.fillText(text, canvas.width / 2, canvas.height / 2);

  const texture = new THREE.CanvasTexture(canvas);
  const material = new THREE.SpriteMaterial({
    map: texture,
    transparent: true,
    depthTest: false,
  });
  const sprite = new THREE.Sprite(material);
  sprite.scale.set(0.2, 0.05, 1);
  sprite.userData.texture = texture;

  return sprite;
}
