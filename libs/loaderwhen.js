const fs = require('fs');
const path = require('path');

function loader() {
    const comandos = {};
    const commandsDir = path.join(__dirname, '../commands');
    const files = fs.readdirSync(commandsDir).filter(file => file.endsWith('.js'));

    for (const file of files) {
        const commandName = file.replace('.js', '');
        const commandPath = path.join(commandsDir, file);
        const command = require(commandPath);
        comandos[commandName] = command;
    }

    return comandos;
}

module.exports = { loader };