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

app.get('/', async (req, res) => {
    const dataType = req.query.type || 'おみくじ';
    let tableName = '';
    let dataKey = 'items';
    switch (dataType) {
        case 'おみくじ':
            tableName = 'おみくじ';
            dataKey = 'items';
            break;
        case 'ブラックリスト':
            tableName = '発禁者';
            dataKey = 'blacklist';
            break;
        default:
            tableName = 'おみくじ';
            dataKey = 'items';
            break;
    }
    try {
        const { data, error } = await supabase
            .from(tableName)
            .select('*');
        if (error) {
            throw error;
        }
        res.render('index', { [dataKey]: data, currentDataType: dataType, isEditing: false });
    } catch (error) {
        console.error(`Supabaseデータの取得エラー (${dataType}):`, error);
        res.status(500).send(`データの取得に失敗しました (${dataType})`);
    }
});

// データの追加と更新
app.post('/api/items', async (req, res) => {
    const { dataType = 'おみくじ', editId, accountId, name, result } = req.body;
    let tableName = '';
    let insertData = {};
    let updateIdColumn = '';

    switch (dataType) {
        case 'おみくじ':
            tableName = 'おみくじ';
            insertData = { accountId, 名前: name, 結果: result };
            updateIdColumn = 'accountId';
            break;
        case 'ブラックリスト':
            tableName = '発禁者';
            insertData = { accountId: accountId, 理由: name, 回数: result };
            updateIdColumn = 'accountId';
            break;
        default:
            tableName = 'おみくじ';
            insertData = { accountId, 名前: name, 結果: result };
            updateIdColumn = 'accountId';
            break;
    }

    try {
        if (editId) {
            // 更新処理
            const { error } = await supabase
                .from(tableName)
                .update(insertData)
                .eq(updateIdColumn, editId);
            if (error) {
                throw error;
            }
            res.status(200).json({ message: `${dataType}の ID: ${editId} のデータを更新しました` });
        } else {
            // 追加処理
            const { data, error } = await supabase
                .from(tableName)
                .insert([insertData]);
            if (error) {
                throw error;
            }
            res.status(200).json({ message: `${dataType}のデータが追加されました` });
        }
    } catch (error) {
        console.error(`Supabaseデータの追加/更新エラー (${dataType}):`, error);
        res.status(500).json({ message: `${dataType}のデータの追加/更新に失敗しました`, error: error.message });
    }
});

// データの削除
app.delete('/api/items/:id', async (req, res) => {
    const { dataType = 'おみくじ' } = req.query;
    const { id } = req.params;
    let tableName = '';
    let idColumnName = '';

    switch (dataType) {
        case 'おみくじ':
            tableName = 'おみくじ';
            idColumnName = 'accountId';
            break;
        case 'ブラックリスト':
            tableName = '発禁者';
            idColumnName = 'accountId';
            break;
        default:
            tableName = 'おみくじ';
            idColumnName = 'accountId';
            break;
    }

    try {
        const { error } = await supabase
            .from(tableName)
            .delete()
            .eq(idColumnName, id);
        if (error) {
            throw error;
        }
        res.status(200).json({ message: `${dataType}の ID: ${id} のデータを削除しました` });
    } catch (error) {
        console.error(`Supabaseデータの削除エラー (${dataType}):`, error);
        res.status(500).json({ message: `${dataType}のデータの削除に失敗しました`, error: error.message });
    }
});

// データの更新 (PUTリクエスト用エンドポイント)
app.put('/api/items/:id', async (req, res) => {
    const { dataType = 'おみくじ' } = req.query;
    const { id } = req.params;
    const { accountId, name, result } = req.body;
    let tableName = '';
    let updateData = {};
    let idColumnName = '';

    switch (dataType) {
        case 'おみくじ':
            tableName = 'おみくじ';
            updateData = { accountId, 名前: name, 結果: result };
            idColumnName = 'accountId';
            break;
        case 'ブラックリスト':
            tableName = '発禁者';
            updateData = { accountId: accountId, 理由: name, 回数: result };
            idColumnName = 'accountId';
            break;
        default:
            tableName = 'おみくじ';
            updateData = { accountId, 名前: name, 結果: result };
            idColumnName = 'accountId';
            break;
    }

    try {
        const { error } = await supabase
            .from(tableName)
            .update(updateData)
            .eq(idColumnName, id);
        if (error) {
            throw error;
        }
        res.status(200).json({ message: `${dataType}の ID: ${id} のデータを更新しました` });
    } catch (error) {
        console.error(`Supabaseデータの更新エラー (${dataType}):`, error);
        res.status(500).json({ message: `${dataType}のデータの更新に失敗しました`, error: error.message });
    }
});