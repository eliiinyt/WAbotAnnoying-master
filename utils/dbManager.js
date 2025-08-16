/* eslint-disable multiline-ternary */
/* eslint-disable max-len */
const { MongoClient } = require('mongodb');
const bcrypt = require('bcrypt');
const USER_DATA_SCHEMA = {
  user_id: '',
  user_lid: '',
  user_name: '',
  password: '',
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
    const user = await users.findOne({ $or: [{ user_id: userId }, { user_lid: userId }] });
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
      ? msg.sender.match(/^(\d+)(?::\d+)?@s\.whatsapp\.net$/)?.[1] || msg.sender.match(/^(\d+)@lid$/)?.[1] || null
      : msg.chat.includes('@g.us')
        ? msg.chat.match(/^([\d-]+)@g\.us$/)?.[1]
        : null;

    if (!chatId) return;
    const userId = msg.sender.match(/^(\d+)(?::\d+)?@s\.whatsapp\.net$/)?.[1];
    const userLid = msg.sender.match(/^(\d+)@lid$/)?.[1];
    let userName = '';
    if (userId) {
      const userData = await this.getUserData(userId);
      userName = userData?.user_name ? `@${userData.user_name}` : '';
    } else if (userLid) {
      const userData = await this.getUserData(userLid);
      userName = userData?.user_name ? `@${userData.user_name}` : '';
    }
    else {
      userName = msg?.name ? `@${msg.name}` : '';
    }

    const content = (() => {
      const senderId = userId || userLid || 'unknown';
      switch (msg.type) {
        case 'protocolMessage':
          return `${senderId}${userName}: ${msg.type} - ${msg?.message?.protocolMessage?.editedMessage?.conversation ?? msg?.message?.message?.protocolMessage?.editedMessage?.conversation ?? null}`;
        case 'editedMessage':
          return `${senderId}${userName}: ${msg.type} - ${msg?.message?.message?.protocolMessage?.editedMessage?.conversation ?? msg?.editedMessage?.conversation ?? null}`;
        default:
          return `${senderId}${userName}: ${msg.type} - ${msg.body}`;
      }
    })();

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
          { $or: [{ user_id: userId }, { user_lid: userId }] },
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

      const user = await users.findOne({ $or: [{ user_id: userId }, { user_lid: userId }] });
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
      const users = await this._getUserCollection();


      const user = await users.findOne({ user_id: userId });
      const newCoins = user.coins + coinsToAdd;

      await users.updateOne(
        { $or: [{ user_id: userId }, { user_lid: userId }] },
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
      const users = await this._getUserCollection();
      await users.updateOne(
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
        { $or: [{ user_id: userId }, { user_lid: userId }] },
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
      return await users.findOne({ $or: [{ user_id: userId }, { user_lid: userId }] });
    } catch (error) {
      console.error('Error al obtener datos del usuario:', error);
      throw error;
    }
  }

  async getUserPullData({ userId }) {
    try {
      await this._ensureUserExists(userId);
      const users = await this._getUserCollection();
      const user = await users.findOne({ $or: [{ user_id: userId }, { user_lid: userId }] });
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
        { $or: [{ user_id: userId }, { user_lid: userId }] },
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

  async updateUserLid({ userId, lid }) {
    try {
      const users = await this._getUserCollection();
      await users.updateOne(
        { user_id: userId },
        { $set: { user_lid: lid } }
      );
      console.log(`LID actualizado para usuario ${userId}. Nuevo LID: ${lid}`);
    } catch (error) {
      console.error('Error al actualizar LID del usuario:', error);
      throw error;
    }

  }

  async authenticateUser({ username, password }) {
    try {
      const users = await this._getUserCollection();

      const user = await users.findOne({ user_name: username });
      if (!user) {
        throw new Error('Nombre de usuario o contraseña incorrectos.');
      }

      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        throw new Error('Nombre de usuario o contraseña incorrectos.');
      }

      return user;
    } catch (error) {
      console.error('Error al autenticar usuario:', error);
      throw error;
    }
  }


  async registerUser({ userId, username, password }) {
    try {
      const users = await this._getUserCollection();

      // KMS pls, esto está tan mal que me duele todo
      const existingUser = await users.findOne({
        $or: [
          { user_id: userId },
          { user_lid: userId }
        ]
      });

      if (existingUser) {

        if (existingUser.user_name || existingUser.password) {
          throw new Error('El usuario ya está registrado con un nombre de usuario y contraseña.');
        }

        const usernameInUse = await users.findOne({ user_name: username });
        if (usernameInUse) {
          throw new Error('El nombre de usuario ya está en uso.');
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        await users.updateOne(
          { _id: existingUser._id },
          { $set: { user_name: username, password: hashedPassword } }
        );

        console.log(`Usuario actualizado con ID ${userId} y nombre ${username}`);
      } else {

        const hashedPassword = await bcrypt.hash(password, 10);
        await users.insertOne({
          user_id: userId,
          user_lid: '',
          user_name: username,
          password: hashedPassword,
          ...USER_DATA_SCHEMA
        });
        console.log(`Usuario registrado con ID ${userId} y nombre ${username}`);
      }
    } catch (error) {
      console.error('Error al registrar usuario:', error);
      throw error;
    }
  }

  async updateExistingUsers() {
    try {
      const usersCollection = await this._getUserCollection();
      const users = await usersCollection.find({}).toArray();

      for (const user of users) {
        const updatePayload = { $set: {} };

        // Verifica las propiedades y si no tiene las agrega, pray porque funcione y no dañe nada, pero aquí venimos a gamblear
        if (user.user_lid === undefined) {
          updatePayload.$set.user_lid = '';
        }
        if (user.user_name === undefined) {
          updatePayload.$set.user_name = '';
        }
        if (user.password === undefined) {
          updatePayload.$set.password = '';
        }

        if (Object.keys(updatePayload.$set).length > 0) {
          await usersCollection.updateOne(
            { _id: user._id },
            updatePayload
          );
          console.log(`Usuario ${user.user_id} actualizado con propiedades faltantes.`);
        }
      }

      console.log('Todos los usuarios han sido verificados y actualizados.');
    } catch (error) {
      console.error('Error al actualizar usuarios existentes:', error);
      throw error;
    }
  }
}

module.exports = DBManager;
