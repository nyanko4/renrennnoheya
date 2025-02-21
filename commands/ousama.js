const fs = require("fs")
const cwdata = require("../ctr/cwdata")
const sendchatwork = require("../ctr/message").sendchatwork
async function ousamagame(body, message, messageId, roomId, accountId) {
  try {
    const members = await cwdata.getChatworkMembers(roomId);
    if (!members || members.length === 0) {
      return;
    }
    const randomIndex = Math.floor(Math.random() * members.length);
    const randomMember = members[randomIndex];
  }
    fs.writeFile('./ousamagame/ousama.txt', r, function(err) {
      console.log(err)
    })
} catch (error) {
    await sendchatwork(
      `[rp aid=${accountId} to=${roomId}-${messageId}][pname:${accountId}]さん\nエラー`,
      roomId
    );
  }
}
async function ousamakekka(body, message, messageId, roomId, accountId) {
fs.readFile('./ousamagame/ousama.txt', 'utf8', function(err, data) {   
  console.log(data);
      console.log(err)
  })
}
module.exports = ousamagame