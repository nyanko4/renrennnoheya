const msedit = require("../ctr/message");
const { blockMember } = require("../ctr/filter");
const { isUserAdmin } = require("../ctr/cwdata");
const arashi = require("../module/arashi");

async function mentionWebhook(req, res) {
  const accountId = req.body.webhook_event.from_account_id;
  const roomId = req.body.webhook_event.room_id;
  const messageId = req.body.webhook_event.message_id;
  const body = req.body.webhook_event.body;
  await msedit.readmessage(roomId, messageId);
  if (body.includes("削除")) {
    const isAdmin = await isUserAdmin(accountId, roomId);
    if (isAdmin){
      await msedit.deleteMessages(body, messageId, roomId, accountId);
    return res.sendStatus(200);
  } else {
    msedit.sendchatwork("管理者のみ利用可能です", roomId)
  }}
  if (body.match(/\[toall\]/g)) {
    const isAdmin = await isUserAdmin(accountId, roomId);
    if (!isAdmin) {
      blockMember(roomId, accountId, "toall");
    }
    return "ok";
  }
}

module.exports = mentionWebhook;
