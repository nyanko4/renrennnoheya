const msedit = require("../ctr/message");
const isUserAdmin = require("../ctr/cwdata").isUserAdmin;
const command = require("../module/command");

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

  res.sendStatus(500);
  if ((await command(body, messageId, roomId, accountId)) === "ok") {
      return res.sendStatus(200);
    }
}

module.exports = mentionWebhook;
