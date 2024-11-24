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
  const message = req.body.webhook_event.body;  
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

function extractCommand(message) {
  const parts = message.split(" ");
  return parts[1];
}


app.listen(PORT, () => {
  console.log(`ボットがポート${PORT}で待機中...`);
});