/**
 * modulos para el bot
 * @module commands/commandName
 */

module.exports = {
    /**
     * El accionador del comando (nombre)
     * @type {string}
     */
    name: '',
    /**
     * Descripción del comano, tanto de funcionalidad o qué hace, además de información útil sobre el comando
     * @type {string}
     */
    description: '',
    /**
     * @async
     * @param {object} message - el objecto del mensaje que acciona el comando
     * @returns {Promise<void>}
     */
    execute: async (message) => {
        // la lógica del comando, ejemplo: message.reply('String')
    }
  };
  