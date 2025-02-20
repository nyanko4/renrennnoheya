const { createClient } = require("@supabase/supabase-js");
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);
const { DateTime } = require("luxon");
const reqcheck = require("../middleware/sign");
const name = require("../ctr/cwdata").sendername;
const arashi = require("../module/arashi");
const command = require("../module/command");
const omikuji = require("../module/omikuji");
const senden = require("../module/senden")
const welcome = require("../module/welcome")

async function getchat(req, res) {
  const c = await reqcheck(req);
  if (c !== "ok") {
    return res.sendStatus(400);
  }
  const today = DateTime.now().setZone("Asia/Tokyo").toFormat("yyyy-MM-dd");
  console.log(req.body);
  const {
    body,
    account_id: accountId,
    room_id: roomId,
    message_id: messageId,
  } = req.body.webhook_event;
  const sendername = await name(accountId, roomId)
  if (roomId == 374987857) {
    //メッセージを保存
    const { data, error } = await supabase.from("nyankoのへや").insert({
      messageId: messageId,
      message: body,
      accountId: accountId,
      name: sendername,
      date: today,
    });
  }
  if (accountId === 9587322) {
    return res.sendStatus(200);
  }

  const handlers = [arashi, omikuji, senden, welcome, command];

  for (const handler of handlers) {
    if ((await handler(body, messageId, roomId, accountId)) === "ok") {
      return res.sendStatus(200);
    }
  }

  res.sendStatus(200);
}

module.exports = getchat;
