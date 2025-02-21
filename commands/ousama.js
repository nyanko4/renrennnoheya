const fs = require("fs");
const cwdata = require("../ctr/cwdata");
const sendchatwork = require("../ctr/message").sendchatwork;
async function ousamagame(body, message, messageId, roomId, accountId) {
  try {
    const members = await cwdata.getChatworkMembers(roomId);
    if (!members || members.length === 0) {
      return;
    }
    let accountIds = []
    members.forEach((member) => {
      accountIds.push(member.account_id)
    })
    console.log(accountIds)
    fs.writeFile("./ousamagame/ousama.txt", "a",(err, data) => {
      console.error(err);
      console.log(data)
    });
    return;
  } catch (error) {
    await sendchatwork(
      `[rp aid=${accountId} to=${roomId}-${messageId}][pname:${accountId}]さん\nエラー${error}`,
      roomId
    );
  }
}
async function ousamakekka(body, message, messageId, roomId, accountId) {
  fs.readFile("./ousamagame/ousama.txt", "utf8", (err, data) => {
    console.error(err);
    console.log(data);
    sendchatwork(`[info][title]王様ゲーム[/title]王様は[piconname:${data}]さん\n[/info]`, roomId);
  });
}
module.exports = {
  ousamagame,
  ousamakekka,
};
