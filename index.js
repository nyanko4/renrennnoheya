const express = require("express");
const axios = require('axios');
const bodyParser = require("body-parser");

const app = express();
const PORT = 3000;

app.use(bodyParser.json());

const CHATWORK_API_TOKEN = process.env.CHATWORK_API_TOKEN;

const commands = {

};

app.get('/', (req, res) => {
    res.sendStatus(200);
});

app.post("/webhook", async (req, res) => {
  const fromAccountId = req.body.webhook_event.from_account_id;
  const roomId = req.body.webhook_event.room_id;
  const messageId = req.body.webhook_event.message_id;
  const body = req.body.webhook_event.body;  
  const message = body.replace(/\[To:\d+\]和歌botさん/, "");
  
  const command = getCommand(message);
  if (command && commands[command]) {
    await commands[command](roomId, fromAccountId);
  } else if (command) {
    await sendchatwork(
      `[rp aid=${fromAccountId} to=${roomId}-${messageId}] コマンド「${command}」は認識されませんでした。🙇‍♂️` +
      "\n利用可能なコマンドを確認するには、[info][To:9905801]和歌botさん /help/[/info] と入力してください。",
      roomId
    );
  } else {
    await sendchatwork(
　     await sendchatwork(`[rp aid=${fromAccountId} to=${roomId}-${messageId}] 何かご用でしょうか？使い方が分からない場合[info][To:9905801]和歌botさん /help/[/info]と入力してみて下さい。`, roomId);
      roomId
    );
  }
  
  res.sendStatus(200);
});


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

function getCommand(body) {
  const pattern = /\/(.*?)\//;
  const match = body.match(pattern);
  return match ? match[1] : null;
}


app.listen(PORT, () => {
  console.log(`ボットがポート${PORT}で待機中...`);
});