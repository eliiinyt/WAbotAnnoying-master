const { MongoClient } = require('mongodb');

class DBManager {
  constructor(uri, dbName) {
    this.client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
    this.dbName = dbName;
    this.db = null;

    this.battle_data = {
      battleId: '',
      userId: '',
      status: '',
      date: new Date()
    };

    this.user_data = {
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
      pullData: {},
    };
  }

  async connect() {
    await this.client.connect();
    this.db = this.client.db(this.dbName);
    console.log('Connected to database');
  }

  async close() {
    await this.client.close();
  }


  async createUser(userId) {
    try {
      const initialUserData = { ...this.user_data, user_id: userId };
      await this.db.collection('users').insertOne(initialUserData);
      console.log(`Nuevo usuario creado con ID ${userId}`);
      return initialUserData;
    } catch (error) {
      console.error('Error al crear nuevo usuario:', error);
      throw error;
    }
  }

  async _ensureUserExists(userId) {
    let user = await this.db.collection('users').findOne({ user_id: userId });
    if (!user) {
      await this.createUser(userId);
    }
  }

  async saveMessage({ msg }) {
    if (!this.db) {
      console.error('Database connection not established');
      return;
    }

    let chatId = msg.chat;
    if (chatId === 'status@broadcast') return;

    if (chatId.includes('@s.whatsapp.net')) {
      chatId = msg.sender.match(/^(\d+)@s\.whatsapp\.net$/)[1];
    } else if (chatId.includes('@g.us')) {
      console.log(chatId)
      chatId = msg?.chat?.match(/^([\d-]+)@g\.us$/)[1];
    } else { return }

    const content = `${msg.sender.match(/^(\d+)@s\.whatsapp\.net$/)[1]}: ${msg.body}`;

    const update = {
      $push: {
        [`${chatId}.messages`]: content,
      },
    };

    await this.db.collection('messages').updateOne({ _id: chatId }, update, { upsert: true });
  }
  async updateUserStats({ userId, type }) {
    try {
      await this._ensureUserExists(userId);

      let updateField;
      if (type === 'message') {
        updateField = { messages_count: 1 };
      } else if (type === 'command') {
        updateField = { commands_count: 1 };
      }

      if (updateField) {
        await this.db.collection('users').updateOne({ user_id: userId }, { $inc: updateField });
      }
    } catch (error) {
      console.error('Error al actualizar estadísticas del usuario:', error);
      throw error;
    }
  }

  async updateGlobalStats({ type }) {
    try {
      const updateField = type === 'message' ? { total_messages: 1 } :
        type === 'command' ? { total_commands: 1 } :
          type === 'error' ? { total_errors: 1 } : null;

      if (updateField) {
        await this.db.collection('stats').updateOne({}, { $inc: updateField }, { upsert: true });
      }
    } catch (error) {
      console.error('Error al actualizar estadísticas globales:', error);
      throw error;
    }
  }

  async updateUserXp({ userId, xpToAdd }) {
    try {
      await this._ensureUserExists(userId);

      const user = await this.db.collection('users').findOne({ user_id: userId });
      user.xp += xpToAdd;
      const newLevel = Math.floor(0.1 * Math.sqrt(user.xp));

      if (newLevel > user.level) {
        user.level = newLevel;
        console.log(`Felicidades, ${userId} ha subido al nivel ${newLevel}`);
      }

      await this.db.collection('users').updateOne({ user_id: userId }, { $set: { xp: user.xp, level: user.level } });
      return user;
    } catch (error) {
      console.error('Error al actualizar XP del usuario:', error);
      throw error;
    }
  }

  async updateUserCoins({ userId, coinsToAdd }) {
    try {
      await this._ensureUserExists(userId);

      const user = await this.db.collection('users').findOne({ user_id: userId });
      user.coins += coinsToAdd;
      await this.db.collection('users').updateOne({ user_id: userId }, { $set: { coins: user.coins } });

      console.log(`Monedas actualizadas para usuario ${userId}. Nuevas monedas: ${user.coins}`);
      return user;
    } catch (error) {
      console.error('Error al actualizar monedas del usuario:', error);
      throw error;
    }
  }

  async updateUserDailyRewardDate({ userId, date }) {
    try {
      await this._ensureUserExists(userId);

      await this.db.collection('users').updateOne({ user_id: userId }, { $set: { dailyRewardDate: date } });
      console.log(`Fecha de recompensa diaria actualizada para usuario ${userId}. Nueva fecha: ${date}`);
    } catch (error) {
      console.error('Error al actualizar fecha de recompensa diaria:', error);
      throw error;
    }
  }

  async updateUserName({ userId, username }) {
    try {
      await this._ensureUserExists(userId);

      await this.db.collection('users').updateOne({ user_id: userId }, { $set: { user_name: username } });
      console.log(`nombre de usuario actualizado para usuario ${userId}. Nuevo nombre: ${username}`);
    } catch (error) {
      console.error('Error al actualizar nombre de usuario: ', error);
      throw error;
    }
  }

  async getUserData(userId) {
    try {
      await this._ensureUserExists(userId);

      const user = await this.db.collection('users').findOne({ user_id: userId });
      return user;
    } catch (error) {
      console.error('Error al obtener datos del usuario:', error);
      throw error;
    }
  }

  async getUserPullData({ userId }) {
    try {
      await this._ensureUserExists(userId);

      const user = await this.db.collection('users').findOne({ user_id: userId });
      return user.pullData || { pullsSinceLast4Star: 0, pullsSinceLast5Star: 0 };
    } catch (error) {
      console.error('Error al obtener datos de pull del usuario:', error);
      throw error;
    }
  }

  async updateUserPullData({ userId, pullData }) {
    try {
      await this._ensureUserExists(userId);

      await this.db.collection('users').updateOne(
        { user_id: userId },
        { $set: { pullData } }
      );
    } catch (error) {
      console.error('Error al actualizar datos de pull del usuario:', error);
      throw error;
    }
  }

  async getUsersCollection() {
    return this.db.collection('users');
  }

  async getCharactersCollection() {
    return this.db.collection('characters');
  }

  async getBattlesCollection() {
    return this.db.collection('battles');
  }

  async getCollection({ param }) {
    return this.db.collection(param);
  }
}

module.exports = DBManager;
