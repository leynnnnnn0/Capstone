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
  context.shadowColor = "rgba(13, 31, 51, 0.28)";
  context.shadowBlur = 18;
  context.shadowOffsetY = 8;
  context.fillStyle = "rgba(255, 255, 255, 0.94)";
  context.beginPath();
  context.roundRect(22, 18, 468, 92, 30);
  context.fill();

  context.shadowColor = "transparent";
  context.shadowBlur = 0;
  context.shadowOffsetY = 0;
  context.strokeStyle = "rgba(220, 228, 234, 0.95)";
  context.lineWidth = 2;
  context.stroke();

  context.fillStyle = color;
  context.beginPath();
  context.roundRect(48, 44, 8, 40, 4);
  context.fill();

  let fontSize = 36;
  context.font = `600 ${fontSize}px "Instrument Sans Variable", "Instrument Sans", sans-serif`;
  while (context.measureText(text).width > 370 && fontSize > 24) {
    fontSize -= 2;
    context.font = `600 ${fontSize}px "Instrument Sans Variable", "Instrument Sans", sans-serif`;
  }

  context.fillStyle = "#162d4a";
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.fillText(text, 276, canvas.height / 2);

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
