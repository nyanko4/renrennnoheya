const sendchatwork = require("../ctr/message").sendchatwork;
async function nagashi(body, message, messageId, roomId, accountId) {
  if (accountId === 9487124) {
    const extractMatches = (regex) =>
      [...body.matchAll(regex)].map((n) => n[0]);
    const Id = extractMatches(/\d+(?=,)/g);
    const num = extractMatches(/(?<=,)\d+/g);
    while (num){
      
    }
  } else {
    await sendchatwork("botの主以外は使えません", roomId);
  }
}
module.exports = nagashi;
