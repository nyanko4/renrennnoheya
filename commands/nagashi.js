const { sendchatwork, sendchatwork2 } = require("../ctr/message");
async function nagashi(body, message, messageId, roomId, accountId) {
  if (accountId === 9487124) {
    const extractMatches = (regex) =>
      [...body.matchAll(regex)].map((n) => n[0]);
    const Id = extractMatches(/\d+(?=,)/g);
    let num = extractMatches(/(?<=,)\d+/g);
    if (num >= 100) {
      await sendchatwork("数が大きすぎます", roomId);
      return;
    }
    let i = 0;
    num = Number(num);

    while (i < num) {
      try {
        await sendchatwork2("あ", Id);
      } catch (err) {
        console.error(`エラー at i=${i}:`, err);
      }
      i++;
      if (i < num) {
        await new Promise((resolve) => setTimeout(resolve, 1000)); // 1秒待つ
      }
    }
  } else {
    await sendchatwork("botの主以外は使えません", roomId);
  }
}
module.exports = nagashi;
