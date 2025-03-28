const axios = require("axios");
const CHATWORK_API_TOKEN = process.env.CWapitoken;
//メッセージを送信
async function sendchatwork(ms, roomId) {
  try {
    await axios.post(
      `https://api.chatwork.com/v2/rooms/${roomId}/messages`,
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
    console.error(
      "Chatworkへのメッセージ送信エラー:",
      error.response?.data || error.message
    );
  }
}
//メッセージを削除
async function deleteMessages(body, messageId, roomId, accountId) {
  const dlmessageIds = [...body.matchAll(/(?<=to=\d+-)(\d+)/g)].map(
    (match) => match[0]
  );

  if (dlmessageIds.length === 0) {
    return;
  }
  for (let i = 0; i < dlmessageIds.length; i++) {
    const messageId = dlmessageIds[i];
    const url = `https://api.chatwork.com/v2/rooms/${roomId}/messages/${messageId}`;

    try {
      const response = await axios.delete(url, {
        headers: {
          Accept: "application/json",
          "x-chatworktoken": CHATWORK_API_TOKEN,
        },
      });
    } catch (err) {
      console.error(
        `メッセージID ${messageId} の削除中にエラーが発生しました:`,
        err.response ? err.response.data : err.message
      );
    }
  }
}

async function deleteMessage(body, messageId, roomId, accountId) {
  const url = `https://api.chatwork.com/v2/rooms/${roomId}/messages/${messageId}`;

  try {
    const response = await axios.delete(url, {
      headers: {
        Accept: "application/json",
        "x-chatworktoken": CHATWORK_API_TOKEN,
      },
    });
  } catch (err) {
    console.error(
      `メッセージID ${messageId} の削除中にエラーが発生しました:`,
      err.response ? err.response.data : err.message
    );
  }
}

//メッセージに既読をつける
async function readmessage(roomId, messageId) {
  try {
    await axios.put(
      `https://api.chatwork.com/v2/rooms/${roomId}/messages/read`,
      new URLSearchParams({ message_id: messageId }),
      {
        headers: {
          "X-ChatWorkToken": CHATWORK_API_TOKEN,
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );
    console.log("既読をつけました");
  } catch (error) {
    console.error(
      "既読がつけれませんでした:",
      error.response?.data || error.message
    );
  }
}

module.exports = {
  sendchatwork,
  deleteMessages,
  readmessage,
};
