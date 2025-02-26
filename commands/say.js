const isUserAdmin = require("../ctr/cwdata").isUserAdmin;
const sendchatwork = require("../ctr/message").sendchatwork;
//say
async function displaysay(body, message, messageId, roomId, accountId) {
  try {
    const isAdmin = isUserAdmin(accountId, roomId);
    const m = body.replace("/say/", "");
    if (!isAdmin) {
      sendchatwork(m, roomId);
    } else {
      sendchatwork("管理者のみ利用可能です", roomId);
    }
  } catch (error) {
    console.error("errorが発生しました", error);
  }
}
module.exports = displaysay;
