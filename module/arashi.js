const block = require('../ctr/filter');

const m = [
  ":D", "8-)", ":o", ";)", ";(", "(sweat)", ":|", ":*", ":p", 
  "(blush)", ":^)", "|-)", "(inlove)", "]:)", "(talk)", "(yawn)", 
  "(puke)", "(emo)", "8-|", ":#)", "(nod)", "(shake)", "(^^;)", "(whew)", 
  "(clap)", "(bow)", "(roger)", "(flex)", "(dance)", "(:/)", "(gogo)", 
  "(think)", "(please)", "(quick)", "(anger)", "(devil)", "(lightbulb)", 
  "(*)", "(h)", "(F)", "(cracker)", "(eat)", "(^)", "(coffee)", "(beer)", 
  "(handshake)", "(y)"
];
//荒らしに対して反応します
async function arashi(body, roomId, accountId) {
    let count = 0;
    const bodyChars = [...body];

    bodyChars.forEach(char => {
        if (m.includes(char)) {
            count++;
        }
    });
    console.log("arashi", count)
    if (count >= 20) {
        block.blockMember(roomId, accountId);
        return "ok";
    } 

  return;
}
const zzalgo = /[\u0300-\u036F\u1AB0-\u1AFF\u1DC0-\u1DFF\u20D0-\u20FF\uFE20-\uFE2F]/;

async function zalgo(body, roomId, accountId) {
  let zalgoCount = 0;

  for (let char of body) {
    if (zzalgo.test(char)) {
      zalgoCount++;
    }
  }
  console.log("zalgo", zalgoCount)
  if (zalgoCount >= 500) {
    await block.blockMember(roomId, accountId);
    return "ok";
  }
  
  return;
};
module.exports = {
  arashi,
  zalgo
};