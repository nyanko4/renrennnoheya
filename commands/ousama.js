const fs = require("fs");
const cwdata = require("../ctr/cwdata");
const sendchatwork = require("../ctr/message").sendchatwork;
async function ousamagame(body, message, messageId, roomId, accountId) {
  try {
    const members = await cwdata.getChatworkMembers(roomId);
    if (!members || members.length === 0) {
      return;
    }
    let accountIds = [];
    members.forEach((member) => {
      accountIds.push(member.account_id);
    });
    let numbers = [];
    for (let i = 0; i <= accountIds.length; i++) {
      numbers.push(i);
    }
    function shuffle(array) {
      for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
      }
      return array;
    }
    const number = shuffle(numbers);
    console.log(number);
    const ousama = accountIds[number].toString();
    fs.writeFile("./ousamagame/ousama.txt", ousama, (err, data) => {
      console.error(err);
      console.log(data);
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
    sendchatwork(
      `[info][title]王様ゲーム[/title]王様は[piconname:${data}]さん\n[/info]`,
      roomId
    );
  });
}
module.exports = {
  ousamagame,
  ousamakekka,
};
