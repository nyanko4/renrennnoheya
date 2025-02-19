const reqcheck = require('../middleware/sign');


async function getchat(req, res) {
  const c = await reqcheck(req);
  if (c !== "ok") {
    return res.sendStatus(400);
  }

  console.log(req.body);
  const { body, account_id: accountId, room_id: roomId } = req.body.webhook_event;

  if (accountId === 9587322) {
    return res.sendStatus(200);
  }

  //const handlers = [emoji, mention, zalgo, pp];

  //for (const handler of handlers) {
    //if (await handler(body, roomId, accountId) === "ok") {
    //  return res.sendStatus(200);
   // }
 // }

  res.sendStatus(200);
}

module.exports = getchat;