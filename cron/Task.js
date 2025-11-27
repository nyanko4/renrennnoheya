const { CronJob } = require("cron");
const supabase = require("../supabase/client");
const { commentRankingMinute } = require("../module/commentRanking");
const { getMessages } = require("../ctr/message");

function startTask() {
  new CronJob(
    "5 * * * * *",
    async () => {
      await commentRankingMinute(374987857)
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
