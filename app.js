"use strict";

const { startTask, startDailyTask } = require("../cron/dailyTask");
startTask();
startDailyTask();

require("./server");
