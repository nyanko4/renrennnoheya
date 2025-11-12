const { blockMember } = require("../ctr/filter");
const { isUserAdmin } = require("../ctr/cwdata");
const { sendchatwork } = require("../ctr/message");

const m = [
  ":)",
  ":D",
  "8-)",
  ":o",
  ";)",
  ";(",
  "(sweat)",
  ":|",
  ":*",
  ":p",
  "(blush)",
  ":^)",
  "|-)",
  "(inlove)",
  "]:)",
  "(talk)",
  "(yawn)",
  "(puke)",
  "(emo)",
  "8-|",
  ":#)",
  "(nod)",
  "(shake)",
  "(^^;)",
  "(whew)",
  "(clap)",
  "(bow)",
  "(roger)",
  "(flex)",
  "(dance)",
  "(:/)",
  "(gogo)",
  "(think)",
  "(please)",
  "(quick)",
  "(anger)",
  "(devil)",
  "(lightbulb)",
  "(*)",
  "(h)",
  "(F)",
  "(cracker)",
  "(eat)",
  "(^)",
  "(coffee)",
  "(beer)",
  "(handshake)",
  "(y)",
];
const zzalgo =
  /[\u0300-\u036F\u1AB0-\u1AFF\u1DC0-\u1DFF\u20D0-\u20FF\uFE20-\uFE2F]/;

//荒らしに対して反応します
async function arashi(body, messageId, roomId, accountId) {
  const isAdmin = await isUserAdmin(accountId, roomId);
  let count = 0;

  m.forEach((emoticon) => {
    const escapedEmoticon = emoticon.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(escapedEmoticon, "g");

    const matches = body.match(regex);

    if (matches) {
      count += matches.length;
    }
  });
  console.log(count);
  if (count >= 30) {
    await blockMember(roomId, accountId, "絵文字");
    return "ok";
  }
  if ((body.match(/\[To:\d+\]/g) || []).length >= 20) {
    await blockMember(roomId, accountId, "[To:〇〇〇〇〇〇]");
    return "ok";
  }
  if (body.match(/\[toall\]/g)) {
    if (!isAdmin) {
      blockMember(roomId, accountId, "toall");
      return "ok";
    }
  if ((body.match(/\[p\D+\d+\]/g) || []).length >= 20) {
    await blockMember(roomId, accountId, "[picon or pname or piconname:〇〇〇〇〇〇]");
    return "ok";
  }
  if ((body.match(/\[hr\]/g) || []).length >= 35) {
    await blockMember(roomId, accountId, "[code][hr][/code]");
    return "ok";
  }

  if ((body.match(/\[preview/g) || []).length >= 5) {
    await blockMember(roomId, accountId, "[preview]");
    return "ok";
  }

  let mojicount = [...body].length;

  if (mojicount >= 2000) {
    if(!isAdmin) {
    await blockMember(roomId, accountId, "文字数多量");
    }
    return "ok";
  }

  let zalgoCount = 0;

  for (let char of body) {
    if (zzalgo.test(char)) {
      zalgoCount++;
    }
  }
  if (zalgoCount >= 500) {
    await blockMember(roomId, accountId, "zalgo");
    return "ok";
  }

  return;
}
module.exports = arashi;
