let message = {}
message.sender = '56920979762@s.whatsapp.net'
return console.log(message.sender.match(/^(\d+)@s\.whatsapp\.net$/)[1])
