const { createClient } = require("@supabase/supabase-js");
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);
const block = require("../ctr/filter");
const isAdmin = require("../ctr/cwdata").isUserAdmin;
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
  } catch (error) {
    console.error("エラー※宣伝", error);
  }
}
async function sendenkinshi(body, messageId, roomId, accountId) {
  try {
    const { data, error } = await supabase
        .from("発禁者")
        .select("accountId, reason, count, roomId")
        .eq("accountId", accountId)
        .eq("roomId", 374987857);
    console.log(data)
    let count = "";
    data.forEach((item) => {
            count += Number(item.count);
          });
    console.log(count)
  } catch (error) {
    console.error("error※宣伝", error)
  }
}
module.exports = senden