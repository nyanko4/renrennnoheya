const sendchatwork = require("../ctr/message").sendchatwork
//poker
async function poker(body, message, messageId, roomId, accountId) {
  try {
    if (message.match(/^役$/)) {
      sendchatwork("[preview id=1670380556 ht=200]", roomId);
    } else {
      let card = [];
      let poker = [];
      for (let i = 1; i < 13; i++) {
        card.push(`♣️${i}`, `♦️${i}`, `❤️${i}`, `♠️${i}`);
      }
      function shuffle(array) {
        for (let i = array.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [array[i], array[j]] = [array[j], array[i]];
        }
      }
      shuffle(card);
      poker = card.slice(0, 5);
      sendchatwork(
        `[rp aid=${accountId} to=${roomId}-${messageId}][pname:${accountId}] さん\n${poker}`,
        roomId
      );
    }
  } catch (error) {
    console.error(error);
  }
}
module.exports = poker;