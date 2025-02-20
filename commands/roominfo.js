const axios = require("axios")
const CHATWORK_API_TOKEN_N = process.env.CWapitoken2
const sendchatwork = require("../ctr/message").sendchatwork
const cwdata = require("../ctr/cwdata")

async function roominfo(body, message, messageId, roomId, accountId) {
  try {
    const room = message.match(/\d+/g);
    const members = await cwdata.getChatworkMembers(room);
    let admin = [];
    members.forEach((member) => {
      if (member.role === "admin") {
        admin.push(`[picon:${member.account_id}]`);
      }
    });
    let admins = admin.join("");
    const response = await axios.get(
      `https://api.chatwork.com/v2/rooms/${room}`,
      {
        headers: {
          "X-ChatWorkToken": CHATWORK_API_TOKEN_N,
        },
      }
    );
    if(response.data.type === "group") {
    await sendchatwork(
      `[info][title]room情報[/title]部屋名: ${response.data.name}\nメンバー数: ${members.length}人\nメッセージ数: ${response.data.message_num}件\nファイル数: ${response.data.file_num}個\n[info][title]管理者[/title]${admins}[/info][/info]`,
      roomId
    );
    } else {
      sendchatwork("エラーが発生しました", roomId)
    }
    } catch (error) {
    console.error("error:", error);
    await sendchatwork(`エラーが発生しました: ${error}`,  roomId);
  }
}
module.exports = roominfo