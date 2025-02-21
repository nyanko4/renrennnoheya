const fs = require("fs")
const cwdata = require("../ctr/cwdata")
const sendchatwork = require("../ctr/message").sendchatwork
async function ousamagame(body, message, messageId, roomId, accountId) {
  try {
    const members = await cwdata.getChatworkMembers(roomId);
    if (!members || members.length === 0) {
      return;
    }
    fs.writeFile('../ousamagame/ousama.txt', 'サンプルの文字列', function(err) {
      console.log(err)
    })
  } catch (error) {
    await sendchatwork(
      `[rp aid=${accountId} to=${roomId}-${messageId}][pname:${accountId}]さん\nエラー`,
      roomId
    );
  }
}
module.exports = ousamagame