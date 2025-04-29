const { createClient } = require("@supabase/supabase-js");
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);
const isUserAdmin = require("../ctr/cwdata").isUserAdmin;
const sendchatwork = require("../ctr/message").sendchatwork;
//おみくじの結果を表示する
async function omikujiresult(body, message, messageId, roomId, accountId) {
  try {
    const isAdmin = await isUserAdmin(accountId, roomId);
    if (!isAdmin) {
      sendchatwork("管理者のみ利用可能です", roomId);
    } else {
      const { data, error } = await supabase
        .from("おみくじ")
        .select("accountId, 名前, 結果")

      if (error) {
        console.error("おみくじ取得エラー:", error);
      } else {
        if (data.length === 0) {
          await sendchatwork(
            `[rp aid=${accountId} to=${roomId}-${messageId}][pname:${accountId}]さん\nまだおみくじを引いた人はいません`,
            roomId
          );
        } else {
          let messageToSend = `[rp aid=${accountId} to=${roomId}-${messageId}][pname:${accountId}] さん[info][title]おみくじを引いた人[/title]`;
          data.forEach((item) => {
            messageToSend += `${item.結果} [piconname:${item.accountId}]\n`;
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
module.exports = omikujiresult