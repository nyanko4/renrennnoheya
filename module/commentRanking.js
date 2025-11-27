const supabase = require("../supabase/client");
const { getMessages } = require("../ctr/message");

async function commentRanking(body, messageId, roomId, accountId) {
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
  let accountMessageNum = {};
  const messages = await getMessages(roomId);

  for (const message of messages) {
    const accountId = message.account.account_id;

    if (!accountMessageNum[accountId]) {
      accountMessageNum[accountId] = 0;
    }

    accountMessageNum[accountId] += 1;
  }

  for (const accountId of Object.keys(accountMessageNum)) {
    const minuteCount = accountMessageNum[accountId];

    const dbData = await getRankingCommentNum(accountId);
    const dbCount = dbData?.number ?? 0;

    const correctCount = Math.max(minuteCount, dbCount);

    await supabase.from("message_num").upsert([
      {
        account_id: accountId,
        number: correctCount,
      },
    ]);
  }
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
  commentRankingMinute,
};
