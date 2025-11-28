const supabase = require("../supabase/client");
const { sendchatwork, getMessages } = require("../ctr/message");
const { isUserAdmin } = require("../ctr/cwdata");

async function commentRanking(body, messageId, roomId, accountId) {
  if (!body.match(/^commentranking$/)) return;

  const isAdmin = await isUserAdmin(accountId, roomId);
  if (!isAdmin) return;

  try {
    const { data, error } = await supabase
      .from("message_num")
      .select("account_id, number")
      .order("number", { ascending: false })
      .limit(5);

    if (error) {
      console.error(`Supabase fetch error for room ${roomId}:`, error.message);
      return "[info][title]エラー[/title]ランキング取得に失敗しました。[/info]";
    }

    let messageText = "[info][title]ランキング[/title]\n";
    data.forEach((row, index) => {
      messageText += `No.${index + 1}：[piconname:${row.account_id}]（+${row.number}件）\n`;
    });
    messageText += "[/info]";
    return messageText;

  } catch (err) {
    console.error("commentRanking error:", err.message);
    return "[info][title]エラー[/title]不明なエラーが発生しました。[/info]";
  }
}


async function commentRankingRealTime(body, messageId, roomId, accountId) {
  const data = await getRankingCommentNum(accountId);
  const messageNum = (data?.realtime_number ?? 0) + 1;

  await supabase.from("message_num").upsert([
    {
      account_id: accountId,
      realtime_number: messageNum,
    },
  ]);
}


async function commentRankingMinute(roomId) {
  try {
    const messages = await getMessages(roomId);
  
    const minuteCounts = {};
    for (const message of messages) {
      const id = message.account.account_id;
      console.log(id);
      minuteCounts[id] = (minuteCounts[id] || 0) + 1;
    }
  
    const { data: dbList } = await supabase
      .from("message_num")
      .select("account_id, number, realtime_number");

    console.log(dbList);
  
    const upserts = [];

    for (const db of dbList) {
      const accountId = db.account_id;
      const realtime = db.realtime_number ?? 0;
      const apiCount = minuteCounts[accountId] ?? 0;
  
      const add = Math.max(realtime, apiCount);
      const newTotal = (db.number ?? 0) + add;
  
      upserts.push({
        account_id: accountId,
        number: newTotal,
        realtime_number: 0,
      });
    }
  
    const { data, error } = await supabase.from("message_num").upsert(upserts);
    if (error) {
      console.error(error.message);
    }
  } catch (error) {
    console.error("rankingMinuteError:", error.message);
  }
}

async function getRankingCommentNum(accountId) {
  const { data, error } = await supabase
    .from("message_num")
    .select("realtime_number")
    .eq("account_id", accountId)
    .single();

  if (error) return null;
  return data;
}

module.exports = {
  commentRanking,
  commentRankingRealTime,
  commentRankingMinute,
};
