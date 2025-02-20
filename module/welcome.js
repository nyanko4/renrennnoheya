const { createClient } = require("@supabase/supabase-js");
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);
const sendchatwork = require("../ctr/message").sendchatwork
const cwdata = require("../ctr/cwdata")
const block = require("../ctr/filter").blockMember
//部屋に参加したら送信する
async function welcome(body, message, messageId, roomId, sendername) {
  try {
    const members = await cwdata.getChatworkMembers(roomId);
    const welcomeId = (message.match(/\[piconname:(\d+)\]/) || [])[1];
    const { data } = await supabase
      .from("発禁者")
      .select("accountId, reason, count")
      .eq("accountId", welcomeId);
    let reason = "";
    let count = "";
    data.forEach((person) => {
      reason += person.reason;
      count += person.count;
    });
    if (reason.includes("荒らし") || count >= 4) {
      await block(
        
  body,
        message,
        messageId,
        roomId,
        welcomeId,
        sendername
      );
    }
    await sendchatwork(
      `[rp aid=${welcomeId} to=${roomId}-${messageId}] [pname:${welcomeId}]さん\nよろ〜`,
      roomId
    );
  } catch (error) {
    console.error(
      "入室エラー",
      error.response ? error.response.data : error.message
    );
  }
}