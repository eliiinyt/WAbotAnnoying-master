const personajes = require('../assets/gachapon/characters.json');

class CharacterData {
  constructor({dbManager}) {
    this.dbManager = dbManager;
  }

  async initializeUserData({userId}) {
    const user = await this.dbManager.db.collection('users').findOne({ user_id: userId });

    if (!user) {
      await this.dbManager.db.collection('users').insertOne({
        user_id: userId,
        character_data: {}
      });
    }
  }
  
  calculateLevelFromXP({xp}) {
    return Math.floor(0.1 * Math.sqrt(xp));
  }

  async getUserCharacterAttributes(userId, characterId) {
    const user = await this.dbManager.db.collection('users').findOne({ user_id: userId });

    if (!user) {
      throw new Error('Usuario no encontrado.');
    }

    const baseCharacter = personajes[characterId];
    let userCharacterData = user.character_data?.[characterId];

    if (!baseCharacter) {
      throw new Error('Personaje no encontrado.');
    }

    if (!userCharacterData) {
      userCharacterData = {
        level: 1,
        xp: 0,
        custom_atk: baseCharacter.atk,
        custom_hp: baseCharacter.hp,
        custom_def: baseCharacter.def,
        custom_crit_dmg: baseCharacter.crit_dmg,
        custom_crit_rate: baseCharacter.crit_rate
      };

      await this.dbManager.db.collection('users').updateOne(
        { user_id: userId },
        { $set: { [`character_data.${characterId}`]: userCharacterData } }
      );
    }

    const levelMultiplier = 1 + ((userCharacterData.level || 1) - 1) * 0.1;

    return {
      name: baseCharacter.name,
      name_kana: baseCharacter.name_kana,
      chibi: baseCharacter.chibi,
      level: userCharacterData.level || 1,
      xp: userCharacterData.xp || 0,
      url: baseCharacter.url,
      url_1_1: baseCharacter.url_1_1,
      crit_rate: baseCharacter.crit_rate,
      crit_dmg: baseCharacter.crit_dmg,
      hp: (baseCharacter.hp * levelMultiplier) + (userCharacterData.custom_hp || 0),
      atk: (baseCharacter.atk * levelMultiplier) + (userCharacterData.custom_atk || 0),
      def: (baseCharacter.def * levelMultiplier) + (userCharacterData.custom_def || 0),
      rarity: baseCharacter.rarity,
      iq: baseCharacter.iq,
      description: baseCharacter.description
    };
  }

  async giveXPToCharacters({ userId, characterIds, xpToAdd }) {
    const user = await this.dbManager.db.collection('users').findOne({ user_id: userId });
  
    if (!user) {
      throw new Error('Usuario no encontrado.');
    }
  
    if (!user.character_data) {
      throw new Error('No se encontraron datos de personajes para el usuario.');
    }
  
    const updatedCharacters = [];
  
    for (const characterId of characterIds) {
      if (!user.character_data[characterId]) {
        throw new Error(`Datos del personaje ${characterId} no encontrados para el usuario.`);
      }
  
      user.character_data[characterId].xp += xpToAdd;
  
      await this.dbManager.db.collection('users').updateOne(
        { user_id: userId },
        { $set: { [`character_data.${characterId}.xp`]: user.character_data[characterId].xp } }
      );
  
      updatedCharacters.push({
        characterId,
        name: personajes[characterId].name,
        level: user.character_data[characterId].level,
        xp: user.character_data[characterId].xp
      });
    }
  
    return updatedCharacters;
  }
  
  async levelUp({userId, characterId, newLevel}) {
    const user = await this.dbManager.db.collection('users').findOne({ user_id: userId });

    if (!user) {
      throw new Error('Usuario no encontrado.');
    }

    if (!user.character_data) {
      user.character_data = {};
    }

    let userCharacterData = user.character_data[characterId];

    if (!userCharacterData) {
      throw new Error('Datos del personaje no encontrados.');
    }

    const isNewLevel = this.calculateLevelFromXP({xp: userCharacterData.xp});
    userCharacterData.level = newLevel;
    if (newLevel == isNewLevel) {
      throw new Error(`El valor introducido es es el nivel actual, ${userCharacterData.level}, si desea subir de nivel use el comando con ${userCharacterData.level + 1}\ntienes ${userCharacterData.xp} de xp`);
    
    }
    if (newLevel > isNewLevel) {
      const requiredXP = Math.ceil(Math.pow((userCharacterData.level + 1) / 0.1, 2));
      throw new Error(`No tienes suficiente XP para subir de nivel. Necesitas ${requiredXP - userCharacterData.xp} XP más para subir al nivel ${userCharacterData.level + 1}. Tu experiencia actual es ${userCharacterData.xp}`);
    }
    

    const baseCharacter = personajes[characterId];
    const levelMultiplier = 1 + (isNewLevel - 1) * 0.05;

    const updatedCharacterData = {
      level: isNewLevel,
      xp: userCharacterData.xp,
      custom_hp: (baseCharacter.hp * levelMultiplier) - baseCharacter.hp,
      custom_atk: (baseCharacter.atk * levelMultiplier) - baseCharacter.atk,
      custom_def: (baseCharacter.def * levelMultiplier) - baseCharacter.def,
      custom_crit_dmg: (baseCharacter.crit_dmg * levelMultiplier) - baseCharacter.crit_dmg,
      custom_crit_rate: (baseCharacter.crit_rate * levelMultiplier) - baseCharacter.crit_rate
    };

    user.character_data[characterId] = {
      ...user.character_data[characterId],
      ...updatedCharacterData
    };

    await this.dbManager.db.collection('users').updateOne(
      { user_id: userId },
      { $set: { [`character_data.${characterId}`]: user.character_data[characterId] } }
    );

    return {
      name: baseCharacter.name,
      level: isNewLevel,
      xp: userCharacterData.xp,
      url: baseCharacter.url,
      url_1_1: baseCharacter.url_1_1,
      crit_rate: baseCharacter.crit_rate,
      crit_dmg: baseCharacter.crit_dmg,
      hp: (baseCharacter.hp * levelMultiplier),
      atk: (baseCharacter.atk * levelMultiplier),
      def: (baseCharacter.def * levelMultiplier),
      rarity: baseCharacter.rarity,
      iq: baseCharacter.iq
    };
  }
}

module.exports = CharacterData;
