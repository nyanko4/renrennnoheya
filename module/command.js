const { DateTime } = require("luxon");
const sendchatwork = require("../ctr/message").sendchatwork;
const poker = require("../commands/pokertest");
const dice = require("../commands/dice");
const Toomikuji = require("../commands/omikuji");
const proxyset = require("../commands/proxy").proxyset;
const proxyget = require("../commands/proxy").proxyget;
const proxydelete = require("../commands/proxy").proxydelete;
const randommember = require("../commands/randommember");
const say = require("../commands/say");
const omikujiresult = require("../commands/omikujiresult")
const blacklist = require("../commands/blacklist");
const messagelink = require("../commands/messagelink")
const roominfo = require("../commands/roominfo")
const kengen = require("../ctr/filter").kengen;
const commands = {
  poker: poker,
  dice: dice,
  おみくじ: Toomikuji,
  proxyset: proxyset,
  proxyget: proxyget,
  proxydelete: proxydelete,
  member: randommember,
  say: say,
  omikuji: omikujiresult,
  list: blacklist,
  messagelink: messagelink,
  roominfo: roominfo,
  kengen: kengen
};
async function test(body, messageId, roomId, accountId) {
  const message = body.replace(/\/.*?\/|\s+/g, "");
  const command = getCommand(body);
  if (command && commands[command]) {
    await commands[command](body, message, messageId, roomId, accountId);
  } else if (command) {
    return;
  }
  if (body.match(/^now$/)) {
    await displaynow(body, message, messageId, roomId, accountId)
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
module.exports = test;
