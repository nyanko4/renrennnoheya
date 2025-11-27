const supabase = require("../supabase/client");
const { getMessages } = require("../ctr/message");

async function commentRanking(body, messageId, roomId, accountId) {
  const data = await getRankingCommentNum(accountId);
  const messageNum = data.number + 1;
  await supabase
    .from("message_num")
    .upsert([
      {
        account_id: accountId,
        number: messageNum,
        },
      ]);
}

async function commentRankingMinute(roomId) {
  const messages = getMessages(roomId);
  
  
  const messageNumSupabase = await getRankingCommentNum(accountId);
}

async function getRankingCommentNum(accountId) {
  const { data, error } = await supabase
    .from("message_num")
    .select("number")
    .eq("account_id", accountId)
    .single()

  if (error) {
    console.error(error);
    return null;
  }
  
  return data;
}

module.exports = {
  commentRanking,
  commentRankingMinute,
};
