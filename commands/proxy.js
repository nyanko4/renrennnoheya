const { createClient } = require("@supabase/supabase-js");
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);
const sendchatwork = require("../ctr/message").sendchatwork
const isUserAdmin = require("../ctr/cwdata").isUserAdmin
//proxyを設定する
async function proxyset(body, message, messageId, roomId, accountId) {
  try {
    const isAdmin = await isUserAdmin(accountId, roomId);
    if (!isAdmin) {
      sendchatwork("管理者のみ利用可能です", roomId);
    } else {
      const match = message.match(/^([^「]+)"(.+)"$/);
      const proxyname = match[1];
      const proxyurl = match[2];
      console.log(proxyname, proxyurl);
      if (!match) {
        await sendchatwork(
          `[rp aid=${accountId} to=${roomId}-${messageId}][pname:${accountId}]さん\n構文エラー`,
          roomId
        );
        return;
      }
      const { data, error } = await supabase
        .from("proxy")
        .insert([{ roomId: roomId, proxyname: proxyname, proxyurl: proxyurl }]);
      if (error) {
        await sendchatwork(
          `[rp aid=${accountId} to=${roomId}-${messageId}][pname:${accountId}]さん\nデータを保存できませんでした`,
          roomId
        );
        console.error(error);
      } else {
        await sendchatwork(
          `[rp aid=${accountId} to=${roomId}-${messageId}][pname:${accountId}]さん\nデータを保存しました！`,
          roomId
        );
      }
    }
  } catch (error) {
    console.error("error", error);
  }
}
//proxyを表示する
async function proxyget(body, message, messageId, roomId, accountId) {
  try {
    const proxyname = message;
    if (message == "") {
      const { data, error } = await supabase.from("proxy").select("proxyname");
      if (error) {
        console.error("URL取得エラー:", error);
      } else {
        if (data.length === 0) {
          await sendchatwork(
            `[rp aid=${accountId} to=${roomId}-${messageId}][pname:${accountId}]さん\n保存されされているproxyはありません`,
            roomId
          );
        } else {
          let messageToSend = `[rp aid=${accountId} to=${roomId}-${messageId}][pname:${accountId}]さん[info][title]保存されているproxy[/title]`;
          data.forEach((item) => {
            messageToSend += `${item.proxyname}\n`;
          });

          messageToSend += "[/info]";
          await sendchatwork(messageToSend, roomId);
        }
      }
    } else {
      const { data, error } = await supabase
        .from("proxy")
        .select("proxyname, proxyurl")
        .eq("proxyname", proxyname);
      if (error) {
        console.error("URL取得エラー:", error);
      } else {
        if (data.length === 0) {
          await sendchatwork(
            `[rp aid=${accountId} to=${roomId}-${messageId}][pname:${accountId}]さん\n保存されたURLはありません`,
            roomId
          );
        } else {
          let messageToSend = `[rp aid=${accountId} to=${roomId}-${messageId}][pname:${accountId}]さん[info][title]保存されているURL[/title]`;
          data.forEach((item) => {
            messageToSend += `${item.proxyname} - https://${item.proxyurl}\n`;
          });
          messageToSend += "[/info]";
          await sendchatwork(messageToSend, roomId);
        }
      }
    }
  } catch (error) {
    console.error("error", error);
  }
}
//proxyを削除する
async function proxydelete(body, message, messageId, roomId, accountId) {
  const isAdmin = await isUserAdmin(accountId, roomId);
  if (!isAdmin) {
    sendchatwork("管理者のみ利用可能です", roomId);
  } else {
    const match = message.match(/^([^「]+)"(.+)"$/);
    const proxyname = match[1];
    const proxyurl = match[2];
    console.log(proxyname);
    console.log(proxyurl);
    const { data, error } = await supabase
      .from("proxy")
      .delete()
      .eq("proxyurl", proxyurl)
      .eq("roomId", roomId)
      .eq("proxyname", proxyname);

    if (error) {
      await sendchatwork(
        `[rp aid=${accountId} to=${roomId}-${messageId}][pname:${accountId}]さん\n削除しようとしているURLが見つかりません。。`,
        roomId
      );
    } else {
      await sendchatwork(
        `[rp aid=${accountId} to=${roomId}-${messageId}][pname:${accountId}]さん\n削除しました`,
        roomId
      );
    }
  }
}

module.exports = {
  proxyset,
  proxyget,
  proxydelete
}