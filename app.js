"use strict";

const { startTask, startDailyTask } = require("./cron/Task");
startTask();
startDailyTask();

require("./server");
