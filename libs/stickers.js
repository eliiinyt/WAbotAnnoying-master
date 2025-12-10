const { Sticker } = require("wa-sticker-formatter");
const { spawn } = require('child_process');
const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;
const fs = require("fs-extra");
const path = require("path");
const { input } = require("@tensorflow/tfjs-node");

const videoToWebp = async (buffer) => {
    const tmpDir = path.resolve("./tmp");
    await fs.ensureDir(tmpDir);

    const inputPath = path.join(tmpDir, `in_${Date.now()}_${Math.random().toString(36).substring(7)}.mp4`);
    const outputPath = path.join(tmpDir, `out_${Date.now()}_${Math.random().toString(36).substring(7)}.webp`);

    await fs.writeFile(inputPath, buffer);
const args = [
        "-i", inputPath, "-vcodec", "libwebp_anim", "-loop", 0,
        "-vf",
        "scale='min(500,iw)':min'(500,ih)':force_original_aspect_ratio=decrease,format=rgba,fps=15,pad=500:500:-1:-1:color=#00000000",
        "-pix_fmt", "yuva420p",
        "-y", outputPath
    ];

    return new Promise((resolve, reject) => {
        const process = spawn(ffmpegPath, args);

        process.on('close', async (code) => {
            if (code === 0) {
                try {
                    const webpBuffer = await fs.readFile(outputPath);
                    await Promise.all([
                        fs.unlink(inputPath).catch(() => {}),
                        fs.unlink(outputPath).catch(() => {})
                    ]);
                    resolve(webpBuffer);
                } catch (err) {
                    reject(err);
                }
            } else {
                await fs.unlink(inputPath).catch(() => {});
                reject(new Error(`FFmpeg exited with code ${code}`));
            }
        });

        process.on('error', async (err) => {
            await fs.unlink(inputPath).catch(() => {});
            reject(err);
        });
    });
};

async function createSticker(img, url, packName, authorName, quality = 50) {
    let stickerMetadata = {
        type: 'full',
        pack: packName || "Stickers",
        author: authorName || "undefined",
        quality
    };
    return (new Sticker(img ? img : url, stickerMetadata)).toBuffer();
}

module.exports = { createSticker, videoToWebp };