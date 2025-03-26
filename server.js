"use strict";
const { createClient } = require("@supabase/supabase-js");
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);
const CronJob = require("cron").CronJob;
const { DateTime } = require("luxon");
const express = require("express");
const app = express();
const sendchatwork = require("./ctr/message").sendchatwork
const cluster = require("cluster");
const os = require("os");
const compression = require("compression");
const numClusters = os.cpus().length;
if (cluster.isMaster) {
  for (let i = 0; i < numClusters; i++) {
    cluster.fork();
  }
  cluster.on("exit", (worker, code, signal) => {
    cluster.fork();
  });
  new CronJob(
  "0 0 0 * * *",
  async () => {
    const date = DateTime.now().setZone("Asia/Tokyo").toFormat("yyyy年MM月dd");
    sendchatwork(`日付変更　今日は${date}日です`, 374987857);
    const { data, error } = await supabase.from("おみくじ").delete().neq("accountId", 0);
  },
  null,
  true,
  "Asia/Tokyo"
);
} else {
  app.use(compression());
  app.listen(3000, () => {
    console.log(`${process.pid} started`);
  });
}
const https = require('https');
const mention = require("./webhook/mention");
const getchat = require("./webhook/getchat");

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/", (req, res) => {
  res.end(JSON.stringify(process.versions, null, 2));
});

app.post("/mention", (req, res) => {
  mention(req, res);
});

app.post("/getchat", (req, res) => {
  getchat(req, res);
});

app.post("/test", (req, res) => {
  getchat(req, res);
});