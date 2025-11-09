/* eslint-disable prefer-const */
/* eslint-disable no-mixed-operators */
// Funciones de conversión de color
// Funciones de conversión de color (sin cambios)

/**
 * Convierte un color RGB a HSL.
 * @param {number} r - Valor de rojo (0-255).
 * @param {number} g - Valor de verde (0-255).
 * @param {number} b - Valor de azul (0-255).
 * @returns {Array<number>} Un array con los valores H, S, L (0-1).
 */
function rgbToHsl(r, g, b) {
    r /= 255;
    g /= 255;
    b /= 255;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h, s, l = (max + min) / 2;

    if (max === min) {
        h = s = 0;
    } else {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
            case r: h = (g - b) / d + (g < b ? 6 : 0); break;
            case g: h = (b - r) / d + 2; break;
            case b: h = (r - g) / d + 4; break;
        }
        h /= 6;
    }
    return [h, s, l];
}

/**
 * Convierte un color HSL a RGB.
 * @param {number} h - Hue (0-1).
 * @param {number} s - Saturación (0-1).
 * @param {number} l - Luminosidad (0-1).
 * @returns {Array<number>} Un array con los valores R, G, B (0-255).
 */
function hslToRgb(h, s, l) {
    let r, g, b;
    if (s === 0) {
        r = g = b = l;
    } else {
        const hue2rgb = (p, q, t) => {
            if (t < 0) t += 1;
            if (t > 1) t -= 1;
            if (t < 1 / 6) return p + (q - p) * 6 * t;
            if (t < 1 / 2) return q;
            if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
            return p;
        };
        const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
        const p = 2 * l - q;
        r = hue2rgb(p, q, h + 1 / 3);
        g = hue2rgb(p, q, h);
        b = hue2rgb(p, q, h - 1 / 3);
    }
    return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
}

const { createCanvas, loadImage } = require('canvas');

/**
 * Normaliza un color RGB.
 * @param {number} r - Valor de rojo (0-255).
 * @param {number} g - Valor de verde (0-255).
 * @param {number} b - Valor de azul (0-255).
 * @returns {string} El color normalizado en formato hexadecimal.
 */
function normalizeColor(r, g, b) {
    const groupFactor = 10;
    const normR = Math.floor(r / groupFactor) * groupFactor;
    const normG = Math.floor(g / groupFactor) * groupFactor;
    const normB = Math.floor(b / groupFactor) * groupFactor;
    return `#${normR.toString(16).padStart(2, '0')}${normG.toString(16).padStart(2, '0')}${normB.toString(16).padStart(2, '0')}`;
}

/**
 * Ajusta la saturación y la luminosidad de un color RGB.
 * @param {number} r - Valor de rojo (0-255).
 * @param {number} g - Valor de verde (0-255).
 * @param {number} b - Valor de azul (0-255).
 * @param {number} sOffset - Cuánto aumentar la saturación (0-1).
 * @param {number} lOffset - Cuánto aumentar la luminosidad (0-1).
 * @returns {string} El color ajustado en formato hexadecimal.
 */
function adjustColor(r, g, b, sOffset = 0.2, lOffset = 0.2) {
    let [h, s, l] = rgbToHsl(r, g, b);

    s = Math.min(1, s + sOffset);
    l = Math.min(1, l + lOffset);

    const [newR, newG, newB] = hslToRgb(h, s, l);

    return `#${newR.toString(16).padStart(2, '0')}${newG.toString(16).padStart(2, '0')}${newB.toString(16).padStart(2, '0')}`;
}

/**
 * Obtiene el color dominante de una imagen y lo ajusta.
 * @param {string} imagePath - La ruta al archivo de la imagen.
 * @param {object} [options] - Opciones de ajuste.
 * @param {number} [options.saturation=0.2] - Cuánto aumentar la saturación.
 * @param {number} [options.lightness=0.2] - Cuánto aumentar la luminosidad.
 * @returns {Promise<string>} Un `Promise` que resuelve con el color ajustado.
 */
async function getDominantColor(imagePath, options = {}) {
    try {
        const { saturation = 0.2, lightness = 0.2 } = options;

        const image = await loadImage(imagePath);
        const canvas = createCanvas(image.width, image.height);
        const ctx = canvas.getContext('2d');
        ctx.drawImage(image, 0, 0, image.width, image.height);

        const imageData = ctx.getImageData(0, 0, image.width, image.height);
        const data = imageData.data;
        const colorCounts = {};

        const step = 5;
        for (let i = 0; i < data.length; i += 4 * step) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            const a = data[i + 3];
            if (a < 200) continue;

            const color = normalizeColor(r, g, b);
            colorCounts[color] = (colorCounts[color] || 0) + 1;
        }

        let maxCount = 0;
        let dominantColorHex = '#000000';

        for (const color in colorCounts) {
            if (colorCounts[color] > maxCount) {
                maxCount = colorCounts[color];
                dominantColorHex = color;
            }
        }

        const r = parseInt(dominantColorHex.substring(1, 3), 16);
        const g = parseInt(dominantColorHex.substring(3, 5), 16);
        const b = parseInt(dominantColorHex.substring(5, 7), 16);

        return adjustColor(r, g, b, saturation, lightness);

    } catch (error) {
        console.error('Error al procesar la imagen:', error);
        throw error;
    }
}

module.exports = { getDominantColor };