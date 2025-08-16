const Combat = require('./combat');
const Enemy = require('./enemy');
const TeamManager = require('./teamManager');
const CharacterData = require('./getCharacterData');
const { createCanvas, loadImage } = require('canvas');
const path = require('path');
const fs = require('fs').promises;

class BattleManager {
  constructor({ dbManager }) {
    this.dbManager = dbManager;
    this.teamManager = new TeamManager({ dbManager });
    this.characterData = new CharacterData({ dbManager });
  }

  async startBattle({ userId, message, watchMessage, enemies }) {
    try {
      const playerTeamIds = await this.teamManager.getTeam(userId);
      if (playerTeamIds.length === 0) {
        await message.reply('Debes tener un equipo de personajes para iniciar una batalla.');
        return;
      }

      const playerDataPromises = playerTeamIds.map(async (characterId) => {
        const characterAttributes = await this.characterData.getUserCharacterAttributes(userId, characterId);
        return {
          id: characterId,
          name: characterAttributes.name,
          character: characterAttributes
        };
      });

      const playerTeam = await Promise.all(playerDataPromises);
      const combat = new Combat(playerTeam, enemies, this.characterData, userId);
      let battleStatus = null;
      let isFirstTurn = true;
      const options = { time: 15000, max: 4 };

      while (!battleStatus) {
        try {
          const currentPlayer = combat.playerTeam[combat.currentPlayerIndex];
          const currentEnemy = combat.enemyTeam[combat.currentEnemyIndex];
          let combinedMessage = '';
          combinedMessage += `${currentPlayer.character.name}, ¿qué quieres hacer? (atacar, defender, magia, estado)\n\n `;
          if (isFirstTurn) {
            const buffer = await this.generateBattleImage(combat, message);
            await message.reply({ image: buffer, caption: combinedMessage });
            isFirstTurn = false;
          }
          const collected = await watchMessage(message.sender, options);
          if (collected.length === 0) {
            await message.reply('No respondiste a tiempo. La batalla ha terminado.');
            break;
          }
          const action = collected[0].body;
          const playerAction = combat.playerTurn(currentPlayer, currentEnemy, action);
          combinedMessage += this.buildActionMessage('player', currentPlayer.character.name, playerAction);
          battleStatus = combat.checkBattleStatus();
          if (battleStatus) break;

          combat.nextPlayer();

          if (currentEnemy.hp > 0) {
            const enemyAction = combat.enemyTurn(currentPlayer.character, currentEnemy);
            combinedMessage += this.buildActionMessage('enemy', currentEnemy.name, enemyAction);
          } else {
            combinedMessage += `${currentEnemy.name} está derrotado y no puede atacar.\n`;
          }
          battleStatus = combat.checkBattleStatus();
          if (battleStatus) break;

          combat.nextEnemy();

          const updatedBuffer = await this.generateBattleImage(combat, message);
          await message.reply({ image: updatedBuffer, caption: combinedMessage });

        } catch (error) {
          console.error('Error durante la batalla:', error);
          await message.reply('Ocurrió un error durante la batalla. Inténtalo de nuevo más tarde.');
          break;
        }
      }

      if (battleStatus) {
        const buffer = await this.generateBattleImage(combat, message);
        if (battleStatus === 'players_dead') {
          await message.reply({ image: buffer, caption: `Todos los jugadores han sido derrotados, has perdido: ${battleStatus}` });
        }
        if (battleStatus === 'enemies_dead') {
          try {
            const updatedCharacters = await this.characterData.giveXPToCharacters({ userId, characterIds: playerTeamIds, xpToAdd: 100 });
            await message.reply({ image: buffer, caption: `Todos los enemigos han sido derrotados, has ganado: ${battleStatus}, ${updatedCharacters}` });
          } catch (error) {
            console.error('Error al añadir experiencia:', error.message);
          }
        }
      } else {
        await message.reply('La batalla terminó en empate.');
      }
    } catch (error) {
      console.error('Error al iniciar la batalla:', error);
      await message.reply('Ocurrió un error al iniciar la batalla. Inténtalo de nuevo más tarde.');
    }
  }

  buildActionMessage(actor, name, action) {
    let actionMessage = '';
    if (actor === 'player') {
      if (action.result) {
        actionMessage = `${name} realizó una acción y ${action.result.hit ? 'acertó' : 'falló'}, causando ${action.result.damage} de daño.\n`;
      }
    } else if (actor === 'enemy') {
      if (action.result) {
        actionMessage = `${name} atacó y ${action.result.hit ? 'acertó' : 'falló'}, causando ${action.result.damage} de daño.\n`;
      }
    }
    return actionMessage;
  }

  async generateBattleImage(combat, message) {
    const canvas = createCanvas(800, 400);
    const ctx = canvas.getContext('2d');

    const backgroundImage = await loadImage(path.join(__dirname, '../assets/battle/background.jpg'));
    ctx.drawImage(backgroundImage, 0, 0, canvas.width, canvas.height);

    for (let i = 0; i < combat.playerTeam.length; i++) {
      const player = combat.playerTeam[i];
      let playerImage;
      try {
        playerImage = await loadImage(path.join(__dirname, `${player.character.chibi}`));
      } catch (error) {
        console.warn(`Falló en cargar ${player.character.chibi}. Usando imagen por defecto.`);
        playerImage = await loadImage(path.join(__dirname, '../', 'assets', 'gachapon', 'images', 'defaultImg.png'));
      }
      ctx.fillStyle = 'white';
      ctx.font = 'bold 10px sans-serif';
      ctx.textAlign = 'center';
      ctx.drawImage(playerImage, 50 + i * 100, 200, 80, 80);
      ctx.fillText(`${player.character.name}`, 85 + i * 100, 290);
      ctx.fillText(`HP: ${player.hp}`, 85 + i * 100, 305);
    }

    for (let i = 0; i < combat.enemyTeam.length; i++) {
      const enemy = combat.enemyTeam[i];
      let enemyImage;
      try {
        enemyImage = await loadImage(path.join(__dirname, `../assets/battle/enemies/${enemy.name}.png`));
      } catch (error) {
        console.warn(`Falló en cargar ${enemy.name}. Usando imagen por defecto.`);
        enemyImage = await loadImage(path.join(__dirname, '../', 'assets', 'gachapon', 'images', 'defaultImg.png'));
      }
      ctx.drawImage(enemyImage, 500 + i * 100, 200, 80, 80);
      ctx.fillText(`${enemy.name}`, 550 + i * 100, 290);
      ctx.fillText(`HP: ${enemy.hp}`, 550 + i * 100, 305);
    }

    const buffer = canvas.toBuffer();
    return buffer;
  }
}

module.exports = BattleManager;
