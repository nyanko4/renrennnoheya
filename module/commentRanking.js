const supabase = require("../supabase/client");
const { getMessages } = require("../ctr/message");

async function commentRanking(body, messageId, roomId, accountId) {
  const messageNum = await getRankingCommentNum(accountId);
  //コメント毎に取得
}

async function commentRankingMinute(roomId) {
  const messages = getMessages(roomId);

  //getMessageで取得したデータを取り出し回数を取得
  
  const messageNumSupabase = await getRankingCommentNum(accountId);
}

async function getRankingCommentNum(accountId) {
  const { data } = await supabase
    .from("message_num")
    .select("number")
    .eq("account_id", accountId)
  const messageNum = data.map(entry => entry.number).reduce((sum, val) => sum + val, 0);
  return messageNum;
}

module.exports = {
  commentRanking,
  commentRankingMinute,
};
