const axios = require("axios")
const CHATWORK_API_TOKEN_N = process.env.CWapitoken2
//最新メッセージのリンクを取得する
async function messagelink(body, message, messageId, roomId, accountId) {
  try {
    const room = message.match(/\d+/g);
    const name = await axios.get(`https://api.chatwork.com/v2/rooms/${room}`, {
      headers: {
        "X-ChatWorkToken": CHATWORK_API_TOKEN_N,
      },
    });
    const response = await axios.get(
      `https://api.chatwork.com/v2/rooms/${room}/messages?force=1`,
      {
        headers: {
          "X-ChatWorkToken": CHATWORK_API_TOKEN_N,
        },
      }
    );
    const messageId = response.data
      .slice()
      .reverse()
      .find((messageid) => messageid.message_id > 0);
    await sendchatwork(
      `部屋名: ${name.data.name} メッセージリンク: https://www.chatwork.com/#!rid${room}-${messageId.message_id}`,
      roomId
    );
  } catch (error) {
    console.error("error:", error);
    await sendchatwork("エラーが起きました", roomId);
  }
}