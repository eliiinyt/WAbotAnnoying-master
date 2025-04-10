module.exports = {
    name: 'testw',
    description: 'pong',
    execute: async ({message}) => {
      let mess = await message.reply(`class Combat {
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
    this.effects = {}; // Efectos de estado
    this.currentPlayerIndex = 0;
    this.currentEnemyIndex = 0;
  }

  applyEffects(character) {
    let modifiedStats = { ...character };
    if (this.effects[character.id]) {
      for (let effect of this.effects[character.id]) {
        switch (effect.type) {
          case 'blind':
            modifiedStats.accuracy = (modifiedStats.accuracy || 100) - effect.value;
            break;
          case 'defense_boost':
            modifiedStats.def += effect.value;
            break;
          // Agregar más efectos de estado según sea necesario
        }
      }
    }
    return modifiedStats;
  }

  calculateDamage(attacker, defender, actionType) {
    const defenderStats = defender
    attacker.character.atk
    let baseDamage = 0;
    console.log(attacker)
    switch (actionType) {
      case 'attack':
        baseDamage = attacker.character.atk
        break;
      case 'magic':
        // Implementar lógica para daño mágico si es necesario
        baseDamage = attackerStats.magic_atk - defenderStats.def;
        break;
      // Agregar más casos para otros tipos de ataques
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
        // Implementar lógica para defensa si es necesario
        result = { damage: 0, hit: true };
        break;
      case 'magic':
        // Implementar lógica para magia si es necesario
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

    if (currentEnemy.hp > 0) {
    const randomAction = Math.random();


    let result;
    if (randomAction < 0.7) { // 70% de probabilidad de atacar
      console.log(enemy)
      result = { damage:enemy.atk }
      player.hp -= result.damage;
      if (player.hp < 0) currentPlayer.hp = 0;
    } else {
      // otras acciones
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
      enemyTeam: this.enemyTeam.map(e => ({ name: e.name, hp: e.hp, atk: e.atk,def: e.def })),
    };
  }

  checkBattleStatus() {
    const allPlayersDead = this.playerTeam.every(p => p.hp <= 0);
    const allEnemiesDead = this.enemyTeam.every(e => e.hp <= 0);

    if (allPlayersDead) return 'El enemigo gana!';
    if (allEnemiesDead) return 'El jugador gana!';
    return null;
  }
}

module.exports = Combat;
`);

    },
  };
  