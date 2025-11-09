class Combat {
  constructor(playerTeam, enemyTeam, characterData, userId) {
    this.characterData = characterData;
    this.userId = userId;
    this.playerTeam = playerTeam.map(player => ({
      id: player.id,
      name: player.name,
      character: player.character,
      hp: player.character.hp,
    }));
    this.enemyTeam = enemyTeam.map(enemy => ({
      name: enemy.name,
      hp: enemy.hp,
      atk: enemy.atk,
      def: enemy.def
    }));
    this.effects = {}; // Efectos de estado. Algún día implemento esto btw
    this.currentPlayerIndex = 0;
    this.currentEnemyIndex = 0;
  }

  applyEffects(character) {
    const modifiedStats = { ...character };
    if (this.effects[character.id]) {
      for (const effect of this.effects[character.id]) {
        switch (effect.type) {
          case 'blind':
            modifiedStats.accuracy = (modifiedStats.accuracy || 100) - effect.value;
            break;
          case 'defense_boost':
            modifiedStats.def += effect.value;
            break;
        }
      }
    }
    return modifiedStats;
  }

  calculateDamage(attacker, defender, actionType) {
    const defenderStats = defender;
    const attackerStats = attacker.character;
    let baseDamage = 0;
    console.log(attacker);
    switch (actionType) {
      case 'attack':
        baseDamage = attackerStats.atk;
        break;
      case 'magic':
        baseDamage = attackerStats.magic_atk - defenderStats.def;
        break;
    }

    const damage = Math.max(baseDamage, 1); // El daño mínimo es 1

    return { damage, hit: true };
  }

  playerTurn(player, enemy, action) {
    const currentPlayer = this.playerTeam[this.currentPlayerIndex];
    const currentEnemy = this.enemyTeam[this.currentEnemyIndex];

    let result;
    switch (action) {
      case 'attack':
        result = this.calculateDamage(currentPlayer, currentEnemy, 'attack');
        currentEnemy.hp -= result.damage;
        if (currentEnemy.hp < 0) currentEnemy.hp = 0;
        break;
      case 'defend':
        result = { damage: 0, hit: true };
        break;
      case 'magic':
        result = this.calculateDamage(player, enemy, 'magic');
        currentEnemy.hp -= result.damage;
        if (currentEnemy.hp < 0) currentEnemy.hp = 0;
        break;
      case 'status':
        return { status: this.getBattleStatus() };
      default:
        result = { damage: 0, hit: false };
    }
    return { result, enemyHp: currentEnemy.hp };
  }

  enemyTurn(player, enemy) {
    //const currentEnemy = this.enemyTeam[this.currentEnemyIndex];
    //const currentPlayer = this.playerTeam[this.currentPlayerIndex];

    if (enemy.hp > 0) {
      const randomAction = Math.random();


      let result;
      if (randomAction < 0.7) { // 70% de probabilidad de atacar
        console.log(enemy);
        result = { damage: enemy.atk };
        player.hp -= result.damage;
        if (player.hp < 0) player.hp = 0;
      } else {
        result = { damage: 0, hit: true }; // el enemigo no hace nada
      }

      return { result, playerHp: player.hp };
    } else {
      return { result: { damage: 0, hit: false }, playerHp: player.hp };
    }
  }

  nextPlayer() {
    this.currentPlayerIndex = (this.currentPlayerIndex + 1) % this.playerTeam.length;
  }

  nextEnemy() {
    this.currentEnemyIndex = (this.currentEnemyIndex + 1) % this.enemyTeam.length;
  }

  getBattleStatus() {
    return {
      playerTeam: this.playerTeam.map(p => ({ id: p.id, name: p.character.name, hp: p.hp })),
      enemyTeam: this.enemyTeam.map(e => ({ name: e.name, hp: e.hp, atk: e.atk, def: e.def })),
    };
  }

  checkBattleStatus() {
    const allPlayersDead = this.playerTeam.every(p => p.hp <= 0);
    const allEnemiesDead = this.enemyTeam.every(e => e.hp <= 0);

    if (allPlayersDead) return 'players_death';
    if (allEnemiesDead) return 'enemies_dead';
    return null;
  }
}

module.exports = Combat;
