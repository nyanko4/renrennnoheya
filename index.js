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
const { createClient } = require('@supabase/supabase-js');
const { DateTime } = require('luxon');

const PORT = 3000;

app.use(bodyParser.json());

const CHATWORK_API_TOKEN = process.env.CHATWORK_API_TOKEN;
const geminiAPIKey = process.env.GEMINI_API;
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY; 
const supabase = createClient(supabaseUrl, supabaseKey);

//コマンドリスト
const commands = {
  "help": wakamehelp,
  "youtube": getwakametube,
  "ai": generateAI,
  "say": say,
  "おみくじ": omikuji,
  "save": save,
  "delete": deleteData,
  "setting": Settings
};

app.get('/', (req, res) => {
    res.sendStatus(200);
});
//エンドポイント
app.post("/webhook", async (req, res) => {
  const accountId = req.body.webhook_event.from_account_id;
  const roomId = req.body.webhook_event.room_id;
  const messageId = req.body.webhook_event.message_id;
  const body = req.body.webhook_event.body;  
  const message = body.replace(/\[To:\d+\]ゆずbotさん|\/.*?\/|\s+/g, "");
  
  const tooms = body.replace(/\[To:\d+\]ゆずbotさん|\/.*?\//g, "");
  if (tooms === body) {
    return res.sendStatus(200);
  }
  const sendername = await getSenderName(accountId, roomId);
  const command = getCommand(body);
  if (command && commands[command]) {
    await commands[command](body, message, messageId, roomId, accountId, sendername);
  } else if (command) {
    await sendchatwork(
      `[rp aid=${accountId} to=${roomId}-${messageId}]${sendername}さん\n存在しないコマンドです`,
      roomId
    );
  } else {
    await sendchatwork(`[rp aid=${accountId} to=${roomId}-${messageId}]${sendername}さん\nこんにちはー。`, roomId);
  }
  
  res.sendStatus(200);
});
//全てのメッセージを受け取ります
app.post("/getchat", async (req, res) => {
  console.log(req.body);

  const body = req.body.webhook_event.body;
  const message = req.body.webhook_event.body;
  const accountId = req.body.webhook_event.account_id;
  const roomId = req.body.webhook_event.room_id;
  const messageId = req.body.webhook_event.message_id;
  const sendername = await getSenderName(accountId, roomId);
  
  if (accountId === 9884448) {
    return res.sendStatus(200);
  }
  
  if (body.includes("[To:9884448]")) {
    return res.sendStatus(200);
  }
  
  if (message === "おみくじ") {
    await omikuji(body, message, messageId, roomId, accountId, sendername);
    return res.sendStatus(200);
  }

  const { data, error } = await supabase
    .from('text')
    .select('triggerMessage, responseMessage')
    .eq('roomId', roomId);

  if (error) {
    console.error('Supabaseエラー:', error);
    return res.sendStatus(500);
  }

  const matchedData = data.find(item => message === item.triggerMessage);

  if (matchedData) {
    const responseMessage = matchedData.responseMessage;

    await sendchatwork(`[rp aid=${accountId} to=${roomId}-${messageId}]${sendername}さん\n${responseMessage}`, roomId);

    return res.sendStatus(200);
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

//利用者データ取得
async function getChatworkMembers(roomId) {
  try {
    const response = await axios.get(
      `https://api.chatwork.com/v2/rooms/${roomId}/members`,
      {
        headers: {
          "X-ChatWorkToken": CHATWORK_API_TOKEN,
        },
      }
    );

    const members = response.data;
    return members;
  } catch (error) {
    console.error(
      "Error fetching Chatwork members:",
      error.response?.data || error.message
    );
    return null;
  }
}

async function getSenderName(accountId, roomId) {
  const members = await getChatworkMembers(roomId);
  console.log(members);
  if (members) {
    const sender = members.find((member) => member.account_id === accountId);
    return sender ? sender.name : "名前を取得できませんでした";
  }
  return "chatworkユーザー";
}

//管理者ですか？
async function isUserAdmin(accountId, roomId) {
  try {
    const response = await axios.get(`https://api.chatwork.com/v2/rooms/${roomId}/members`, {
      headers: {
        'X-ChatWorkToken': CHATWORK_API_TOKEN
      }
    });
    const member = response.data.find(m => m.account_id === accountId);

    if (member && member.role === 'admin') {
      return true;
    } else {
      return false;
    }
  } catch (error) {
    console.error('エラーが発生しました:', error);
    return false;
  }
}

//Help
async function wakamehelp(body, message, messageId, roomId, accountId, sendername) {
  await sendchatwork(
    `[rp aid=${accountId} to=${roomId}-${messageId}]${sendername}さん[info][title]ヘルプ[/title]/help/\nコマンドリストを表示します。\n/youtube/\nYouTubeのurlを一緒に送ることでストリームURLを表示してくれます。\n/ai/\nAIと一緒におはなし出来ます。[/info]`,
    roomId
  );
}

//youtube
const YOUTUBE_URL = /(?:https?:\/\/)?(?:www\.)?youtu(?:\.be\/|be\.com\/(?:watch\?v=|embed\/|v\/|shorts\/))([\w\-]+)/;

async function getwakametube(body, message, messageId, roomId, accountId, sendername) {
  const ms = message.replace(/\s+/g, "");
  const match = ms.match(YOUTUBE_URL);

  if (match) {
    const videoId = match[1];

    try {
      const response = await axios.get(`https://wataamee.glitch.me/api/${videoId}?token=wakameoishi`);
      const videoData = response.data;
      const streamurl = videoData.stream_url;
      await sendchatwork(`[rp aid=${accountId} to=${roomId}-${messageId}]\n${streamurl}`, roomId);
      
    } catch (error) {
      console.error("APIリクエストエラー:", error);
      await sendchatwork(`[rp aid=${accountId} to=${roomId}-${messageId}]${sendername}さん\nえらー。あらら。時間をおいてもう一度お試し下さい。ー`, roomId);
    }
  } else {
    await sendchatwork(`[rp aid=${accountId} to=${roomId}-${messageId}]${sendername}さん\nURLが無効です。正しいYouTubeのURLを入力してください。`, roomId);
  }
}

//gemini
async function generateAI(body, message, messageId, roomId, accountId, sendername) {
  try {
    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${geminiAPIKey}`,
      {
        contents: [
          {
            parts: [
              {
                text: message,
              },
            ],
          },
        ],
      },
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    const responseContent = response.data.candidates[0].content;
    let responseParts = responseContent.parts.map((part) => part.text).join("\n");
    responseParts = responseParts.replace(/\*/g, "");

    await sendchatwork(`[rp aid=${accountId} to=${roomId}-${messageId}]${sendername}さん\n${responseParts}`, roomId);
  } catch (error) {
    console.error('エラーが発生しました:', error.response ? error.response.data : error.message);

    await sendchatwork(`[rp aid=${accountId} to=${roomId}-${messageId}]${sendername}さん\nエラーが発生しました。`, roomId);
  }
}

//say
async function say(body, message, messageId, roomId, accountId, sendername) {
    sendchatwork(message, roomId);
}

//おみくじ
async function omikuji(body, message, messageId, roomId, accountId, sendername) {
    const results = [
        { fortune: "ゆず！" },
        { fortune: "極大吉" },
        { fortune: "超大吉" },
        { fortune: "大吉" },
        { fortune: "中吉" },
        { fortune: "小吉" },
        { fortune: "末吉" },
        { fortune: "凶" },
        { fortune: "大凶" },
        { fortune: "---深刻なエラーが発生しました---" }
    ];

    const probabilities = [
        { fortuneIndex: 0, probability: 0.003 },
        { fortuneIndex: 1, probability: 0.10 },
        { fortuneIndex: 2, probability: 0.10 },
        { fortuneIndex: 3, probability: 0.40 },
        { fortuneIndex: 4, probability: 0.10 },
        { fortuneIndex: 5, probability: 0.08 },
        { fortuneIndex: 6, probability: 0.07 },
        { fortuneIndex: 7, probability: 0.07 },
        { fortuneIndex: 8, probability: 0.07 },
        { fortuneIndex: 9, probability: 0.007 }
    ];
  
    const today = DateTime.now().setZone('Asia/Tokyo').toFormat('yyyy-MM-dd');
  
    const { data, error } = await supabase
        .from('omikuji_log')
        .select('*')
        .eq('accountId', accountId)
        .eq('date', today)
        .single();

    if (error) {
        console.error('Supabaseエラー:', error);
    }

    if (data) {
        const ms = `[rp aid=${accountId} to=${roomId}-${messageId}]${sendername}さん\n今日はもうおみくじを引いています！明日また挑戦してね！`;
        sendchatwork(ms, roomId);
        return;
    }

    const rand = Math.random();
    let cumulativeProbability = 0;
    let resultIndex = 0;

    for (const prob of probabilities) {
        cumulativeProbability += prob.probability;
        if (rand < cumulativeProbability) {
            resultIndex = prob.fortuneIndex;
            break;
        }
    }

    const result = results[resultIndex];
    const ms = `[rp aid=${accountId} to=${roomId}-${messageId}]${sendername}さん\n${result.fortune}`;
    const { data: insertData, error: insertError } = await supabase
        .from('omikuji_log')
        .insert([
            { accountId: accountId, date: today}
        ]);
    sendchatwork(ms, roomId);

    if (insertError) {
        console.error('Supabase保存エラー:', insertError);
    } else {
        console.log('おみくじ結果が保存されました:', insertData);
    }
}

//トリガー保存
async function save(body, message, messageId, roomId, accountId, sendername) {
  
  const match = message.match(/^([^「]+)「(.+)」$/);
  const triggerMessage = match[1];
  const responseMessage = match[2];
  
  if (!match) {
    await sendchatwork(`[rp aid=${accountId} to=${roomId}-${messageId}]${sendername}さん\n構文エラー`, roomId);
    return;
  }
  
  const isAdmin = await isUserAdmin(accountId, roomId);

  if (!isAdmin) {
    await sendchatwork(`[rp aid=${accountId} to=${roomId}-${messageId}]${sendername}さん\nエラー: この操作は管理者にしか行えません。`, roomId);
    return;
  }
  
  const { data, error } = await supabase
    .from('text')
    .insert([
      { roomId: roomId,
        triggerMessage: triggerMessage,
        responseMessage: responseMessage 
      }
    ]);

  if (error) {
    await sendchatwork(`[rp aid=${accountId} to=${roomId}-${messageId}]${sendername}さん\nデータを保存できませんでした`, roomId);
  } else {
    await sendchatwork(`[rp aid=${accountId} to=${roomId}-${messageId}]${sendername}さん\nデータを保存しました！`, roomId);
  }
}

//トリガー削除
async function deleteData(body, triggerMessage, messageId, roomId, accountId, sendername) {
  
  const isAdmin = await isUserAdmin(accountId, roomId);

  if (!isAdmin) {
    await sendchatwork(`[rp aid=${accountId} to=${roomId}-${messageId}]${sendername}さん\nエラー: この操作は管理者にしか行えません。`, roomId);
    return;
  }
  
  const { data, error } = await supabase
    .from('text')
    .delete()
    .eq('roomId', roomId)
    .eq('triggerMessage', triggerMessage);

  if (error) {
    await sendchatwork(`[rp aid=${accountId} to=${roomId}-${messageId}]${sendername}さん\n削除しようとしているデータが見つかりません。settingコマンドを使って保存中のデータを閲覧できます。`, roomId);
  } else {
    await sendchatwork(`[rp aid=${accountId} to=${roomId}-${messageId}]${sendername}さん\n削除しました`, roomId);
  }
}

//設定閲覧
async function Settings(body, triggerMessage, messageId, roomId, accountId, sendername) {
  const { data, error } = await supabase
    .from('text')
    .select('triggerMessage, responseMessage')
    .eq('roomId', roomId);

  if (error) {
    console.error('設定取得エラー:', error);
  } else {
    if (data.length === 0) {
      await sendchatwork(`[rp aid=${accountId} to=${roomId}-${messageId}]${sendername}さん\nこのルームに設定されたメッセージはありません`, roomId);
    } else {
      let messageToSend = `[rp aid=${accountId} to=${roomId}-${messageId}]${sendername}さん[info][title]設定されたメッセージ[/title]`;
      data.forEach(item => {
        messageToSend += `${item.triggerMessage} - ${item.responseMessage}\n`;
      });
      
      messageToSend += "[/info]"
      await sendchatwork(messageToSend, roomId);
    }
  }
}