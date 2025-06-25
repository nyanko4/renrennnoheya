"use strict";
const cluster = require("cluster");
const os = require("os");
const numCPUs = os.cpus().length;
const { startDailyTask } = require("./cron/dailytask");

if (cluster.isMaster) {
  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }
  cluster.on("exit", (worker) => {
    console.log(`Worker ${worker.process.pid} died. Restarting...`);
    cluster.fork();
  });

  startDailyTask();
} else {
  require("./server");
}
