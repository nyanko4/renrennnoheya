const CHATWORK_API_TOKEN = process.env.CWapitoken;
const axios = require("axios");
const reqcheck = require("../middleware/sign");
const arashi = require("../module/arashi");

async function getchat(req, res) {
  const c = await reqcheck(req);
  if (c !== "ok") {
    return res.sendStatus(400);
  }
  console.log(req.body);
  const {
    body,
    account_id: accountId,
    room_id: roomId,
    message_id: messageId,
  } = req.body.webhook_event;
  await readmessage(roomId, messageId);
  if (accountId === 10496796) {
    return res.sendStatus(200);
  }
  
  const handlers = [arashi];

  for (const handler of handlers) {
    if ((await handler(body, messageId, roomId, accountId)) === "ok") {
      return res.sendStatus(200);
    }
  }

  res.sendStatus(200);
}

module.exports = getchat;
