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
const session = require("express-session");
const cookieParser = require("cookie-parser");
const { sendchatwork } = require("./ctr/message");
const ejs = require("ejs");
const path = require("path")
const cors = require('cors')
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
      const date = DateTime.now()
        .setZone("Asia/Tokyo")
        .toFormat("yyyy年MM月dd");
      sendchatwork(`日付変更　今日は${date}日です`, 374987857);
      await supabase.from("おみくじ").delete().neq("accountId", 0);
      await supabase.from("poker").delete().neq("accountId", 0);
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
const https = require("https");
const mention = require("./webhook/mention");
const getchat = require("./webhook/getchat");

app.set("views", __dirname + "/views");
app.set("view engine", "ejs");
app.use(express.json());
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));
app.use(cors())
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
    cookie: { maxAge: 5 * 24 * 60 * 60 * 1000 },
  })
);

app.use((req, res, next) => {
  const publicRoutes = ["/login", "/getchat", "/mention"]; // 認証をスキップするパスのリスト

  if (!publicRoutes.includes(req.path) && req.cookies.nyanko_a !== "ok") {
    req.session.redirectTo = req.path !== "/" ? req.path : null;
    return res.redirect("/login");
  } else {
    next();
  }
});


app.get("/login", (req, res) => {
  res.render("login", { error: null });
});

app.post("/login", (req, res) => {
  const password = req.body.password;
  if (password === process.env.password) {
    res.cookie("nyanko_a", "ok", {
      maxAge: 5 * 24 * 60 * 60 * 1000,
      httpOnly: true,
    });
    const redirectTo = req.session.redirectTo || "/";
    delete req.session.redirectTo;
    return res.redirect(redirectTo);
  } else {
    res.render("login", {
      error: "パスワードが間違っています。もう一度お試しください。",
    });
  }
});

app.post("/mention", (req, res) => {
  mention(req, res);
});

app.post("/getchat", (req, res) => {
  getchat(req, res);
});


// データの取得
app.get('/', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('おみくじ')
            .select('*');

        if (error) {
            throw error;
        }
        res.render('index', { items: data });
    } catch (error) {
        console.error('Supabaseデータの取得エラー:', error);
        res.status(500).send('データの取得に失敗しました');
    }
});

// データの追加
app.post('/api/items', async (req, res) => {
    try {
        const { name, description } = req.body;
        const { data, error } = await supabase
            .from('おみくじ')
            .insert([{ name, description }]);

        if (error) {
            throw error;
        }
        res.status(200).json({ message: 'データが追加されました' });
    } catch (error) {
        console.error('Supabaseデータの追加エラー:', error);
        res.status(500).json({ message: 'データの追加に失敗しました', error: error.message });
    }
});

// データの削除
app.delete('/api/items/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { data, error } = await supabase
            .from('おみくじ')
            .delete()
            .eq('accountId', id);

        if (error) {
            throw error;
        }
        if (data && data.length > 0) {
            res.status(200).json({ message: 'データが削除されました' });
        } else {
            res.status(404).json({ message: '指定されたIDのデータが見つかりませんでした' });
        }
    } catch (error) {
        console.error('Supabaseデータの削除エラー:', error);
        res.status(500).json({ message: 'データの削除に失敗しました', error: error.message });
    }
});