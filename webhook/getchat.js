const { createClient } = require("@supabase/supabase-js");
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);
const { DateTime } = require("luxon");
const reqcheck = require("../middleware/sign");
const sendername = require("../ctr/cwdata").sendername;
const arashi = require("../module/arashi");
const command = require("../module/command")

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

  const handlers = [arashi.emoji, arashi.to, arashi.tag, arashi.zalgo, command];

  for (const handler of handlers) {
    if ((await handler(body, roomId, accountId)) === "ok") {
      return res.sendStatus(200);
    }
  }

  res.sendStatus(200);
}

module.exports = getchat;
