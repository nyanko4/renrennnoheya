const sendchatwork = require("../ctr/message").sendchatwork;
const poker = require("../commands/poker");
const dice = require("../commands/dice");
const Toomikuji = require("../commands/omikuji");
const proxyset = require("../commands/proxy").proxyset;
const proxyget = require("../commands/proxy").proxyget;
const proxydelete = require("../commands/proxy").proxydelete;
const kengen = require("../ctr/filter").kengen;
const commands = {
  poker: poker,
  dice: dice,
  おみくじ: Toomikuji,
  proxyset: proxyset,
  proxyget: proxyget,
  proxydelete: proxydelete,
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
}
function getCommand(body) {
  const pattern = /\/(.*?)\//;
  const match = body.match(pattern);
  return match ? match[1] : null;
}
module.exports = test;
