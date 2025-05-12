const fs = require('fs');
const path = require('path');
const { isNSFW } = require('../commands/nsfw');

class CommandLoader {
  constructor(commandsDir) {
    this.commands = new Map();
    this.loadCommands(commandsDir);
  }

  loadCommands(commandsDir, specificCommandName) {
    const commandFiles = fs.readdirSync(commandsDir).filter(file => file.endsWith('.js'));
    for (const file of commandFiles) {
      const commandName = path.basename(file, '.js');
      if (!specificCommandName || specificCommandName === commandName) {
        const resolvedPath = path.join(`${commandsDir}`, file);
        const command = require(resolvedPath);

        const commandData = {
          name: command.name,
          isOwner: command.isOwner || false,
          description: command.description || 'No hay descripción',
          isNSFW: command.isNSFW || false,
          execute: command.execute || (() => { throw new Error('No se ha definido la función execute') }),
        };
        this.commands.set(command.name, command);
        this.clearModuleCache(resolvedPath);
      }
    }
  }

  clearModuleCache(modulePath) {
    const resolvedPath = require.resolve(modulePath);
    if (require.cache[resolvedPath]) {
      delete require.cache[resolvedPath];
    }
  }

  getCommand(commandName) {
    return this.commands.get(commandName);
  }
}

module.exports = CommandLoader;
