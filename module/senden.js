const block = require("../ctr/filter");
const isAdmin = require("../ctr/cwdata").isUserAdmin;
const sendchatwork = require("../ctr/message").sendchatwork;
async function senden(body, messageId, roomId, accountId) {
  try {
        if (body.match(/\www.chatwork.com\/g/g)) {
      await sendenkinshi(body, messageId, roomId, accountId);
    }
    if (body.match(/\www.chatwork.com\/#!join/g)) {
      await sendenkinshi(body, messageId, roomId, accountId);
    }
    if (body.match(/\https:\/\/odaibako.net\/u/g)) {
      await sendenkinshi(
        body,
        message,
        messageId,
        roomId,
        accountId,
        sendername
      );
    }
    if (body.match(/\https:\/\/scratch.mit.edu/g)) {
      await sendenkinshi(
        body,
        message,
        messageId,
        roomId,
        accountId,
        sendername
      );
    }
    if (body.match(/\https:\/\/padlet.com/g)) {
      await sendenkinshi(body,messageId,roomId,accountId)
    }
  } catch (error) {
    console.error("エラー※宣伝", error)
  }
}