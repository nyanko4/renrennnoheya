const { CronJob } = require("cron");
const supabase = require("../supabase/client");
const { commentRankingMinute } = require("../module/commentRanking");
const { getMessages } = require("../ctr/message");

function startTask() {
  console.log("起動")
  new CronJob(
    "5 * * * * *",
    async () => {
      try {
        console.log("1分たちました");
        await commentRankingMinute(374987857);
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
      await supabase
        .from("message_num")
        .delete()
        .neq("accountId", 0);
    await getMessages(374987857);
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
