const { downloadMediaMessage } = require("baileys");
const config = require("../config");
const {writeFile} = require('fs/promises');
const path = require('path');
const { fromBuffer } = require('file-type');
const MediaType = [
  "imageMessage",
  "videoMessage",
  "audioMessage",
  "stickerMessage",
  "documentMessage",
];

/**
 *
 * @param {object} message - el objeto del mensaje
 * @param {Aarray<String>} types - los tipos de mensajes que se van a buscar
 * @returns {object} un objeto que contiene el tipo de mensaje y su contenido
 *
 */
const getMessageContent = (message, types) => {
  for (const type of types) {
    if (message[type]) return { type, content: message[type] };
  }
  return { type: null, content: null };
};

/**
 *
 * @param {object} message - el objeto del mensaje
 * @returns {string} el body del mensaje
 *
 */
const getBody = (message) => {
  return (
    message.conversation ||
    message.extendedTextMessage?.text ||
    message.imageMessage?.caption ||
    message.videoMessage?.caption ||
    message.documentMessage?.caption ||
    message.buttonsResponseMessage?.selectedButtonId ||
    message.listResponseMessage?.singleSelectReply.selectedRowId ||
    message.templateButtonReplyMessage?.selectedId ||
    message.reactionMessage?.text ||
    ""
  );
};

/**
 *
 * @param {object} client - la conexión del socket de baileys
 * @param {object} msg - el objeto del mensaje de baileys
 * @returns {object|null} el mensaje prcesado
 *
 */
const processMessage = async (client, msg) => {
  if (!msg) return null;

  const { type, content } = getMessageContent(msg.message, [
    "viewOnceMessage",
    "ephemeralMessage",
    "documentWithCaptionMessage",
    "viewOnceMessageV2",
    "editedMessage",
    "viewOnceMessageV2Extension",
    ...MediaType,
  ]);

  const m = {
    message: content || msg.message,
    key: msg.key,
    chat: msg.key.remoteJid,
    sender: msg.key.fromMe
      ? client.user.id
      : msg.key.participant || msg.key.remoteJid,
    type: Object.keys(msg.message).find(
      (t) => !["senderKeyDistributionMessage", "messageContextInfo"].includes(t)
    ),
    mentions: msg.message[Object.keys(msg.message).find(
      (t) => !["senderKeyDistributionMessage", "messageContextInfo"].includes(t)
    )]?.contextInfo?.mentionedJid || [],
    mimetype: msg.message?.mimetype || content?.mimetype || null,
    me: msg.key.fromMe,
    name: msg.pushName || "undefined",
    body: getBody(msg.message),
    args: (getBody(msg.message) || "").trim().split(/\s+/),
    quoted: null,
  };

  m.prefix = m.args[0]?.startsWith(config.prefix) ? config.prefix : null;
  m.command = m.prefix
    ? m.args.shift().slice(m.prefix[0].length).toLowerCase()
    : null;

  const quotedMessage = msg.message?.[m.type]?.contextInfo?.quotedMessage;
  if (quotedMessage) {
    const quotedContextInfo = msg.message[m.type].contextInfo;
    m.quoted = {
      message: quotedMessage,
      key: {
        participant: quotedContextInfo.participant,
        remoteJid: quotedContextInfo.remoteJid || m.sender,
        fromMe: quotedContextInfo.participant === client.user.id,
        id: quotedContextInfo.stanzaId,
      },
      id: quotedContextInfo.stanzaId,
      isBot:
        quotedContextInfo.stanzaId.startsWith("BAE5") ||
        quotedContextInfo.stanzaId.startsWith("3EB0"),
      isGroup: (quotedContextInfo.remoteJid || m.sender).endsWith("@g.us"),
      chat: m.key.remoteJid,
      type: Object.keys(quotedMessage).find(
        (t) =>
          !["senderKeyDistributionMessage", "messageContextInfo"].includes(t)
      ),
      sender: quotedContextInfo.participant,
      mimetype:
        quotedMessage?.[
          Object.keys(quotedMessage).find(
            (t) =>
              !["senderKeyDistributionMessage", "messageContextInfo"].includes(
                t
              )
          )
        ]?.mimetype || null,
      body: getBody(quotedMessage),
      args: getBody(quotedMessage || "").trim().split(/\s+/),
      mentions: quotedMessage?.[type]?.contextInfo?.mentionedJid || [],
      viewOnce: !!(
        quotedMessage.viewOnceMessage ||
        quotedMessage.viewOnceMessageV2 ||
        quotedMessage.viewOnceMessageV2Extension
      ),
      reply: (content, options = {}, options_ = {}, quoted = true) => {
        return client.sendMessage(
          m.chat,
          typeof content === "string" ? { text: content, ...options } : content,
          {
            ...(quoted ? { quoted: m.quoted } : {}),
            ...options_,
          }
        );
      },
      download: async () => {
        const buffer = await downloadBuffer(m.quoted)
        return buffer
      },
    };
  }


  
  m.sendPresence = (state, options = {}) => {
    return client.sendPresenceUpdate(state, m.chat);
  };

  m.acceptInvite = (content, options = {}) => {
    const qContent = content?.quoted?.args[0] ? content.quoted : content
    const IdMatch = qContent.args[0].match(/https:\/\/chat\.whatsapp\.com\/(\w+)/)
 
    if (qContent.type === 'groupInviteMessage') {
      return client.groupAcceptInviteV4(qContent.sender, qContent.message.groupInviteMessage);
    } else if (IdMatch && IdMatch[1]){
      return client.groupAcceptInvite(groupId[1]);
    } else {
      console.log('Link invalido!')
      return null
    }
  }

  m.reply = (content, options = {}, options_ = {}, quoted = true) => {
    return client.sendMessage(
      m.chat,
      typeof content === "string" ? { text: content, ...options } : content,
      {
        ...(quoted ? { quoted: m } : {}),
        ...options_,
      }
    );
  };

  m.edit = (content, options = {}) => {
    return client.sendMessage(
      m.chat,
      typeof content === "string" ? { text: content, ...options } : content,
      {
        ...options,
        quoted: m.quoted ? m.quoted : m,
        ...(m.key && { id: m.key.id }),
      }
    );
  };

  m.getProfilePicture = async(jid, options = {}) => {
    return await client.profilePictureUrl(jid, 'image')
  }
  downloadBuffer = async(message) => {
    try {
     const buffer = await downloadMediaMessage(message, 'buffer')
     const { ext } = await fromBuffer(buffer)
     const filename = path.join(__dirname, '../cache', '/temp', `${Date.now()}.${ext}`)
      await writeFile(filename, buffer);
      return buffer
    } catch(err) {
      console.log('error descargando archivo', err.message)
    }
  }

  m.download = async () => {
   const buffer = await downloadBuffer(msg);
   return buffer
  }

  m.react = async (emoji = "") => {
    return client.sendMessage(m.chat, { react: { text: emoji, key: m.key } });
  };

  return m;
};


module.exports = { processMessage };