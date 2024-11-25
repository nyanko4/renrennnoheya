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
  "quiz": startQuiz,
  "youtube": getwakametube,
  "bokaro": startbQuiz
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
    `[rp aid=${fromAccountId} to=${roomId}-${messageId}][info][title]ヘルプ[/title]/help/\nコマンドリストを表示します。\n/quiz/\n和歌がクイズを出題してくれます。\n/youtube/\nYouTubeのurlを一緒に送ることでストリームURLを表示してくれます。[/info]`,
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


//ボカロ
const bquizList = [
  { question: "ここに居る理由が欲しかっただけ", answer: "くうになる" },
  { question: "食べてすぐ寝る前に飲む\n起きてまた寝る前に飲む", answer: "可不ェイン" },
  { question: "縁取った怒張に病んでいる\n音で識って雨みたい熱に", answer: "レリギオス" },
  { question: "死ぬまでピュアピュアやってんのん？", answer: "ラビットホール" },
  { question: "見ないで理解出来ないでしょう？", answer: "化けの花" },
  { question: "知っちゃった大嫌いを裏返したとて\nそこに大好きは隠れてないと", answer: "妄想干渉代償連盟" },
  { question: "3つ1つに罪はない\n捨てたものじゃない\nだってそうじゃない？", answer: "QUEEN" },
  { question: "レールの要らない僕らは\n望み好んで夜を追うんだな", answer: "ドーナツホール" },
  { question: "誰か誰か僕を見つけて\nって叫べたら楽になれるのかな", answer: "ハナタバ" },
  { question: "Rainy,rainy 求めるものだけを描いた", answer: "限りなく灰色へ" },
  { question: "正論も常識も　意味を持たないとか都会にサヨウナラ！", answer: "グッバイ宣言" },
  { question: "なんでなんでなんでなんでなんで なんでなの どういうつもり", answer: "ド屑" },
  { question: "お呪いが解けちゃった\n地獄に堕ちて 地獄に堕ちて\n地獄に、堕ちろ。", answer: "お呪い" },
  { question: "さあさあ弱音はミュートして くだらないことで躊躇して", answer: "ヒバナ" },
  { question: "斯く濁った正義へ問う\nあなたの話はつまんないよ", answer: "snooze" },
  { question: "敢えて素知らぬ顔で\n身を任せるのが最適解？", answer: "メズマライザー" },
  { question: "なにもない　なにもない　私なにもない", answer: "ダーリンダンス" },
];

async function startbQuiz(body, message, messageId, roomId, fromAccountId) {
  if (quizzes[roomId]) {
    await sendchatwork(`現在クイズが開催中です！終了後に新しいクイズを開始してください。`, roomId);
    return;
  }

  const quiz = quizList[Math.floor(Math.random() * bquizList.length)];
  quizzes[roomId] = { question: quiz.question, answer: quiz.answer };
  await sendchatwork(`ボカロクイズを開始します！歌詞の一部が表示されるので、曲のタイトルを正しく入力して下さい。(5秒後に表示されます)`, roomId);
  await new Promise(resolve => setTimeout(resolve, 5000));
  await sendchatwork(`問題: [info]${quiz.question}[/info]`, roomId);
}


//youtube
const YOUTUBE_URL = /(?:https?:\/\/)?(?:www\.)?youtu(?:\.be\/|be\.com\/(?:watch\?v=|embed\/|v\/|shorts\/))([\w\-]+)/;

async function getwakametube(body, message, messageId, roomId, fromAccountId) {
  const ms = message.replace(/\s+/g, "");
  const match = ms.match(YOUTUBE_URL);

  if (match) {
    const videoId = match[1];

    try {
      const response = await axios.get(`https://wataamee.glitch.me/api/${videoId}?token=wakameoishi`);
      const videoData = response.data;
      const streamurl = videoData.stream_url;
      await sendchatwork(`[rp aid=${fromAccountId} to=${roomId}-${messageId}]\n${streamurl}`, roomId);
      
    } catch (error) {
      console.error("APIリクエストエラー:", error);
      await sendchatwork(`[rp aid=${fromAccountId} to=${roomId}-${messageId}]\nえらー。あらら。時間をおいてもう一度お試し下さい。ー`, roomId);
    }
  } else {
    await sendchatwork(`[rp aid=${fromAccountId} to=${roomId}-${messageId}]\nURLが無効です。正しいYouTubeのURLを入力してください。`, roomId);
  }
}
