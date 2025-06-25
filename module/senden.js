const supabase = require("../supabase/client");
const block = require("../ctr/filter");
const isUserAdmin = require("../ctr/cwdata").isUserAdmin;
const sendchatwork = require("../ctr/message").sendchatwork;
async function senden(body, messageId, roomId, accountId) {
  try {
    if (body.match(/\www.chatwork.com\/g/g)) {
      await sendenkinshi(body, messageId, roomId, accountId);
    }
    if (body.match(/\www.chatwork.com\/#!join/g)) {
      await sendenkinshi(body, messageId, roomId, accountId);
    }
    if (body.match(/\https:\/\/odaibako.net\/u/g)) {
      await sendenkinshi(body, messageId, roomId, accountId);
    }
    if (body.match(/\https:\/\/scratch.mit.edu/g)) {
      await sendenkinshi(body, messageId, roomId, accountId);
    }
    if (body.match(/\https:\/\/padlet.com/g)) {
      await sendenkinshi(body, messageId, roomId, accountId);
    }
    if (body.match(/\https:\/\/marshmallow-qa.com/g)) {
      await sendenkinshi(body, messageId, roomId, accountId);
    }
  } catch (error) {
    console.error("エラー※宣伝", error);
  }
}
async function sendenkinshi(body, messageId, roomId, accountId) {
  try {
    const isAdmin = await isUserAdmin(accountId, roomId);
    if (!isAdmin) {
      sendchatwork(
        `[rp aid=${accountId} to=${roomId}-${messageId}][pname:${accountId}] さん\n宣伝禁止`,
        roomId
      );
      const { data } = await supabase
        .from("ブラックリスト")
        .select("accountId, 理由, 回数")
        .eq("accountId", accountId);
      let count = "";
      data.forEach((person) => {
        count += person.回数;
      });
      const number = Number(count) + 1;
      if (number === 3) {
        block.blockMember(
          roomId,
          accountId,
          "3度目の概要違反のため発禁になります"
        );
      } else if (number >= 4) {
        block.blockMember(
          roomId,
          accountId,
          "4度目の概要違反のためbanとなります"
        );
      }
      const { error } = await supabase.from("ブラックリスト").upsert([
        {
          accountId: accountId,
          理由: "宣伝",
          回数: number,
          roomId: roomId,
        },
      ]);
      if (error) {
        console.error(error);
      }
    } else {
      console.log("管理者のため見逃されました");
    }
  } catch (error) {
    console.error("error※宣伝", error);
  }
}
module.exports = senden;
