/* eslint-disable max-lines */
const path = require('path');
const { EnkaClient } = require('enka-network-api');
const { createCanvas, loadImage, registerFont } = require('canvas');
const fs = require('fs');
const axios = require('axios');
registerFont(path.join(__dirname, '..', 'assets', 'genshin', 'zhcn.ttf'), { family: 'zh-cn' });
const cachePath = path.resolve(__dirname, '../cache/genshin');
const enka = new EnkaClient({
  cacheDirectory: cachePath,
  showFetchCacheLog: true,
});
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
    await drawTalents(ctx, character_card, canvasWidth / 2.2, canvasHeight / 1.7);
    await drawArtifacts(ctx, character_card, canvasWidth / 1.15, canvasHeight / 28);
    await drawConstellation(ctx, character_card);
    await drawStats(
      ctx,
      character_card.characterStats,
      canvasWidth * (45 / 100),
      canvasHeight * (8 / 100),
      canvasWidth,
      canvasHeight
    );
    await drawWeapon(ctx, character_card, canvasWidth / 1.85, canvasHeight / 1.3);
    const buffer = canvas.toBuffer();
    return buffer;

  } catch (e) {
    console.error(e);
    throw new Error;
  }
}

async function draw(ctx, text, x, y) {
  ctx.font = '24px \'zh-cn\'';
  ctx.beginPath();
  ctx.fillStyle = 'rgb(49, 43, 71)';
  ctx.strokeStyle = 'rgba(94, 81, 133)';
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

async function drawStats(ctx, stats, startX, startY, canvasWidth, canvasHeight) {
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
    await draw(ctx, text, startX, yPos);
  });
}
async function drawWeapon(ctx, character_card, x, y) {
  const weapon = character_card.weapon;
  const canvasWidth = ctx.canvas.width;
  const canvasHeight = ctx.canvas.height;
  const weaponStats = weapon.weaponStats;
  const rectWidth = canvasWidth * 0.25;
  const rectHeight = canvasHeight * 0.17;
  const rectX = x - rectWidth / 2;
  const rectY = y;

  ctx.beginPath();
  ctx.fillStyle = 'rgba(49,43,71,0.7)';
  ctx.strokeStyle = 'rgba(49,43,71,1)';
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

async function drawTalents(ctx, character_card, x, y, arcRadiusPercentage = 0.025, imageSizePercentage = 0.05) {
  const talents = character_card.skillTalent;
  const canvasWidth = ctx.canvas.width;
  const canvasHeight = ctx.canvas.height;

  const arcRadius = canvasWidth * arcRadiusPercentage;
  const smallArcRadius = arcRadius * 0.5;
  const imageSize = canvasWidth * imageSizePercentage;

  let talentX = x;
  const talentY = y;


  for (const talent of talents) {
    ctx.fillStyle = 'rgba(49,43,71,120)';
    ctx.strokeStyle = 'rgba(94,81,133,255)';
    ctx.lineWidth = 5;

    ctx.moveTo(talentX, talentY);
    ctx.arc(talentX, talentY, arcRadius, 0, 2 * Math.PI);
    ctx.moveTo(talentX, talentY + arcRadius + 5);
    ctx.arc(talentX, talentY + arcRadius + 5, smallArcRadius, 0, 2 * Math.PI);
    ctx.stroke();
    ctx.fill();

    talentX += canvasWidth * 0.07;
  }

  talentX = x;


  for (const talent of talents) {

    const talentIcon = await cache({
      resource: talent.icon.name,
      url: talent.icon.url,
    });

    ctx.drawImage(talentIcon, talentX - imageSize / 2, talentY - imageSize / 2, imageSize, imageSize);

    ctx.fillStyle = 'white';
    ctx.font = `${canvasHeight * 0.03}px 'zh-cn'`;
    const text = talent.level.toString();
    const textWidth = ctx.measureText(text).width;
    const textX = talentX - textWidth / 2;
    ctx.fillText(text, textX, talentY + arcRadius + 18);

    talentX += canvasWidth * 0.07;
  }
}

async function drawArtifacts(ctx, character_card, x, y) {
  const artifacts = character_card.artifacts;
  const canvasWidth = ctx.canvas.width;
  const canvasHeight = ctx.canvas.height;

  for (const artifact of artifacts) {
    const rectWidth = canvasWidth * 0.3;
    const rectHeight = canvasHeight * 0.17;
    const rectX = x - rectWidth / 2;
    const rectY = y;

    ctx.beginPath();
    ctx.fillStyle = 'rgba(49,43,71,0.7)';
    ctx.strokeStyle = 'rgba(49,43,71,1)';
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

async function drawConstellation(ctx, character_card) {
  const characterData = character_card.characterData;
  const unlockedConstellations = character_card.unlockedConstellations;
  const canvasWidth = ctx.canvas.width;
  const canvasHeight = ctx.canvas.height;
  const startX = canvasWidth * 0.035;
  const startY = canvasHeight * 0.171;
  const radius = canvasWidth * 0.025;
  const startAngle = 0;
  const spacing = canvasHeight * 0.13;
  const endAngle = Math.PI * 2;
  const endY = canvasHeight * 0.82;

  function drawConstsHolder(
    x,
    y,
    rad,
    startAngle,
    endAngle,
    count,
    direction,
    transparent
  ) {
    transparent = transparent || false;
    direction = direction || 'down';
    ctx.lineWidth = 5;
    if (transparent) {
      ctx.fillStyle = 'rgba(49,43,71,0.7)';
      ctx.strokeStyle = 'rgba(94,81,133,0.7)';
    } else {
      ctx.fillStyle = 'rgba(49,43,71,1)';
      ctx.strokeStyle = 'rgba(94,81,133,1)';
    }
    for (let i = 0; i < count; i++) {
      ctx.beginPath();
      ctx.moveTo(x + rad, y);
      ctx.arc(x, y, rad, startAngle, endAngle);
      ctx.closePath();
      ctx.fill();

      ctx.stroke();
      y += direction === 'down' ? spacing : -spacing;
    }
  }

  const constellations = characterData.constellations;
  drawConstsHolder(
    startX,
    startY,
    radius,
    startAngle,
    endAngle,
    constellations.length,
    'down'
  );

  for (let i = 0; i < constellations.length; i++) {
    const constellation = constellations[i];
    const constellationImageUrl = constellation.icon.url;
    const constellationName = constellation.icon.name;

    const constellationImage = await cache({
      resource: constellationName,
      url: constellationImageUrl,
    });

    ctx.drawImage(
      constellationImage,
      startX - radius,
      startY - radius + (i * spacing),
      radius * 2,
      radius * 2
    );
  }
  if (unlockedConstellations === undefined) {
    drawConstsHolder(
      startX,
      startY,
      radius,
      startAngle,
      endAngle,
      constellations.length,
      'down',
      true
    );
    for (let i = 0; i < constellations.length; i++) {
      const centerY = endY - i * spacing;
      const lockUrl = path.join(__dirname, '../cache/genshin/cache/lock.png');
      const lock = await cache({
        resource: 'lock',
        url: lockUrl,
      });

      ctx.drawImage(
        lock,
        startX - radius * 1.2 / 2,
        centerY - radius * 1.2 / 2,
        radius * 1.2,
        radius * 1.2
      );
    }
  } else {
    const count = 6 - unlockedConstellations.length;
    const startYBottom = startY + ((constellations.length - 1) * spacing);
    drawConstsHolder(
      startX,
      startYBottom,
      radius,
      startAngle,
      endAngle,
      count,
      'up',
      true
    );
    for (let i = 0; i < count; i++) {
      const centerY = endY - (i * spacing);
      const lockUrl = path.join(__dirname, '../cache/genshin/cache/lock.png');
      const lock = await cache({
        resource: 'lock',
        url: lockUrl,
      });

      ctx.drawImage(
        lock,
        startX - radius * (1.2 / 2),
        centerY - radius * (1.2 / 2),
        radius * 1.2,
        radius * 1.2
      );
    }
  }

}

async function getBuffer(url) {
  const res = await axios({
    method: 'get',
    url,
    responseType: 'arraybuffer',
  });

  if (res) return res.data;
}

async function cache({ resource, url }) {
  const pathres = path.join(
    __dirname,
    '..',
    'cache',
    'genshin',
    'resources',
    `${resource}.png`
  );
  const exists = fs.existsSync(pathres);
  if (exists) return await loadImage(pathres);
  else {
    const res = await getBuffer(url);
    fs.writeFileSync(pathres, res);
    return await loadImage(res);
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
      const image = await loadImage(icons.icon.url);
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
    throw new Error;
  }
}

module.exports = {
  generateCharacterCard,
  generateCharacterShowcase
};