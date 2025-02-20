const sendchatwork = require("../ctr/message").sendchatwork;
const cwdata = require("../ctr/cwdata")
async function randommember(body, message, messageId, roomId, accountId) {
  try {
    const members = await cwdata.getChatworkMembers(roomId);

    if (!members || members.length === 0) {
      return;
    }

    const randomIndex = Math.floor(Math.random() * members.length);
    const randomMember = members[randomIndex];

    await sendchatwork(
      `[rp aid=${accountId} to=${roomId}-${messageId}][pname:${accountId}]さん\n[piconname:${randomMember.account_id}]さんが選ばれました！`,
      roomId
    );
  } catch (error) {
    await sendchatwork(
      `[rp aid=${accountId} to=${roomId}-${messageId}][pname:${accountId}]さん\nエラー`,
      roomId
    );
  }
}
module.exports = randommember