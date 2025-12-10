const { CronJob } = require("cron");
const supabase = require("../supabase/client");
const { dailyCommentRanking, commentRankingMinute, dailyComment } = require("../module/commentRanking");
const { getMessages } = require("../ctr/message");
const kotya = process.env.kotya;

function startTask() {
  new CronJob(
    "5 * * * * *",
    async () => {
      try {
        console.log("1分たちました");
        await commentRankingMinute(364321548);
      } catch (err) {
        console.error("commentRankingMinute error:", err.message);
      }
    },
    null,
    true,
    "Asia/Tokyo"
  );
}

function startDailyTask() {
  new CronJob(
  "0 0 0 * * *",
  async () => {
    console.log("0時になりました");
    await dailyCommentRanking(364321548, kotya);
    await dailyComment(364321548);
    await getMessages(364321548);
  },
    null,
    true,
    "Asia/Tokyo"
  );
}


module.exports = {
  startTask,
  startDailyTask,
};
