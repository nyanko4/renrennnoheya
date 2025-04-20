const { DateTime } = require("luxon");
const sendchatwork = require("../ctr/message").sendchatwork;
const { kengen } = require("../ctr/filter");
const commands = {
  poker: require("../commands/poker"),
  dice: require("../commands/dice"),
  おみくじ: require("../commands/omikuji"),
  member: require("../commands/randommember"),
  say: require("../commands/say"),
  omikuji: require("../commands/omikujiresult"),
  ポーカー: require("../commands/pokerresult"),
  list: require("../commands/blacklist"),
  messagelink: require("../commands/messagelink"),
  roominfo: require("../commands/roominfo"),
  流し: require("../commands/nagashi"),
  kengen: kengen,
};
async function command(body, messageId, roomId, accountId) {
  const message = body.replace(/\/.*?\/|\s+/g, "");
  const command = getCommand(body);
  if (command && commands[command]) {
    await commands[command](body, message, messageId, roomId, accountId);
  } else if (command) {
    return;
  }
  if (body.match(/^now$/)) {
    await displaynow(body, message, messageId, roomId, accountId);
  }
}
function getCommand(body) {
  const pattern = /\/(.*?)\//;
  const match = body.match(pattern);
  return match ? match[1] : null;
}
//現在の時間を取得
async function displaynow(body, message, messageId, roomId, accountId) {
  const today = DateTime.now().setZone("Asia/Tokyo").toFormat("MM/dd hh:mm:ss");
  sendchatwork(today, roomId);
}
module.exports = command;
