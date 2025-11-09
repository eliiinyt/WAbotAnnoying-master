/*
const config = require('../config');
const DBManager = require('../utils/dbManager');
async function migrateUserData(db) {
    const users = await db.collection('users').find().toArray();
  
    for (const user of users) {
      const characterData = user.characters ? user.characters.reduce((acc, characterId) => {
        if (!acc[characterId]) {
          acc[characterId] = {
            level: 1,
            custom_atk: 0,
            custom_hp: 0,
            custom_def: 0
          };
        }
        return acc;
      }, {}) : {};
  
      await db.collection('users').updateOne(
        { user_id: user.user_id },
        { $set: { character_data: characterData } }
      );
    }
  
    console.log('Migración de datos completada.');
  }
  
  const dbManager = new DBManager(config.dbUri, config.dbName);
  dbManager.connect().then(async () => {
    await migrateUserData(dbManager.db);
    dbManager.close();
  });

  */
  