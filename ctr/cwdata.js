const axios = require("axios");

const CHATWORK_API_TOKEN = process.env.CWapitoken;
const CHATWORK_API_TOKEN_N = process.env.CWapitoken2;

async function isUserAdmin(accountId, roomId) {
  try {
    const response = await axios.get(
      `https://api.chatwork.com/v2/rooms/${roomId}/members`,
      {
        headers: {
          accept: "application/json",
          "X-ChatWorkToken": CHATWORK_API_TOKEN,
        },
      }
    );
    const member = response.data.find((m) => m.account_id === accountId);

    if (member && member.role === "admin") {
      return true;
    } else {
      return false;
    }
  } catch (error) {
    console.error("エラーが発生しました:", error);
    return false;
  }
}

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

async function getChatworkMembers2(roomId) {
  try {
    const response = await axios.get(
      `https://api.chatwork.com/v2/rooms/${roomId}/members`,
      {
        headers: {
          "X-ChatWorkToken": CHATWORK_API_TOKEN_N,
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

async function sendername(accountId, roomId) {
  const members = await getChatworkMembers(roomId);
  if (members) {
    const sender = members.find((member) => member.account_id === accountId);
    return sender ? sender.name : "名前を取得できませんでした";
  }
  return "chatworkユーザー";
}

async function fileurl(body, roomId) {
  try {
    const match = body.match(/download:(\d+)/);
    const fileId = match[1];
    const response = await axios.get(
      `https://api.chatwork.com/v2/rooms/${roomId}/files/${fileId}?create_download_url=1`,
      {
        headers: {
          accept: "application/json",
          "X-ChatWorkToken": CHATWORK_API_TOKEN,
        },
      }
    );
    const downloadurl = response.data.download_url;
    const filename = response.data.filename;

    return { fileurl: downloadurl, filename: filename };
  } catch (error) {
    console.error("エラーが発生しました:", error);
    return false;
  }
}

module.exports = {
  getChatworkMembers,
  getChatworkMembers2,
  isUserAdmin,
  sendername,
  fileurl,
};
