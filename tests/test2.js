const faceapi = require('@vladmandic/face-api');
const canvas = require("canvas");
require('@tensorflow/tfjs-node');
const fs = require("fs");
const path = require('path');

async function loadModels(modelsPath) {
  await Promise.all([
    faceapi.nets.ssdMobilenetv1.loadFromDisk(modelsPath),
    faceapi.nets.faceLandmark68Net.loadFromDisk(modelsPath),
    faceapi.nets.faceRecognitionNet.loadFromDisk(modelsPath)
  ]);
}

function rotateAndDrawImage(ctx, image, x, y, width, height, angle) {
  ctx.save();
  ctx.translate(x + width / 2, y + height / 2);
  ctx.rotate(angle);
  ctx.drawImage(image, -width / 2, -height / 2, width, height);
  ctx.restore();
}

async function processImage(imagePath, jokerPath, outputPath, modelsPath) {
  try {
    const { Canvas, Image, ImageData } = canvas;
    faceapi.env.monkeyPatch({ Canvas, Image, ImageData });

    await loadModels(modelsPath);

    const [image, joker] = await Promise.all([
      canvas.loadImage(imagePath),
      canvas.loadImage(jokerPath)
    ]);

    const detections = await faceapi.detectAllFaces(image).withFaceLandmarks();
    if (detections.length === 0) {
      console.log("> NO SE DETECTARON CARAS.");
      return false;
    }
    const outputCanvas = canvas.createCanvas(image.width, image.height);
    const ctx = outputCanvas.getContext('2d');
    ctx.drawImage(image, 0, 0);

    detections.forEach(detection => {
      const { landmarks, detection: { box } } = detection;
      const leftEye = landmarks.getLeftEye()[0];
      const rightEye = landmarks.getRightEye()[3];

      const angle = Math.atan2(rightEye.y - leftEye.y, rightEye.x - leftEye.x);

      const jokerWidth = box.width * 1.35;
      const jokerHeight = box.height * 1.35;
      const jokerX = box.x + box.width / 2 - jokerWidth / 2;
      const jokerY = box.y + box.height / 2 - jokerHeight / 2;

      rotateAndDrawImage(ctx, joker, jokerX, jokerY, jokerWidth, jokerHeight, angle);
    });

    const buffer = outputCanvas.toBuffer("image/png");
    fs.writeFileSync(outputPath, buffer);
    console.log(`Imagen guardada COmo: ${outputPath}`);
  } catch (error) {
    console.error("ERROR: ", error.message);
  }
}

(async () => {
  const imagePath = path.join(__dirname, "../cache/joker/s/1745901745315.jpg");
  const jokerPath = path.join(__dirname, "../assets/joker.png");
  const outputPath = path.join(__dirname, "image.png");
  const modelsPath = path.join(__dirname, "../models/face-api");

  await processImage(imagePath, jokerPath, outputPath, modelsPath);
})();
