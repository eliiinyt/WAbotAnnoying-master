const fs = require('fs');
const path = require('path');

class Gachapon {
  constructor(dbManager) {
    this.dbManager = dbManager;
    this.pullCost = 160;
    this.characters = this.loadCharacters();
  }

  loadCharacters() {
    const charactersPath = path.join(__dirname, '../assets/gachapon/characters.json');
    const charactersData = fs.readFileSync(charactersPath, 'utf-8');
    return JSON.parse(charactersData);
  }

  async pull(userId, pulls) {
    const user = await this.dbManager.getUserData(userId);
    if (!user) {
      throw new Error('Usuario no encontrado.');
    }

    const pullData = await this.dbManager.getUserPullData({ userId: user.user_id || user.user_lid });

    if (user.coins === undefined) {
      await this.dbManager.db.collection('users').updateOne(
        { $or: [{ user_id: user.user_id }, { user_lid: user.user_lid }] },
        { $set: { coins: 1600 } }
      );
      user.coins = 1600;
    }

    if (user.coins < this.pullCost * pulls) {
      throw new Error('Sin suficientes coins');
    }

    if (!user.character_data) {
      user.character_data = {};
    }

    const pullResults = [];
    for (let i = 0; i < pulls; i++) {
      const characterId = this.pullCharacter(pullData);
      if (characterId && this.characters[characterId].rarity >= 3) {
        pullResults.push(characterId);
        if (this.characters[characterId].rarity === 4) pullData.pullsSinceLast4Star = 0;
        if (this.characters[characterId].rarity === 5) pullData.pullsSinceLast5Star = 0;

        if (!user.character_data[characterId]) {
          const baseCharacter = this.characters[characterId];
          user.character_data[characterId] = {
            level: 1,
            xp: 0,
            custom_atk: baseCharacter.atk,
            custom_hp: baseCharacter.hp,
            custom_def: baseCharacter.def,
            custom_crit_dmg: baseCharacter.crit_dmg,
            custom_crit_rate: baseCharacter.crit_rate
          };
        }
      } else {
        pullResults.push(null);
      }
      pullData.pullsSinceLast4Star++;
      pullData.pullsSinceLast5Star++;
    }

    await this.dbManager.updateUserPullData({ userId: user.user_id || user.user_lid, pullData });

    if (pullResults.some(charId => charId !== null)) {
      const characterDataUpdates = pullResults
        .filter(charId => charId !== null)
        .reduce((updates, charId) => {
          updates[`character_data.${charId}`] = user.character_data[charId];
          return updates;
        }, {});

      await this.dbManager.db.collection('users').updateOne(
        { $or: [{ user_id: user.user_id }, { user_lid: user.user_lid }] },
        {
          $inc: { coins: -this.pullCost * pulls },
          $push: { characters: { $each: pullResults.filter(charId => charId !== null) } },
          $set: characterDataUpdates
        }
      );
    } else {
      await this.dbManager.db.collection('users').updateOne(
        { $or: [{ user_id: user.user_id }, { user_lid: user.user_lid }] },
        { $inc: { coins: -this.pullCost * pulls } }
      );
    }

    return pullResults;
  }

  pullCharacter(pullData) {
    const is4StarGuaranteed = pullData.pullsSinceLast4Star >= 9;
    const is5StarGuaranteed = pullData.pullsSinceLast5Star >= 89;
    let rarity;
    if (is5StarGuaranteed) {
      rarity = 5;
    } else if (is4StarGuaranteed) {
      rarity = 4;
    } else {
      const random = Math.random();
      if (random < 0.01) {
        rarity = 5;
      } else if (random < 0.10) {
        rarity = 4;
      } else {
        rarity = 3;
      }
    }
    if (rarity === 3) {
      return null;
    }
    const availableCharacterIds = Object.keys(this.characters).filter(charId => this.characters[charId].rarity === rarity);
    if (availableCharacterIds.length === 0) {
      throw new Error(`No se encontraron personajes con la rareza: ${rarity}`);
    }
    const selectedCharacterId = availableCharacterIds[Math.floor(Math.random() * availableCharacterIds.length)];
    return selectedCharacterId;
  }

  async inventory(userId) {
    const user = await this.dbManager.getUserData(userId);
    return user.characters || [];
  }
}

module.exports = Gachapon;
