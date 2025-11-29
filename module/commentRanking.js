const supabase = require("../supabase/client");
const { sendchatwork, sendchatwork_hon, getMessages, getMessageNum } = require("../ctr/message");
const { isUserAdmin } = require("../ctr/cwdata");

async function commentRanking(body, messageId, roomId, accountId) {
  if (!body.match(/^commentranking$/)) return;
  
  const isAdmin = await isUserAdmin(accountId, roomId);
  if (!isAdmin) return;

  const { messageText } = await getCommentRanking();
  await sendchatwork(messageText, roomId);
}

async function dailyCommentRanking(roomId) {
  const { messageText, messageTextWeekly, messageTextDaily } = await getCommentRanking(roomId);
  await sendchatwork_hon(`${messageText}\n${messageTextWeekly}\n今日のコメント数: ${messageTextDaily}件`, roomId);
}

async function getCommentRanking(roomId) {
  try {
    const { data: dayData, error: dayError } = await supabase
      .from("message_num")
      .select("account_id, number, day_number")
      .order("number", { ascending: false })
      .limit(5);

    const { data: weeklyData, error: weeklyError } = await supabase
      .from("message_num")
      .select("account_id, weekly_number")
      .order("weekly_number", { ascending: false })
      .limit(5);

    if (dayError) {
      console.error(`Supabase fetch error:`, dayError.message);
    }

    if (weeklyError) {
      console.error(`Supabase fetch error:`, weeklyError.message);
    }

    const dayNumber = dayData?.[0]?.day_number ?? 0;
    
    let messageText = `[info][title]ランキング[/title]\n`;

    let messageTextWeekly = `[info][title]週計ランキング ${dayNumber}日目[/title]\n`;

    dayData.forEach((row, index) => {
      messageText += `${index + 1}位：[piconname:${row.account_id}]（${row.number}件）\n`;
    });

    weeklyData.forEach((row, index) => {
      messageTextWeekly += `${index + 1}位：[piconname:${row.account_id}]（${row.weekly_number}件）\n`;
    });

    messageText += "[/info]";
    messageTextWeekly += "[/info]";

    const totalMessageNum = await getMessageNum(roomId);

    const { data: beforeData } = await supabase
      .from("total_message_num")
      .select("message_num")
      .eq("room_id", roomId)
      .single()

    const before = beforeData?.message_num ?? 0;

    const messageTextDaily = totalMessageNum - before;

    return { messageText, messageTextWeekly, messageTextDaily };

  } catch (err) {
    console.error("commentRanking error:", err.message);
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
      minuteCounts[id] = (minuteCounts[id] || 0) + 1;
    }
  
    const { data: dbList } = await supabase
      .from("message_num")
      .select("account_id, number, realtime_number");

  
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
  
    const { data, error } = await supabase
      .from("message_num")
      .upsert(upserts)
    
    if (error) {
      console.error(error);
    }
    
  } catch (error) {
    console.error("rankingMinuteError:", error.message);
  }
}

async function weeklyComment() {
  try {
    const { data: dbList } = await supabase
      .from("message_num")
      .select("account_id, number, day_number, weekly_number");

  
    const upserts = [];

    for (const db of dbList) {
      const accountId = db.account_id;
      const number = db.number ?? 0;
      const weeklyNumber = (db.weekly_number ?? 0) + number;
      const dayNumber = (db.day_number ?? 0) + 1;
    
      upserts.push({
        account_id: accountId,
        number: 0,
        weekly_number: weeklyNumber,
        day_number: dayNumber,
      });
    }
  
    const { data, error } = await supabase
      .from("message_num")
      .upsert(upserts)
    
    if (error) {
      console.error(error);
    }
    
  } catch (error) {
    console.error("weeklyCommentError:", error.message);
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

async function dailyComment(roomId) {
  const totalMessageNum = await getMessageNum(roomId);
  await supabase
    .from("total_message_num")
    .upsert([
      {
        room_id: roomId,
        message_num: totalMessageNum,
      }
    ])
}

module.exports = {
  commentRanking,
  dailyCommentRanking,
  commentRankingRealTime,
  commentRankingMinute,
  weeklyComment,
  dailyComment,
};
