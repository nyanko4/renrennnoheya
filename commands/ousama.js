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
    const ousama = accountIds[number[0]];
    await sendchatwork(`王様は[piconname:${ousama}]さんです`, roomId);
    console.log(ousama);
    fs.writeFile("./ousamagame/ousama.txt", ousama.toString(), (err, data) => {
      console.error(err);
      console.log(data);
    });
    let ousamaigai = "";
    for (let n = 1; n <= number.length; n++) {
      ousamaigai += `${accountIds[number[n]]}\n`;
    }
    console.log(ousamaigai);
    fs.writeFile(
      "./ousamagame/ousamaigai.txt",
      ousamaigai.toString(),
      (err, data) => {
        console.error(err);
        console.log(data);
      }
    );
    return;
  } catch (error) {
    await sendchatwork(
      `[rp aid=${accountId} to=${roomId}-${messageId}][pname:${accountId}]さん\nエラー${error}`,
      roomId
    );
  }
}
async function ousamakekka(body, message, messageId, roomId, accountId) {
  let m = "[info][title]王様ゲーム[/title]王様は[piconname:";
  fs.readFile("./ousamagame/ousama.txt", "utf8", (err, data) => {
    console.error(err);
    console.log(data);
    m += data;
    m += "]さん\n";
    fs.readFile("./ousamagame/ousamaigai.txt", "utf8", (err, data) => {
      console.error(err);
      console.log(data);
      m += `[piconname:${data}]`;
      m += "[/info]";
      sendchatwork(m, roomId);
    });
  });
}
module.exports = {
  ousamagame,
  ousamakekka,
};
