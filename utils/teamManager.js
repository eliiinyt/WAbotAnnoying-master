class TeamManager {
    constructor({dbManager}) {
      this.dbManager = dbManager;
    }
  
    async setTeam({userId, team}) {
      
      /*  if (team.length !== 4) {
        throw new Error('El equipo debe tener exactamente 4 personajes.');
      }
        */
  
      const user = await this.dbManager.getUserData(userId);
      const validCharacters = team.every(id => user.characters.includes(id));
  
      if (!validCharacters) {
        throw new Error('Uno o más personajes no están en tu inventario.');
      }
  
      await this.dbManager.db.collection('users').updateOne(
        { user_id: userId },
        { $set: { team } }
      );
    }
  
    async getTeam(userId) {
      console.log(userId)
      const user = await this.dbManager.getUserData(userId);
      return user.team || [];
    }
  }
  
  module.exports = TeamManager;
  