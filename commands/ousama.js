const cwdata = require("../ctr/cwdata")
async function ousamagame(body, message, messageId, roomId, accountId) {
  try {
    const members = await cwdata.getChatworkMembers(roomId);
    
  } catch(error) {
    console.error("error", error)
  }
}