const { downloadMediaMessage } = require('baileys');
const path = require('path');
const { fromBuffer } = require('file-type');
const dotenv = require('dotenv');
dotenv.config();
const fs = require('fs').promises;


const MediaType = [
  'imageMessage',
  'videoMessage',
  'audioMessage',
  'stickerMessage',
  'documentMessage',
];


const downloadBuffer = async (message, temp = "temp") => {
  try {
    const buffer = await downloadMediaMessage(message, 'buffer');
    if (!buffer) throw new Error('Buffer vacío!');

    const fileInfo = await fromBuffer(buffer).catch(() => null);
    const ext = fileInfo?.ext ?? 'bin';

    const directory = path.join(__dirname, `../cache/${temp}`);
    await fs.mkdir(directory, { recursive: true });

    const filename = path.join(directory, `${Date.now()}.${ext}`);
    await fs.writeFile(filename, buffer);

    return buffer;
  } catch (err) {
    console.error('Error descargando archivo:', err.message);
    return null;
  }
};


/**
 *
 * @param {object} message - el objeto del mensaje
 * @param {Array<String>} types - los tipos de mensajes que se van a buscar
 * @returns {object} un objeto que contiene el tipo de mensaje y su contenido
 *
 */
const getMessageContent = (message, types) => {
  return types.reduce((acc, type) => message[type] ? { type, content: message[type] } : acc, { type: null, content: null });
};
/**
 *
 * @param {object} message - el objeto del mensaje
 * @returns {string} el body del mensaje
 *
 */
const getBody = (message) => {
  try {
    if (message.extendedTextMessage && message.extendedTextMessage.text) {
      return message.extendedTextMessage.text;
    }
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
      ''
    );
  } catch (error) {
    console.error('Error obteniendo body del mensaje:', error);
    return '';
  }
};

/**
 *
 * @param {object} client - la conexión del socket de baileys
 * @param {object} msg - el objeto del mensaje de baileys
 * @returns {object|null} el mensaje prcesado
 *
 */
const processMessage = async (client, msg) => {
  try {
    if (!msg) return null;

    const { type, content } = getMessageContent(msg.message, [
      'viewOnceMessage',
      'ephemeralMessage',
      'documentWithCaptionMessage',
      'viewOnceMessageV2',
      'editedMessage',
      'viewOnceMessageV2Extension',
      ...MediaType,
    ]);

    const messageType = Object.keys(msg.message).find(
      (t) => !['senderKeyDistributionMessage', 'messageContextInfo'].includes(t)
    );

    const m = {
      message: content ?? msg.message,
      key: msg.key,
      chat: msg.key.remoteJid,
      sender: msg.key.fromMe
        ? client.user.id
        : msg.key.participant ?? msg.key.remoteJid,
      type: messageType,
      mentions: msg.message[messageType]?.contextInfo?.mentionedJid ?? [],
      mimetype: msg.message?.mimetype ?? content?.mimetype ?? null,
      me: msg.key.fromMe,
      name: msg.pushName ?? 'undefined',
      body: getBody(msg.message),
      caption: msg.message?.[messageType]?.caption ?? null,
      args: (getBody(msg.message) ?? '').trim().split(/\s+/),
      quoted: null,
    };

    m.prefix = m.args?.[0]?.startsWith(process.env.PREFIX) ? process.env.PREFIX : null;
    m.command = m.prefix && m.args?.length > 0
      ? m.args.shift().slice(m.prefix[0].length).toLowerCase()
      : null;

    const quotedMessage = msg.message?.[m.type]?.contextInfo?.quotedMessage;
    if (quotedMessage) {
      const quotedContextInfo = msg.message[m.type].contextInfo;
      const quotedType = Object.keys(quotedMessage).find(
        (t) => !['senderKeyDistributionMessage', 'messageContextInfo'].includes(t)
      );

      m.quoted = {
        message: quotedMessage,
        key: {
          participant: quotedContextInfo.participant,
          remoteJid: quotedContextInfo.remoteJid ?? m.sender,
          fromMe: quotedContextInfo.participant === client.user.id,
          id: quotedContextInfo.stanzaId,
        },
        id: quotedContextInfo.stanzaId,
        isBot: quotedContextInfo.stanzaId.startsWith('BAE5') ||
          quotedContextInfo.stanzaId.startsWith('3EB0'),
        isGroup: (quotedContextInfo.remoteJid ?? m.sender).endsWith('@g.us'),
        chat: m.key.remoteJid,
        type: quotedType,
        sender: quotedContextInfo.participant,
        mimetype: quotedMessage?.[quotedType]?.mimetype ?? null,
        body: getBody(quotedMessage),
        caption: quotedMessage?.[quotedType]?.caption ?? null,
        args: getBody(quotedMessage ?? '').trim().split(/\s+/),
        mentions: quotedMessage?.[type]?.contextInfo?.mentionedJid ?? [],
        viewOnce: Boolean(
          quotedMessage.viewOnceMessage ||
          quotedMessage.viewOnceMessageV2 ||
          quotedMessage.viewOnceMessageV2Extension
        ),
        reply: (content, options = {}, options_ = {}, quoted = true) => {
          return client.sendMessage(
            m.chat,
            typeof content === 'string' ? { text: content, ...options } : content,
            {
              ...(quoted ? { quoted: m.quoted } : {}),
              ...options_,
            }
          );
        },
        download: async (temp) => {
          return await downloadBuffer(m.quoted, temp);
        },
      };
    }

    m.sendPresence = (state) => client.sendPresenceUpdate(state, m.chat);

    m.acceptInvite = async (content) => {
      const qContent = content?.quoted?.args[0] ? content.quoted : content;
      const idMatch = qContent.args?.[0]?.match(/https:\/\/chat\.whatsapp\.com\/(\w+)/);
      if (qContent.type === 'groupInviteMessage') {
        return client.groupAcceptInviteV4(qContent.sender, qContent.message.groupInviteMessage);
      }
      if (idMatch) {
        return client.groupAcceptInvite(idMatch[1]);
      }
      console.error('Link inválido!');
      return null;
    };

    m.reply = (content, options = {}, options_ = {}, quoted = true) => {
      return client.sendMessage(
        m.chat,
        typeof content === 'string' ? { text: content, ...options } : content,
        {
          ...(quoted ? { quoted: m } : {}),
          ...options_,
        }
      );
    };

    m.edit = (content, options = {}) => {
      return client.sendMessage(
        m.chat,
        typeof content === 'string' ? { text: content, ...options } : content,
        {
          ...options,
          quoted: m.quoted ? m.quoted : m,
          ...(m.key && { id: m.key.id }),
        }
      );
    };

    m.getProfilePicture = async (jid) => await client.profilePictureUrl(jid, 'image');
    m.download = async(temp) => await downloadBuffer(msg, temp);
    m.react = async (emoji = '') => client.sendMessage(m.chat, { react: { text: emoji, key: m.key } });

    return m;
  } catch (error) {
    console.error('Error procesando mensaje:', error);
    return null;
  }
};

module.exports = { processMessage };