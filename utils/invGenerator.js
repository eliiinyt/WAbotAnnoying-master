const { createCanvas, loadImage } = require("canvas");
const fs = require("fs");
const path = require("path");

const canvasWidth = 1200;
const canvasHeight = 1200;
const paddingPercentage = 0.02;
let imageSize = 220;

const colors = {
  grayTransparent: 'rgba(128, 128, 128, 0.5)',
  whiteTransparent: 'rgba(255, 255, 255, 0.3)',
  blackTransparent: 'rgba(0, 0, 0, 0.5)',
  white: 'white',
  yellow: '#FFD700',
  background: '#222222',
  cardBackground: '#333333',
  textWhite: '#FFFFFF',
};

const icons = {
  critRate: 'critRate.png',
  critDmg: 'critDmg.png',
  hp: 'hp.png',
  atk: 'atk.png',
  def: 'def.png',
};

const charactersDataPath = path.join(__dirname, '../', 'assets', 'gachapon', 'characters.json');
const resourcesPath = path.join(__dirname, '../', 'assets', 'gachapon', 'resources');

async function generateInventoryImage(characters) {
  const canvas = createCanvas(canvasWidth, canvasHeight);
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = colors.background;
  ctx.fillRect(0, 0, canvasWidth, canvasHeight);

  const chat = await loadImage(path.join(__dirname, '../', 'assets', 'gachapon', 'chat.png'));
  ctx.drawImage(chat, 0, 0, canvasWidth, canvasHeight);

  let characterIndex = 0;


  for (let row = 0; row < 4; row++) {
    for (let col = 0; col < 5; col++) {
      const x = col * (imageSize + canvasWidth * paddingPercentage);
      const y = row * (imageSize + canvasHeight * paddingPercentage);

      drawRectangle(ctx, x, y);
      if (characterIndex < characters.length) {
        await drawInventoryCharacter(ctx, characters[characterIndex], x, y);
        characterIndex++;
        //const character = characters[characterIndex];
      }
      drawRectangle(ctx, x, y, false);

    }
  }

  return canvas.toBuffer();
}

async function drawInventoryCharacter(ctx, character, x, y) {
  try {
    let image;
    try {
      image = await loadImage(path.join(__dirname, character.url_1_1));
    } catch (error) {
      console.warn(`Falló en cargar ${character.url_1_1}. Usando imagen por defecto.`);
      image = await loadImage(path.join(__dirname, '../', 'assets', 'gachapon', 'images', 'defaultImg.png'));
    }

    ctx.drawImage(image, x, y, imageSize, imageSize);

    ctx.fillStyle = colors.blackTransparent;
    ctx.fillRect(x, y + imageSize - 40, imageSize, 40);

    const characterName = character.name || character.name_kana;
    ctx.fillStyle = colors.white;
    ctx.font = 'bold 20px sans-serif, segoe-ui-emoji';
    ctx.textAlign = 'center';
    ctx.fillText(characterName, x + imageSize / 2, y + imageSize - 10);

    // ctx.fillStyle = colors.yellow;
    // ctx.font = '16px Arial';
    // ctx.fillText(character.description, x + imageSize / 2, y + imageSize + 20);

    console.log(`Dibujando ${characterName} para el inventario`);
  } catch (err) {
    console.error(err);
  }
}

async function generateCharacterProfile({ characterId, characterDetails }) {
  try {
    const canvas = createCanvas(canvasWidth, 800);
    const ctx = canvas.getContext('2d');

    // Fondo general
    ctx.fillStyle = colors.background;
    ctx.fillRect(0, 0, canvasWidth, 800);

    // Tarjeta de información del personaje
    ctx.fillStyle = colors.cardBackground;
    ctx.fillRect(50, 50, 700, 700);

    // Información del personaje
    ctx.fillStyle = colors.textWhite;
    ctx.font = 'bold 36px sans-serif, segoe-ui-emoji';
    const characterName = characterDetails.name;
    ctx.fillText(characterName, 100, 90);
    characterDetails.name_kana ? ctx.fillText(characterDetails.name_kana, 100, 130) : console.log("no existe kana_name")
    // Dibujar la imagen del personaje
    const x = 50;
    const y = 150;
    await drawProfileCharacter(ctx, characterDetails.name, characterDetails.url_1_1, x, y);

    // Descripción
    ctx.fillStyle = colors.yellow;
    ctx.font = '16px sans-serif, segoe-ui-emoji';
    console.log(characterDetails)
    ctx.fillText(characterDetails.description, 100, 600);

    // Representar estadísticas con iconos y símbolos
    await drawCharacterStat(ctx, 'Prob. Crítica', characterDetails.crit_rate.toFixed(2), icons.critRate, 800, 160);
    await drawCharacterStat(ctx, 'Daño Crítico', characterDetails.crit_dmg.toFixed(2), icons.critDmg, 800, 220);
    await drawCharacterStat(ctx, 'Vida', characterDetails.hp.toFixed(1), icons.hp, 800, 280);
    await drawCharacterStat(ctx, 'Ataque', characterDetails.atk.toFixed(1), icons.atk, 800, 340);
    await drawCharacterStat(ctx, 'Defensa', characterDetails.def.toFixed(1), icons.def, 800, 400);

    // Estrellas basadas en rareza
    const stars = '▲'.repeat(characterDetails.rarity);
    ctx.fillStyle = colors.yellow;
    ctx.fillText(stars, 800, 460);

    // Barra de experiencia
    drawExperienceBar(ctx, characterDetails.xp, 800, 500);

    return canvas.toBuffer();
  } catch (error) {
    console.error('Error al generar el perfil del personaje:', error);
    throw error;
  }
}

async function drawProfileCharacter(ctx, characterName, characterUrl, x, y) {
  try {
    let image;
    try {
      image = await loadImage(path.join(__dirname, characterUrl));
    } catch (error) {
      console.warn(`Falló en cargar ${characterUrl}. Usando imagen por defecto.`);
      image = await loadImage(path.join(__dirname, '../', 'assets', 'gachapon', 'images', 'defaultImg.png'));
    }

    ctx.drawImage(image, x, y, 400, 400);

    console.log(`Dibujando ${characterName} para el perfil`);
  } catch (err) {
    console.error(err);
  }
}

async function drawCharacterStat(ctx, statName, statValue, iconName, x, y) {
  try {
    const icon = await loadImage(path.join(resourcesPath, iconName));
    ctx.drawImage(icon, x, y, 40, 40);
    ctx.fillStyle = colors.textWhite;
    ctx.font = '20px sans-serif, segoe-ui-emoji';
    ctx.fillText(`${statName}: ${statValue}`, x + 50, y + 30);
  } catch (err) {
    console.error(`Error al dibujar el icono de ${statName}:`, err);
  }
}

function calculateLevelFromXP({ xp }) {
  const level = Math.floor(0.1 * Math.sqrt(xp));
  const xpForCurrentLevel = Math.pow(level / 0.1, 2);
  const xpForNextLevel = Math.pow((level + 1) / 0.1, 2);
  return { level, xpForCurrentLevel, xpForNextLevel };
}

function drawExperienceBar(ctx, xp, x, y) {
  const { xpForCurrentLevel, xpForNextLevel } = calculateLevelFromXP({ xp });

  const xpRange = xpForNextLevel - xpForCurrentLevel;
  const xpProgress = xp - xpForCurrentLevel;
  const percentage = (xpProgress / xpRange) * 100;

  // Fondo de la barra de experiencia
  ctx.fillStyle = colors.whiteTransparent;
  ctx.fillRect(x, y, 300, 20);

  // Barra de experiencia llena
  ctx.fillStyle = colors.yellow;
  ctx.fillRect(x, y, 300 * (percentage / 100), 20);

  // Texto del XP actual
  ctx.fillStyle = colors.white;
  ctx.fillText(`${xp} XP`, x + 130, y + 18);
  ctx.fillText(`${xpForNextLevel} XP`, x + 310, y + 18)
}


async function getCharacterData(characterIds) {
  const characterData = JSON.parse(fs.readFileSync(charactersDataPath, 'utf8'));
  return characterIds.map(id => characterData[id]);
}



function drawRectangle(ctx, x, y, fill = true) {
  ctx.fillStyle = fill ? colors.grayTransparent : colors.blackTransparent;
  ctx.strokeStyle = colors.whiteTransparent;
  ctx.lineWidth = 10;
  ctx.beginPath();
  ctx.rect(x, y, imageSize, imageSize);
  if (fill) {
    ctx.fill();
  } else {
    ctx.stroke();
  }
}
module.exports = {
  generateInventoryImage,
  getCharacterData,
  generateCharacterProfile,
};
