const msg = {
  chat: '120363036771877682@g.us',
  sender: '584262086639:18@s.whatsapp.net',
}

const chatId = msg.chat.includes('@s.whatsapp.net') 
? msg.sender.match(/^(\d+)@s\.whatsapp\.net$/)?.[1]
: msg.chat.includes('@g.us')
  ? msg.chat.match(/^([\d-]+)@g\.us$/)?.[1]
  : null;


console.log(msg.sender.match(/^(\d+)@s\.whatsapp\.net$/)?.[1])