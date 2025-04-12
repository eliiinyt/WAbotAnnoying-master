const fs = require('fs');
const path = require('path');

module.exports = {
    name: 'help',
    description: 'Muestra la lista de todos los comandos disponibles con sus descripciones',
    execute: async ({message}) => {
        try {
            const commandsDir = path.join(__dirname);
            const files = fs.readdirSync(commandsDir);
            
            const commands = files
                .filter(file => file.endsWith('.js'))
                .map(file => {
                    try {
                        const command = require(path.join(commandsDir, file));
                        if (!command.name || !command.description) {
                            console.warn(`Comando .${file} no tiene propiedades requeridas`);
                            return null;
                        }
                        return {
                            name: command.name,
                            description: command.description
                        };
                    } catch (error) {
                        console.error(`Error cargando comando ${file}:`, error);
                        return null;
                    }
                })
                .filter(cmd => cmd !== null)
                .sort((a, b) => a.name.localeCompare(b.name));

            let response = '> Lista de comandos disponibles:\n\n';
            commands.forEach(cmd => {
                response += `*.${cmd.name}*\n${cmd.description}\n\n`;
            });

            await message.reply(response);
        } catch (error) {
            console.error('Error en el comando help:', error);
            await message.reply('Error al obtener la lista de comandos. Por favor, intenta de nuevo.');
        }
    }
};