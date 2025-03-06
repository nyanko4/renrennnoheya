const { createClient } = require("@supabase/supabase-js");
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);
const isUserAdmin = require("../ctr/cwdata").isUserAdmin;
const sendchatwork = require("../ctr/message").sendchatwork;
//ブラックリストを表示する
async function blacklist(body, message, messageId, roomId, accountId) {
  try {
    const isAdmin = await isUserAdmin(accountId, roomId);
    if (!isAdmin) {
      sendchatwork("管理者のみ利用可能です", roomId);
    } else {
      const { data, error } = await supabase
        .from("発禁者")
        .select("accountId, reason, count, roomId")
        .eq("roomId", roomId);
      if (error) {
        console.error("発禁者取得エラー:", error);
      } else {
        if (data.length === 0) {
          await sendchatwork(
            `[rp aid=${accountId} to=${roomId}-${messageId}][pname:${accountId}]さん\nまだブラックリスト入りしてる人はいません`,
            roomId
          );
        } else {
          let messageToSend = `[rp aid=${accountId} to=${roomId}-${messageId}][pname:${accountId}]さん[info][title]ブラックリスト[/title]`;
          data.forEach((item) => {
            messageToSend += `[picon:${item.accountId}] ${item.reason} count:${item.count}\n`;
          });
          messageToSend += "[/info]";
          await sendchatwork(messageToSend, roomId);
        }
      }
    }
  } catch (error) {
    console.error(
      "エラー:",
      error.response ? error.response.data : error.message
    );
  }
}
module.exports = blacklist