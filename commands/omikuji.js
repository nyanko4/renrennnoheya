const sendchatwork = require("../ctr/message").sendchatwork
//無限おみくじ
async function Toomikuji(body, message, messageId, roomId, accountId) {
  try {
    const omikujiResult = getOmikujiResult();
    await sendchatwork(
      `[rp aid=${accountId} to=${roomId}-${messageId}]\n${omikujiResult} ※`,
      roomId
    );
    function getOmikujiResult() {
      const random = Math.random() * 100;
      if (random < 5) return "大凶";
      //5
      else if (random < 25) return "小吉";
      //20
      else if (random < 42.3) return "末吉";
      //17.3
      else if (random < 62.3) return "吉";
      //20
      else if (random < 77.3) return "中吉";
      //15
      else if (random < 87.3) return "凶";
      //10
      else if (random < 87.4) return "シークレット";
      //0.1
      else return "大吉"; //12.6
    }
  } catch (error) {
    console.error(
      "エラー:",
      error.response ? error.response.data : error.message
    );
  }
}
module.exports = Toomikuji