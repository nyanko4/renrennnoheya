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
function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1)); // 0からiまでのランダムなインデックス
        [array[i], array[j]] = [array[j], array[i]]; // 要素を交換
    }
    return array;
}

const shuffledArr = shuffle(accountIds);
const numberedItems = shuffledArr.map((item, index) => {
    return  // 番号と値をオブジェクトにまとめる
});
    console.log(numberedItems)
    fs.writeFile("./ousamagame/ousama.txt", numberedItems[1],(err, data) => {
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
