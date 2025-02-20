const sendchatwork = require("../ctr/message").sendchatwork;
const poker = require("../commands/poker")
const dice = require("../commands/dice")
const Toomikuji = require("../commands/omikuji")
const commands = {
  poker: poker,
  dice: dice,
  おみくじ: Toomikuji,
};
async function test(body, messageId, roomId, accountId) {
  const message = body.replace(/\/.*?\/|\s+/g, "");
  const command = getCommand(body);
  if (command && commands[command]) {
    await commands[command](body, message, messageId, roomId, accountId);
  } else if (command){
    sendchatwork(
      "現在bot停止中のため要件のある場合は本垢に言ってください",
      roomId
    );
  }
}
function getCommand(body) {
  const pattern = /\/(.*?)\//;
  const match = body.match(pattern);
  return match ? match[1] : null;
}
module.exports = { test };