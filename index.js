"use strict";
const express = require("express");
let app = express();
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
} else {
  app.use(compression());
  app.use(express.static(__dirname + "/public"));
  app.set("view engine", "ejs");
  app.listen(3000, () => {
    console.log(`Worker ${process.pid} started`);
  });
}

const axios = require('axios');
const bodyParser = require("body-parser");

const PORT = 3000;

app.use(bodyParser.json());

const CHATWORK_API_TOKEN = process.env.CHATWORK_API_TOKEN;
//コマンドリスト
const commands = {
  "help": wakamehelp,
  "quiz": startQuiz
};

app.get('/', (req, res) => {
    res.sendStatus(200);
});
//エンドポイント
app.post("/webhook", async (req, res) => {
  const fromAccountId = req.body.webhook_event.from_account_id;
  const roomId = req.body.webhook_event.room_id;
  const messageId = req.body.webhook_event.message_id;
  const body = req.body.webhook_event.body;  
  const message = body.replace(/\[To:\d+\]和歌botさん/, "");
  
  const command = getCommand(message);
  if (command && commands[command]) {
    await commands[command](body, message, messageId, roomId, fromAccountId);
  } else if (command) {
    await sendchatwork(
      `[rp aid=${fromAccountId} to=${roomId}-${messageId}]\n何そのコマンド。ボク、知らないよ (｡∀゜)\n機能要望だったら、僕じゃなくてわかめに言ってね。`,
      roomId
    );
  } else {
    await sendchatwork(`[rp aid=${fromAccountId} to=${roomId}-${messageId}]\n何かご用でしょうか？使い方が分からない場合[info][code][To:9905801]和歌botさん /help/[/code][/info]と入力、もしくは僕のプロフィールを見て下さい。`, roomId);
  }
  
  res.sendStatus(200);
});
//メッセージ送信
async function sendchatwork(ms, CHATWORK_ROOM_ID) {
  try {
    await axios.post(
      `https://api.chatwork.com/v2/rooms/${CHATWORK_ROOM_ID}/messages`,
      new URLSearchParams({ body: ms }),
      {
        headers: {
          "X-ChatWorkToken": CHATWORK_API_TOKEN,
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );
    console.log("メッセージ送信成功");
  } catch (error) {
    console.error("Chatworkへのメッセージ送信エラー:", error.response?.data || error.message);
  }
}
//コマンド
function getCommand(body) {
  const pattern = /\/(.*?)\//;
  const match = body.match(pattern);
  return match ? match[1] : null;
}

//Help
async function wakamehelp(body, message, messageId, roomId, fromAccountId) {
  await sendchatwork(
    `[rp aid=${fromAccountId} to=${roomId}-${messageId}][info][title]ヘルプ[/title]/help/\nコマンドリストを表示します。\n/quiz/\n和歌がクイズを出題してくれます。[/info]`,
    roomId
  );
}

//クイズ
let quizzes = {};

const quizList = [
  { question: "日本の首都はどこ？", answer: "東京" },
  { question: "推しの子主題歌である「アイドル」のアーティストは誰？", answer: "YOASOBI" },
  { question: "3 + 5 = ？", answer: "8" },
  { question: "太陽系で一番大きな惑星は何ですか？", answer: "木星" },
  { question: "ホロライブを運営している会社はどこ？", answer: ["cover", "COVER", "カバー"] },
  { question: "日本の元号で、平成の前は何ですか？", answer: "昭和" },
  { question: "太陽系で一番大きな惑星は何ですか？", answer: "木星" },
  { question: "太陽系で一番大きな惑星は何ですか？", answer: "木星" },
  { question: "太陽系で一番大きな惑星は何ですか？", answer: "木星" },
  { question: "太陽系で一番大きな惑星は何ですか？", answer: "木星" },
  { question: "太陽系で一番大きな惑星は何ですか？", answer: "木星" },
  { question: "太陽系で一番大きな惑星は何ですか？", answer: "木星" },
  { question: "太陽系で一番大きな惑星は何ですか？", answer: "木星" },
  { question: "太陽系で一番大きな惑星は何ですか？", answer: "木星" },
  { question: "太陽系で一番大きな惑星は何ですか？", answer: "木星" },
  { question: "太陽系で一番大きな惑星は何ですか？", answer: "木星" },
  { question: "太陽系で一番大きな惑星は何ですか？", answer: "木星" },
];

async function startQuiz(body, message, messageId, roomId, fromAccountId) {
  if (quizzes[roomId]) {
    await sendchatwork(`現在クイズが開催中です！終了後に新しいクイズを開始してください。`, roomId);
    return;
  }

  const quiz = quizList[Math.floor(Math.random() * quizList.length)];
  quizzes[roomId] = { question: quiz.question, answer: quiz.answer };
  await sendchatwork(`クイズを開始します！(5秒後にクイズが表示されます)`, roomId);
  await new Promise(resolve => setTimeout(resolve, 5000));
  await sendchatwork(`問題: [info]${quiz.question}[/info]`, roomId);
}

app.post("/quiz", async (req, res) => {
  const message = req.body.webhook_event.body; 
  const messageId = req.body.webhook_event.message_id;
  const roomId = req.body.webhook_event.room_id;
  const AccountId = req.body.webhook_event.account_id;

  if (!quizzes[roomId]) {
    return res.sendStatus(200);
  }

  const currentQuiz = quizzes[roomId];
  const answer = message.trim();

  if (Array.isArray(currentQuiz.answer)) {
    if (currentQuiz.answer.some(ans => ans.toLowerCase() === answer.toLowerCase())) {
      await sendchatwork(`[rp aid=${AccountId} to=${roomId}-${messageId}]\nおみごと！正解です！🎉`, roomId);
      delete quizzes[roomId];
    }
  } else {
    if (answer.toLowerCase() === currentQuiz.answer.toLowerCase()) {
      await sendchatwork(`[rp aid=${AccountId} to=${roomId}-${messageId}]\nおみごと！正解です！🎉`, roomId);
      delete quizzes[roomId];
    }
  }
  res.sendStatus(200);
});