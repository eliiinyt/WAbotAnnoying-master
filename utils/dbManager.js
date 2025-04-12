const { MongoClient } = require('mongodb');

const USER_DATA_SCHEMA = {
  user_id: '',
  user_name: '',
  messages_count: 0,
  commands_count: 0,
  xp: 0,
  level: 1,
  coins: 0,
  characters: [],
  dailyRewardDate: null,
  character_data: {},
  pullData: { pullsSinceLast4Star: 0, pullsSinceLast5Star: 0 },
};

const BATTLE_DATA_SCHEMA = {
  battleId: '',
  userId: '',
  status: '',
  date: new Date()
};

class DBManager {
  constructor(uri, dbName) {
    this.client = new MongoClient(uri, { 
      useNewUrlParser: true, 
      useUnifiedTopology: true 
    });
    this.dbName = dbName;
    this.db = null;
  }

  async connect() {
    await this.client.connect();
    this.db = this.client.db(this.dbName);
    console.log('Connected to database');
  }

  async close() {
    await this.client.close();
  }

  async _ensureUserExists(userId) {
    const users = this.db.collection('users');
    const user = await users.findOne({ user_id: userId });
    if (!user) {
      await users.insertOne({ ...USER_DATA_SCHEMA, user_id: userId });
      console.log(`Nuevo usuario creado con ID ${userId}`);
    }
  }

  async _getUserCollection() {
    if (!this.db) {
      throw new Error('Database not connected');
    }
    return this.db.collection('users');
  }

  async saveMessage({ msg }) {
    if (!this.db) {
      console.error('Database connection not established');
      return;
    }

    const chatId = msg.chat.includes('@s.whatsapp.net') 
      ? msg.sender.match(/^(\d+)@s\.whatsapp\.net$/)?.[1]
      : msg.chat.includes('@g.us')
        ? msg.chat.match(/^([\d-]+)@g\.us$/)?.[1]
        : null;

    if (!chatId) return;

    const content = `${msg.sender.match(/^(\d+)@s\.whatsapp\.net$/)?.[1]}: ${msg.body}`;
    await this.db.collection('messages').updateOne(
      { _id: chatId },
      { $push: { messages: content } },
      { upsert: true }
    );
  }

  async updateUserStats({ userId, type }) {
    try {
      await this._ensureUserExists(userId);
      const users = await this._getUserCollection();

      const updateField = type === 'message' 
        ? { messages_count: 1 }
        : type === 'command'
          ? { commands_count: 1 }
          : null;

      if (updateField) {
        await users.updateOne(
          { user_id: userId },
          { $inc: updateField }
        );
      }
    } catch (error) {
      console.error('Error al actualizar estadísticas del usuario:', error);
      throw error;
    }
  }

  async updateGlobalStats({ type }) {
    try {
      const updateField = {
        message: { total_messages: 1 },
        command: { total_commands: 1 },
        error: { total_errors: 1 }
      }[type];

      if (updateField) {
        await this.db.collection('stats').updateOne(
          {},
          { $inc: updateField },
          { upsert: true }
        );
      }
    } catch (error) {
      console.error('Error al actualizar estadísticas globales:', error);
      throw error;
    }
  }

  async updateUserXp({ userId, xpToAdd }) {
    try {
      await this._ensureUserExists(userId);
      const users = await this._getUserCollection();

      const user = await users.findOne({ user_id: userId });
      const newXp = user.xp + xpToAdd;
      const newLevel = Math.floor(0.1 * Math.sqrt(newXp));

      if (newLevel > user.level) {
        console.log(`Felicidades, ${userId} ha subido al nivel ${newLevel}`);
      }

      await users.updateOne(
        { user_id: userId },
        { $set: { xp: newXp, level: newLevel } }
      );
      return { ...user, xp: newXp, level: newLevel };
    } catch (error) {
      console.error('Error al actualizar XP del usuario:', error);
      throw error;
    }
  }

  async updateUserCoins({ userId, coinsToAdd }) {
    try {
      await this._ensureUserExists(userId);
      const users = this._getUserCollection();

      const user = await users.findOne({ user_id: userId });
      const newCoins = user.coins + coinsToAdd;

      await users.updateOne(
        { user_id: userId },
        { $set: { coins: newCoins } }
      );

      console.log(`Monedas actualizadas para usuario ${userId}. Nuevas monedas: ${newCoins}`);
      return { ...user, coins: newCoins };
    } catch (error) {
      console.error('Error al actualizar monedas del usuario:', error);
      throw error;
    }
  }

  async updateUserData({ userId, set = {}, inc = {}, push = {}, updateGlobal = false, globalInc = {} }) {
    try {
      await this._ensureUserExists(userId);
      const users = await this._getUserCollection();
  
      const updatePayload = {};
      if (Object.keys(set).length > 0) updatePayload.$set = set;
      if (Object.keys(inc).length > 0) updatePayload.$inc = inc;
      if (Object.keys(push).length > 0) updatePayload.$push = push;
  
      if (Object.keys(updatePayload).length > 0) {
        await users.updateOne({ user_id: userId }, updatePayload);
      }
      if (updateGlobal && Object.keys(globalInc).length > 0) {
        await this.db.collection('stats').updateOne(
          {},
          { $inc: globalInc },
          { upsert: true }
        );
      }
    } catch (error) {
      console.error('Error al actualizar datos del usuario:', error);
      throw error;
    }
  }
  




  async updateUserDailyRewardDate({ userId, date }) {
    try {
      await this._ensureUserExists(userId);
      await this._getUserCollection().updateOne(
        { user_id: userId },
        { $set: { dailyRewardDate: date } }
      );
      console.log(`Fecha de recompensa diaria actualizada para usuario ${userId}. Nueva fecha: ${date}`);
    } catch (error) {
      console.error('Error al actualizar fecha de recompensa diaria:', error);
      throw error;
    }
  }

  async updateUserName({ userId, username }) {
    try {
      await this._ensureUserExists(userId);
      const users = await this._getUserCollection();
      await users.updateOne(
        { user_id: userId },
        { $set: { user_name: username } }
      );
      console.log(`Nombre de usuario actualizado para usuario ${userId}. Nuevo nombre: ${username}`);
    } catch (error) {
      console.error('Error al actualizar nombre de usuario:', error);
      throw error;
    }
  }

  async getUserData(userId) {
    try {
      await this._ensureUserExists(userId);
      const users = await this._getUserCollection();
      return await users.findOne({ user_id: userId });
    } catch (error) {
      console.error('Error al obtener datos del usuario:', error);
      throw error;
    }
  }

  async getUserPullData({ userId }) {
    try {
      await this._ensureUserExists(userId);
      const users = await this._getUserCollection();
      const user = await users.findOne({ user_id: userId });
      return user?.pullData || { pullsSinceLast4Star: 0, pullsSinceLast5Star: 0 };
    } catch (error) {
      console.error('Error al obtener datos de pull del usuario:', error);
      throw error;
    }
  }

  async updateUserPullData({ userId, pullData }) {
    try {
      await this._ensureUserExists(userId);
      const users = await this._getUserCollection();
      await users.updateOne(
        { user_id: userId },
        { $set: { pullData } }
      );
    } catch (error) {
      console.error('Error al actualizar datos de pull del usuario:', error);
      throw error;
    }
  }

  async getCollection(collectionName) {
    return this.db.collection(collectionName);
  }
}

module.exports = DBManager;
