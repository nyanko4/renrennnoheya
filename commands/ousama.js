const fs = require("fs");
const cwdata = require("../ctr/cwdata");
const sendchatwork = require("../ctr/message").sendchatwork;
async function ousamagame(body, message, messageId, roomId, accountId) {
  try {
    const members = await cwdata.getChatworkMembers(roomId);
    if (!members || members.length === 0) {
      return;
    }
    const randomIndex = Math.floor(Math.random() * members.length);
    const randomMember = members[randomIndex];
    const ousama = randomMember.toString();
    await sendchatwork(
      `王様は[piconname:${randomMember.account_id}]さんです`,
      roomId
    );
    fs.writeFile("./ousamagame/ousama.txt", ousama, function (data, err) {
      console.log(data);
      console.log(err);
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
  fs.readFile("./ousamagame/ousama.txt", "utf8", function (data, err) {
    console.log(data);
    console.log(err);
    sendchatwork(data, roomId);
  });
}
module.exports = {
  ousamagame,
  ousamakekka,
};
