const axios = require('axios');

const CHATWORK_API_TOKEN = process.env.CWapitoken;

async function isUserAdmin(accountId, roomId) {
  try {
    const response = await axios.get(`https://api.chatwork.com/v2/rooms/${roomId}/members`, {
      headers: {
        accept: 'application/json',
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

module.exports = {
    getChatworkMembers,
    isUserAdmin
};