class Enemy {
    constructor(name, hp, atk, def, skills = []) {
      this.name = name;
      this.hp = hp;
      this.atk = atk;
      this.def = def;
      this.skills = skills;
    }
  
    attack() {
      // (luego termino esto)
      return this.atk;
    }
  
    defend() {
      // (luego termino essto)
      return this.def;
    }
  }
  
  module.exports = Enemy;
  