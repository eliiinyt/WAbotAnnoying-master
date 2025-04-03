const fs = require('fs');
const path = require('path');

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
