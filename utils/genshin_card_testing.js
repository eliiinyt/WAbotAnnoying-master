/* eslint-disable multiline-ternary */
/* eslint-disable no-mixed-operators */
/* eslint-disable max-lines */
const path = require('path');
const { EnkaClient } = require('enka-network-api');
const { createCanvas, loadImage, registerFont } = require('canvas');
const fs = require('fs');
registerFont(path.join(__dirname, '..', 'assets', 'genshin', 'zhcn.ttf'), { family: 'zh-cn' });
const cachePath = path.resolve(__dirname, '../cache/genshin');
const { getDominantColor } = require('./colors');


async function refreshAllData() {
  const enka = new EnkaClient({
    cacheDirectory: cachePath,
    showFetchCacheLog: true,
  });


  enka.cachedAssetsManager.activateAutoCacheUpdater({
    instant: true,
    timeout: 60 * 60 * 1000,
    onUpdateStart: async () => {
      console.log('Updating Genshin Data...');
    },
    onUpdateEnd: async () => {
      enka.cachedAssetsManager.refreshAllData();
      console.log('Updating Completed!');
    }
  });
};

async function generateCharacterCard(player_id, index = 0) {
  try {
    const cachePath = path.resolve(__dirname, '../cache/genshin');
    const enka = new EnkaClient({
      cacheDirectory: cachePath,
      showFetchCacheLog: true,
    });

    const canvasWidth = 1872;
    const canvasHeight = 840;

    const player = await enka.fetchUser(player_id);

    const character_details = player;
    const stats = character_details.characters[index].stats;
    const costume = character_details.characters[index].costume;
    const skillTalent = character_details.characters[index].skillLevels;

    const character_card = {
      level: character_details.characters[index].level,
      costumes: {
        splashImage: {
          name: costume.splashImage.name,
          url: costume.splashImage.url,
          imageBaseUrl: costume.splashImage.imageBaseUrl,
          isAvailable: costume.splashImage.isAvailable,
        },
        cardIcon: {
          name: costume.cardIcon,
          url: costume.cardIcon.url,
          imageBaseUrl: costume.cardIcon.imageBaseUrl,
          isAvailable: costume.cardIcon.isAvailable,
        },
      },
      characterData: {
        icon: {
          name: character_details.characters[index].characterData.icon.name,
          url: character_details.characters[index].characterData.icon.url,
          imageBaseUrl: character_details.characters[index].characterData.icon.imageBaseUrl,
        },
        nameCard: {
          name: character_details.characters[index].characterData.nameCard.pictures[1].name,
          url: character_details.characters[index].characterData.nameCard.pictures[1].url,
        },
        id: character_details.characters[index].characterData.id,
        description: character_details.characters[index].characterData.description,
        name: character_details.characters[index].characterData.name.get('es'),
        gender: character_details.characters[index].characterData.gender,
        weaponType: character_details.characters[index].characterData.weaponType,
        _nameId: character_details.characters[index].characterData._nameId,
        isArchon: character_details.characters[index].characterData.isArchon,
        isTraveler: character_details.characters[index].characterData.isTraveler,
        stars: character_details.characters[index].characterData.stars,
        rarity: character_details.characters[index].characterData.rarity,
        constellations: character_details.characters[index].characterData.constellations,
        elementalSkill: character_details.characters[index].characterData.elementalSkill,
        elementalBurst: character_details.characters[index].characterData.elementalBurst,
        skills: character_details.characters[index].characterData.skills,
        normalAttack: character_details.characters[index].characterData.normalAttack,
        PassiveTalents: character_details.characters[index].characterData.passiveTalents,
        element: character_details.characters[index].characterData.element,
        bodyType: character_details.characters[index].characterData.bodyType,
        releasedAt: character_details.characters[index].characterData.releasedAt,
        skillDepotId: character_details.characters[index].characterData.skillDepotId,
      },
      weapon: {
        level: character_details.characters[index].weapon.level,
        refinementRank: character_details.characters[index].weapon.refinementRank,
        weaponData: {
          icon: {
            name: character_details.characters[index].weapon.weaponData.icon.name,
            url: character_details.characters[index].weapon.weaponData.icon.url
          },
          name: character_details.characters[index].weapon.weaponData.name.get('es'),
          stars: character_details.characters[index].weapon.weaponData.stars
        },
        weaponStats: character_details.characters[index].weapon.weaponStats.filter(stat => stat.value !== 0)
      },
      characterStats: {
        attack: stats.attack.value.toFixed(0),
        attackFlat: stats.attackFlat.value.toFixed(0),
        critDamage: (stats.critDamage.value * 100).toFixed(1),
        critRate: (stats.critRate.value * 100).toFixed(1),
        elementMastery: stats.elementMastery.value.toFixed(0),
        maxHealth: stats.maxHealth.value.toFixed(0),
        currentEnergy: (stats.chargeEfficiency.value * 100).toFixed(1),
        highestDamageBonus: stats.highestDamageBonus.reduce((prev, current) => {
          return (prev.value > current.value) ? prev : current;
        }, { value: -Infinity })
      },
      skillTalent: skillTalent.map((talent) => {
        const { level, skill } = talent;
        const { name, icon, description } = skill;
        return {
          name: name.get('es'),
          icon: { url: icon.url, name: icon.name },
          description: description.get('es'),
          level: level.value,
        };
      }),
      artifacts: character_details.characters[index].artifacts.map((artifact) => {
        const { artifactData, location, level, mainstat, substats } = artifact;
        const { name, equipType, icon, stars } = artifactData;
        const name_es = name.get('es');

        return {
          name: name_es,
          location,
          equipType,
          icon: artifactData.icon,
          stars,
          level,
          mainstat: {
            fightPropName: mainstat.fightPropName.get('es'),
            isPercent: mainstat.isPercent,
            value: mainstat.isPercent ? (mainstat.value * 100).toFixed(1) : mainstat.value.toFixed(0),
          },
          substats: {
            total: substats.total.map((total) => ({
              total: {
                fightPropName: total.fightPropName.get('es'),
                fightProp: total.fightProp,
                isPercent: total.isPercent,
                value: total.isPercent ? (total.value * 100).toFixed(1) : total.value.toFixed(0),
                rawValue: total.rawValue,
              },
            })),
            split: substats.split.map((split) => ({
              split: {
                fightPropName: split.fightPropName.get('es'),
                fightProp: split.fightProp,
                isPercent: split.isPercent,
                value: split.isPercent ? (split.value * 100).toFixed(1) : split.value.toFixed(0),
                rawValue: split.rawValue,
              },
            })),
          },
        };
      }),
      unlockedConstellations: character_details.characters[index].unlockedConstellations,
    };


    const canvas = createCanvas(canvasWidth, canvasHeight);
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#f0f0f0';
    const nameCard = await cache({
      resource: character_card.characterData.nameCard.name,
      url: character_card.characterData.nameCard.url,
    });

    const dominantColor = await getDominantColor(path.join(__dirname, '..', 'cache', 'genshin', 'resources', `${character_card.characterData.nameCard.name}.png`));
    const splashImage = await cache({
      resource: character_card.costumes.splashImage.name,
      url: character_card.costumes.splashImage.url,
    });
    ctx.drawImage(nameCard, 0, 0, canvasWidth, canvasHeight);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    const aspectRatio = splashImage.width / splashImage.height;
    let newWidth = canvasWidth * 1.5;
    let newHeight = newWidth / aspectRatio;

    if (newHeight > canvasHeight * 1.2) {
      newHeight = canvasHeight * 1.2;
      newWidth = newHeight * aspectRatio;
    }

    const xPos = (canvasWidth - newWidth) / 0.25;
    const yPos = (canvasHeight - newHeight) / 2;

    ctx.drawImage(splashImage, xPos, yPos, newWidth, newHeight);

    ctx.fillStyle = 'rgb(255, 255, 255)';
    ctx.strokeStyle = 'rgb(107, 107, 107)';
    ctx.font = '24px \'zh-cn\'';
    ctx.fillText(`Niv. ${character_card.level} / 90`, 30, 30);
    ctx.strokeText(`Niv. ${character_card.level} / 90`, 30, 30);
    ctx.fillText(character_card.characterData.name, 30, 60);
    ctx.strokeText(character_card.characterData.name, 30, 60);
    ctx.fillText(`ID: ${player_id}`, 30, canvasHeight - canvasHeight / 97);
    ctx.strokeText(`ID: ${player_id}`, 30, canvasHeight - canvasHeight / 97);

    ctx.lineWidth = 5;
    await drawTalents(ctx, dominantColor, character_card, canvasWidth / 2.2, canvasHeight / 1.7);
    await drawArtifacts(ctx, character_card, canvasWidth / 1.15, canvasHeight / 28, dominantColor);
    await drawConstellation(ctx, dominantColor, character_card);
    await drawStats(
      ctx,
      character_card.characterStats,
      canvasWidth * (45 / 100),
      canvasHeight * (8 / 100),
      canvasWidth,
      canvasHeight, dominantColor
    );
    await drawWeapon(ctx, character_card, canvasWidth / 1.85, canvasHeight / 1.3, dominantColor);
    const buffer = canvas.toBuffer();
    return buffer;

  } catch (e) {
    console.error(e);
    throw new Error;
  }
}

async function draw(ctx, text, x, y, dominantColor) {
  ctx.font = '24px \'zh-cn\'';
  ctx.beginPath();
  ctx.fillStyle = 'rgba(3, 2, 5, 0.6)';
  ctx.strokeStyle = dominantColor; //'rgba(94, 81, 133)';
  // ctx.fillStyle = 'rgba(3, 2, 5, 1)';
  // ctx.strokeStyle = 'rgba(94, 81, 133)';
  ctx.roundRect(
    x - 25, 
    y - 30,
    ctx.measureText(text).width * 1.4,
    40,
    [10, 40]
  );
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = 'white';
  ctx.fillText(text, x, y);
}

async function drawStats(ctx, stats, startX, startY, canvasWidth, canvasHeight, dominantColor) {
  let highestDamageBonusValue;
  const highestDamageBonusName = stats.highestDamageBonus.fightPropName.get('es');

  if (stats.highestDamageBonus.value !== 0) {
    highestDamageBonusValue = `${stats.highestDamageBonus.isPercent ? (stats.highestDamageBonus.value * 100).toFixed(1) : stats.highestDamageBonus.value.toFixed(0)}%`;
  }


  const characterStats = {
    attack: stats.attack,
    critDamage: `${stats.critDamage}%`,
    critRate: `${stats.critRate}%`,
    elementMastery: stats.elementMastery,
    maxHealth: stats.maxHealth,
    currentEnergy: `${stats.currentEnergy}%`,
  };
  if (highestDamageBonusValue) {
    characterStats.highestDamageBonus = highestDamageBonusValue;
  }
  const stats_es = {
    attack: 'ATQ',
    critDamage: 'Daño CRIT',
    critRate: 'Prob. CRIT',
    elementMastery: 'Maestría Elemental',
    maxHealth: 'Vida',
    currentEnergy: 'Recarga de Energía',
    highestDamageBonus: highestDamageBonusName,
  };

  const statEntries = Object.entries(characterStats);
  const statHeight = canvasHeight * 0.06;

  statEntries.forEach(async ([key, value], index) => {
    const yPos = startY + index * statHeight;
    const translatedKey = stats_es[key] || key;
    const text = `${translatedKey}: ${value}`;
    await draw(ctx, text, startX, yPos, dominantColor);
  });
}
async function drawWeapon(ctx, character_card, x, y, dominantColor) {
  const weapon = character_card.weapon;
  const canvasWidth = ctx.canvas.width;
  const canvasHeight = ctx.canvas.height;
  const weaponStats = weapon.weaponStats;
  const rectWidth = canvasWidth * 0.25;
  const rectHeight = canvasHeight * 0.17;
  const rectX = x - rectWidth / 2;
  const rectY = y;

  ctx.beginPath();
  // colores antiguos aaaaa, no sé, son feos
  //ctx.fillStyle = 'rgba(49,43,71,0.7)';
  //ctx.strokeStyle = 'rgba(49,43,71,1)';

  ctx.fillStyle = 'rgba(30, 30, 50, 0.6)';
  ctx.strokeStyle = dominantColor;
  ctx.lineWidth = 5;
  ctx.roundRect(rectX, rectY, rectWidth, rectHeight, [20, 20, 20, 20]);
  ctx.stroke();
  ctx.fill();
  const weapon_icon = await cache({
    resource: weapon.weaponData.icon.name,
    url: weapon.weaponData.icon.url,
  });
  const imgWidth = rectHeight * 0.9;
  const imgHeight = rectHeight * 0.9;
  ctx.drawImage(
    weapon_icon,
    rectX + 10,
    rectY + (rectHeight - imgHeight) / 2 - 5,
    imgWidth,
    imgHeight
  );

  let textY = rectY + imgHeight / 2;
  ctx.fillStyle = 'white';
  ctx.font = `${canvasHeight * 0.024}px 'zh-cn'`;
  ctx.fillText(`${weapon.weaponData.name}`, rectX + imgWidth + 5, textY - 25);
  ctx.font = `${canvasHeight * 0.023}px 'zh-cn'`;
  ctx.fillText(`Nivel: ${weapon.level}`, rectX + imgWidth / 5 + 5, rectY + (rectHeight - imgHeight) / 2 + imgHeight - 5);
  ctx.fillText(`R${weapon.refinementRank}`, rectX + 15, rectY + (rectHeight - imgHeight) * 1.5);


  for (const weaponStat of weaponStats) {

    ctx.fillStyle = 'white';
    ctx.font = `${canvasHeight * 0.024}px 'zh-cn'`;
    ctx.fillText(
      `${weaponStat.fightPropName.get('es')}: ${weaponStat.isPercent ? (weaponStat.value * 100).toFixed(1) : weaponStat.value.toFixed(0)}${weaponStat.isPercent ? '%' : ''
      }`,
      rectX + imgWidth + 5,
      textY + 5
    );
    textY += canvasHeight * 0.03;
  }
}

async function drawTalents(ctx, dominantColor, character_card, x, y, arcRadiusPercentage = 0.025, imageSizePercentage = 0.05) {
  ctx.save();
  const talents = character_card.skillTalent;
  const canvasWidth = ctx.canvas.width;
  const arcRadius = canvasWidth * arcRadiusPercentage;
  const smallArcRadius = arcRadius * 0.5;
  const imageSize = canvasWidth * imageSizePercentage;
  let talentX = x;
  const talentY = y;

  for (const talent of talents) {
    ctx.fillStyle = 'rgba(30, 30, 50, 0.6)';
    ctx.strokeStyle = dominantColor; //'rgba(0, 180, 255, 0.9)';
    ctx.lineWidth = 5;

    // puntos de intersección, no te confundas.jpf MIERDA DE COMENTARIO XDXDXKJXDXLKJDXLDK
    const x1 = talentX;
    const y1 = talentY;
    const r1 = arcRadius;

    const x2 = talentX;
    const y2 = talentY + (arcRadius + smallArcRadius) - (smallArcRadius * 0.5);
    const r2 = smallArcRadius;

    const d = y2 - y1;

    if (d < r1 + r2 && d > Math.abs(r1 - r2)) {
      const a = (r1 * r1 - r2 * r2 + d * d) / (2 * d);
      const h = Math.sqrt(r1 * r1 - a * a);

      const intersectionX1 = x1 + h;
      const intersectionY1 = y1 + a;

      const intersectionX2 = x1 - h;
      const intersectionY2 = y1 + a;

      const startAngleMin = Math.atan2(intersectionY1 - y2, intersectionX1 - x2);
      const endAngleMin = Math.atan2(intersectionY2 - y2, intersectionX2 - x2);

      ctx.beginPath();
      ctx.arc(x2, y2, smallArcRadius, startAngleMin, endAngleMin);
      ctx.stroke();
      ctx.fill();

      const startAngle = Math.atan2(intersectionY2 - y1, intersectionX2 - x1);
      const endAngle = Math.atan2(intersectionY1 - y1, intersectionX1 - x1);


      ctx.beginPath();
      ctx.arc(x1, y1, arcRadius, startAngle, endAngle, false);
      ctx.stroke();
      ctx.fill();

    } else {
      ctx.beginPath();
      ctx.arc(talentX, talentY, arcRadius, 0, 2 * Math.PI);
      ctx.fill();
      ctx.stroke();
    }

    talentX += canvasWidth * 0.07;
  }

  talentX = x;
  for (const talent of talents) {
    const talentIcon = await cache({
      resource: talent.icon.name,
      url: talent.icon.url,
    });
    ctx.drawImage(
      talentIcon,
      talentX - imageSize / 2,
      talentY - imageSize / 2,
      imageSize,
      imageSize
    );

    const smallY = talentY + (arcRadius + smallArcRadius) - (smallArcRadius * 0.5);

    ctx.fillStyle = 'white';
    ctx.font = `${smallArcRadius * 1.2}px 'zh-cn'`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(talent.level.toString(), talentX, smallY);

    talentX += canvasWidth * 0.07;
  }

  ctx.restore();
}

async function drawArtifacts(ctx, character_card, x, y, dominantColor) {
  const artifacts = character_card.artifacts;
  const canvasWidth = ctx.canvas.width;
  const canvasHeight = ctx.canvas.height;

  for (const artifact of artifacts) {
    const rectWidth = canvasWidth * 0.3;
    const rectHeight = canvasHeight * 0.17;
    const rectX = x - rectWidth / 2;
    const rectY = y;

    ctx.beginPath();
    ctx.fillStyle = 'rgba(30, 30, 50, 0.6)';
    ctx.strokeStyle = dominantColor; // 'rgba(0, 180, 255, 0.9)';
    ctx.lineWidth = 5;
    ctx.roundRect(rectX, rectY, rectWidth, rectHeight, [20, 0, 0, 20]);
    ctx.stroke();
    ctx.fill();
    const artifact_icon = await cache({
      resource: artifact.icon.name,
      url: artifact.icon.url,
    });
    const imgWidth = rectHeight * 0.9;
    const imgHeight = rectHeight * 0.9;
    ctx.drawImage(
      artifact_icon,
      rectX + 10,
      rectY + (rectHeight - imgHeight) / 2 - 10,
      imgWidth,
      imgHeight
    );

    ctx.fillStyle = 'white';
    ctx.font = `${canvasHeight * 0.028}px 'zh-cn'`;
    ctx.fillText(
      `${artifact.mainstat.fightPropName}: ${artifact.mainstat.value}${artifact.mainstat.isPercent ? '%' : ''
      }`,
      rectX + imgWidth + 20,
      rectY + canvasHeight * 0.035
    );

    let substatsY = rectY + canvasHeight * 0.065;
    artifact.substats.total.forEach((substat) => {
      ctx.font = `${canvasHeight * 0.02}px 'zh-cn'`;
      ctx.fillText(
        `${substat.total.fightPropName}: ${substat.total.value}${substat.total.isPercent ? '%' : ''
        }`,
        rectX + imgWidth + 20,
        substatsY
      );
      substatsY += canvasHeight * 0.025;
    });

    ctx.font = `${canvasHeight * 0.025}px 'zh-cn'`;
    ctx.fillText(
      `lvl: ${artifact.level - 1}`,
      rectX + imgWidth / 3,
      substatsY + canvasHeight * -0.004
    );

    ctx.fillStyle = 'white';
    ctx.font = `${canvasHeight * 0.02}px 'zh-cn'`;
    y += rectHeight + 20;
  }
};


async function drawConstellation(ctx, dominantColor, character_card, transparent = false) {
  const constellations = character_card.characterData.constellations;
  const unlockedCount = character_card.unlockedConstellations.length;
  const canvasWidth = ctx.canvas.width;
  const canvasHeight = ctx.canvas.height;
  const startX = canvasWidth * 0.05;
  const startY = canvasHeight * 0.15;
  const radius = canvasWidth * 0.027;
  const spacing = canvasHeight * 0.145;

  const lockUrl = path.join(__dirname, '../cache/genshin/resources/lock.png');
  const lockIcon = await cache({
    resource: 'lock',
    url: lockUrl,
  });

  for (let i = 0; i < 6; i++) {
    const isUnlocked = i < unlockedCount;
    const currentY = startY + i * spacing;

    ctx.beginPath();
    ctx.arc(startX, currentY, radius, 0, Math.PI * 2);
    ctx.fillStyle = transparent
      ? 'rgba(30, 30, 50, 0.6)'
      : 'rgba(30, 30, 50, 1)';
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = isUnlocked
      ? dominantColor
      : 'rgba(120, 120, 120, 0.7)';
    ctx.stroke();

    const constIcon = await loadImageFetch(constellations[i].icon.url);
    ctx.save();
    ctx.beginPath();
    ctx.arc(startX, currentY, radius - 5, 0, Math.PI * 2);
    ctx.clip();
    ctx.drawImage(
      constIcon,
      startX - (radius - 3),
      currentY - (radius - 3),
      (radius - 3) * 2,
      (radius - 3) * 2
    );
    ctx.restore();

    if (!isUnlocked) {

      ctx.beginPath();
      ctx.arc(startX, currentY, radius, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fill();

      const lockSize = radius * 0.9;
      ctx.drawImage(
        lockIcon,
        startX - lockSize / 2,
        currentY - lockSize / 2,
        lockSize,
        lockSize
      );
    }
  }
}


async function getBuffer(url) {
  console.log(`Fetching and caching: ${url}`);
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  const buffer = await response.arrayBuffer();
  return Buffer.from(buffer);
}

async function cache({ resource, url }) {
  const cacheDir = path.join(__dirname, '..', 'cache', 'genshin', 'resources');
  const pathres = path.join(cacheDir, `${resource}.png`);

  const exists = fs.existsSync(pathres);
  if (exists) {
    return await loadImageFetch(pathres);
  } else {
    if (!fs.existsSync(cacheDir)) {
      fs.mkdirSync(cacheDir, { recursive: true });
    }

    const res = await getBuffer(url);
    fs.writeFileSync(pathres, res);
    return await loadImageFetch(pathres);
  }
}

async function generateCharacterShowcase(player_id) {
  try {
    const enka = new EnkaClient({
      cacheDirectory: cachePath,
      showFetchCacheLog: true,
    });
    const player = await enka.fetchUser(player_id);
    const charactersPreview = player.charactersPreview;
    const cha = charactersPreview.map((character) => {
      const { costume, level, element, constellation } = character;
      const character_data = {
        level,
        costume: {
          name: costume.name.get('es'),
          id: costume.id,
          description: costume.description.get('es'),
          isDefault: costume.isDefault,
        },
        constellation,
        element: element.id,
        _data: {
          character_id: costume._data.characterId,
          nameTextMapHash: costume._data.nameTextMapHash,
          _nameId: costume._nameId,
          isDefault: costume.isDefault,
        },
        icons: {
          icon: {
            name: costume.icon,
            url: costume.icon.url,
            imageBaseUrl: costume.icon.imageBaseUrl,
            isAvailable: costume.icon.isAvailable,
          },
          sideIcon: {
            name: costume.icon,
            url: costume.icon.url,
            imageBaseUrl: costume.icon.imageBaseUrl,
            isAvailable: costume.icon.isAvailable,
          },
          splashImage: {
            name: costume.icon,
            url: costume.icon.url,
            imageBaseUrl: costume.icon.imageBaseUrl,
            isAvailable: costume.icon.isAvailable,
          },
          cardIcon: {
            name: costume.icon,
            url: costume.icon.url,
            imageBaseUrl: costume.icon.imageBaseUrl,
            isAvailable: costume.icon.isAvailable,
          },
        },
      };
      return character_data;
    });

    const canvasWidth = 800;
    const canvasHeight = 800;
    const canvas = createCanvas(canvasWidth, canvasHeight);
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#f0f0f0';
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);
    ctx.fillStyle = '#333';
    ctx.font = '24px Arial';
    ctx.fillText(`Personajes de: ${player.nickname}`, 50, 40);

    for (let i = 0; i < cha.length; i++) {
      const character = cha[i];
      const { costume, level, icons, _data } = character;
      const image = await loadImageFetch(icons.icon.url);
      const x = 50 + (i % 4) * 180;
      const y = 80 + Math.floor(i / 4) * 220;

      ctx.strokeStyle = '#ffffff';
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.roundRect(x, y, 150, 200, 20);
      ctx.fill();
      ctx.stroke();
      ctx.strokeStyle = '#ccc';

      ctx.beginPath();
      ctx.moveTo(x, y + 30);
      ctx.lineTo(x + 150, y + 30);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(x + 1, y + 181);
      ctx.lineTo(x + 149, y + 181);
      ctx.stroke();

      ctx.beginPath();
      ctx.roundRect(x, y, 150, 200, 20);
      ctx.stroke();
      ctx.fillStyle = '#a0a0ff';
      ctx.drawImage(image, x + 1, y + 31, 148, 149);

      function drawText(ctx, text, x, y) {
        const textMetrics = ctx.measureText(text);
        const textWidth = textMetrics.width;
        const centerX = x + (150 - textWidth) / 2;
        ctx.fillText(text, centerX, y);
      }

      ctx.fillStyle = '#333';
      ctx.font = '16px Arial';
      drawText(ctx, _data._nameId, x, y + 25);

      ctx.fillStyle = '#666';
      ctx.font = '14px Arial';
      drawText(ctx, `Lv. ${level}`, x, y + 195);

    }
    const buffer = canvas.toBuffer();
    return buffer;
  } catch (e) {
    console.error(e);
    throw new Error('Error al generar la tarjeta de perfil del personaje.');
  }
}

async function loadImageFetch(url) {
  // Sí, estoy usandolo, ¿Qué vas a hacer al respecto? llamar a recursos humanos?
  // ¿Llamar al QA? ¿Acaso le dirás que estoy haciendo atrocidades?
  if (url.startsWith('http://') || url.startsWith('https://')) {

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Server responded with ${response.status}`);
    }
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    return await loadImage(buffer);
  } else {
    const buffer = fs.readFileSync(url);
    return await loadImage(buffer);
  };

}
/**
 * Acorta un texto si excede el ancho máximo, añadiendo "..."
 * @param {CanvasRenderingContext2D} ctx - El contexto del canvas (para medir el texto)
 * @param {string} text - El texto a dibujar
 * @param {number} maxWidth - El ancho máximo permitido
 * @returns {string} - El texto acortado o el original
 */
function getTruncatedText(ctx, text, maxWidth) {
  let textWidth = ctx.measureText(text).width;
  const ellipsis = '...';
  const ellipsisWidth = ctx.measureText(ellipsis).width;

  if (textWidth <= maxWidth) {
    return text; // Cabe completo, no se hace nada
  }

  // Si no cabe, acortar el texto
  let truncatedText = text;
  while (textWidth + ellipsisWidth > maxWidth && truncatedText.length > 0) {
    // Quita el último caracter
    truncatedText = truncatedText.substring(0, truncatedText.length - 1);
    textWidth = ctx.measureText(truncatedText).width;
  }

  return truncatedText + ellipsis; // Devuelve el texto acortado con "..."
}

async function generateUserProfileCard(player_id) {
  try {
    // 1. Configurar EnkaClient y Canvas
    const cachePath = path.resolve(__dirname, '../cache/genshin');
    const enka = new EnkaClient({
      cacheDirectory: cachePath,
      showFetchCacheLog: true,
    });

    const canvasWidth = 840;
    const canvasHeight = 480;

    // 2. Obtener los datos del usuario
    const user = await enka.fetchUser(player_id);

    const canvas = createCanvas(canvasWidth, canvasHeight);
    const ctx = canvas.getContext('2d');

    // 3. Cargar los assets (Fondo y Avatar)
    const cardImage = await cache({
      resource: user.profileCard.name,
      url: user.profileCard.pictures[1].url
    });

    const avatarImage = await cache({
      resource: user.profilePicture.icon.name,
      url: user.profilePicture.icon.url
    });

    // 4. Dibujar el fondo (Profile Card)
    ctx.drawImage(cardImage, 0, 0, canvasWidth, canvasHeight);

    // --- Columna Izquierda (Avatar, Texto) ---

    // 5. Dibujar la foto de perfil (Avatar)
    const avatarRadius = 80;
    const avatarX = 120; 
    const avatarY = 140;

    ctx.save();
    ctx.beginPath();
    ctx.arc(avatarX, avatarY, avatarRadius, 0, Math.PI * 2, true);
    ctx.closePath();
    ctx.clip();
    ctx.drawImage(avatarImage, avatarX - avatarRadius, avatarY - avatarRadius, avatarRadius * 2, avatarRadius * 2);
    ctx.restore();

    ctx.beginPath();
    ctx.arc(avatarX, avatarY, avatarRadius, 0, Math.PI * 2, true);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.lineWidth = 6;
    ctx.stroke();

    // 6. Dibujar el Nickname
    const textX = avatarX + avatarRadius + 25; 
    let textY = avatarY - 25; 

    ctx.font = "48px 'zh-cn'";
    ctx.fillStyle = 'white';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.strokeStyle = 'black';
    ctx.lineWidth = 5;

    ctx.strokeText(user.nickname, textX, textY);
    ctx.fillText(user.nickname, textX, textY);

    // 7. Dibujar la Firma (Signature) [MODIFICADO]
    textY += 55; // Mover hacia abajo
    ctx.font = "28px 'zh-cn'"; // <- Establecer la fuente ANTES de medir
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.lineWidth = 4;
    
    // Definir el ancho máximo (ancho total - pos X - margen derecho)
    const maxWidthSignature = canvasWidth - textX - 40; 
    
    // Usar la función de ayuda para obtener el texto acortado
    const signatureText = getTruncatedText(ctx, user.signature, maxWidthSignature);
    
    // Dibujar el texto (ya acortado si es necesario)
    ctx.strokeText(signatureText, textX, textY);
    ctx.fillText(signatureText, textX, textY);

    // 8. Dibujar el UID
    textY += 45; // Mover debajo de la firma
    const uidText = `UID: ${user.uid}`;
    ctx.font = "26px 'zh-cn'";
    ctx.fillStyle = 'white';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.lineWidth = 4;

    ctx.strokeText(uidText, textX, textY);
    ctx.fillText(uidText, textX, textY);


    // --- Esquina Derecha (Estadísticas) ---
    // (El resto del código de estadísticas sigue igual)

    const stats = [
      { label: 'AR', value: user.level || 'N/A' },
      { label: 'Nivel de Mundo', value: user.worldLevel || 'N/A' },
      { label: 'Logros', value: user.achievements || 'N/A' },
      { 
        label: 'Abismo', 
        value: user.spiralAbyss ? `${user.spiralAbyss.floor}-${user.spiralAbyss.chamber}` : 'N/A' 
      },
      { 
        label: 'Teatro', 
        value: user.theater ? `${user.theater.stars} Estrellas` : 'N/A' 
      }
    ];

    const lineHeight = 40; 
    const padding = 25;
    const rectHeight = (stats.length * lineHeight) + (padding * 2) - 10;
    const rectWidth = 360;
    const rectX = canvasWidth - rectWidth - 20; 
    const rectY = canvasHeight - rectHeight - 40; 

    ctx.beginPath();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.lineWidth = 2;
    ctx.roundRect(rectX, rectY, rectWidth, rectHeight, 15);
    ctx.fill();
    ctx.stroke();

    const statsX_Label = rectX + padding;
    const statsX_Value = rectX + rectWidth - padding;
    let statsY = rectY + padding; 

    ctx.strokeStyle = 'black';
    ctx.lineWidth = 4;

    for (const stat of stats) {
      ctx.font = "28px 'zh-cn'";
      ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      ctx.strokeText(stat.label, statsX_Label, statsY);
      ctx.fillText(stat.label, statsX_Label, statsY);

      ctx.font = "28px 'zh-cn'";
      ctx.fillStyle = 'white';
      ctx.textAlign = 'right';
      ctx.strokeText(stat.value.toString(), statsX_Value, statsY);
      ctx.fillText(stat.value.toString(), statsX_Value, statsY);

      statsY += lineHeight;
    }

    // 12. Devolver el buffer
    const buffer = canvas.toBuffer();
    return buffer;

  } catch (e) {
    console.error(e);
    throw new Error('Error al generar la tarjeta de perfil de usuario estética.');
  }
}

module.exports = {
  generateCharacterCard,
  generateCharacterShowcase,
  generateUserProfileCard,
  refreshAllData
};