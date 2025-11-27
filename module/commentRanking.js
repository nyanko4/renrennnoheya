const supabase = require("../supabase/client");
const { getMessages } = require("../ctr/message");

async function commentRanking(body, messageId, roomId, accountId) {
  if (!body.match(/^commentranking$/)) return;

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
  const messageNum = (data?.number ?? 0) + 1;

  await supabase.from("message_num").upsert([
    {
      account_id: accountId,
      number: messageNum,
    },
  ]);
}

async function commentRankingMinute(roomId) {
  const messages = await getMessages(roomId);

  const accountMessageNum = {};
  for (const message of messages) {
    const id = message.account.account_id;
    accountMessageNum[id] = (accountMessageNum[id] || 0) + 1;
  }

  const { data: dbList } = await supabase
    .from("message_num")
    .select("account_id, number");

  const dbMap = new Map(dbList.map(d => [d.account_id, d.number]));

  const upserts = [];

  for (const [accountId, minuteCount] of Object.entries(accountMessageNum)) {
    const dbCount = dbMap.get(accountId) ?? 0;
    upserts.push({
      account_id: accountId,
      number: Math.max(minuteCount, dbCount),
    });
  }

  await supabase.from("message_num").upsert(upserts);
}


async function getRankingCommentNum(accountId) {
  const { data, error } = await supabase
    .from("message_num")
    .select("number")
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
