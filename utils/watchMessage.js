const watchMessage = (client, processMessage) => (filter, options = {}) => {
  return new Promise((resolve, reject) => {
    const { time = 10000, max = 1 } = options;
    const collectedMessages = [];
// luego termino esto, me da paja implementar el resto de la logica
    const messageListener = async (rawMsg) => {
      try {
        const parsedMessage = await processMessage(client, rawMsg);
        if (parsedMessage?.sender === filter) {
          collectedMessages.push(parsedMessage);

          if (collectedMessages.length >= max) {
            cleanup();
            resolve(collectedMessages);
          }
        }
      } catch (err) {
        console.error("Error processing incoming message:", err);
      }
    };

    const cleanup = () => {
      client.off('message', messageListener);
      clearTimeout(timeout);
    };

    const timeout = setTimeout(() => {
      cleanup();
      if (collectedMessages.length === 0) {
        reject(new Error('No messages collected within the time limit.'));
      } else {
        resolve(collectedMessages);
      }
    }, time);

    client.on('message', messageListener);
  });
};

module.exports = { watchMessage };
