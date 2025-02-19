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
//絵文字に対して反応します
async function emoji(body, roomId, accountId) {
    let count = 0;
    const bodyChars = [...body];

    bodyChars.forEach(char => {
        if (m.includes(char)) {
            count++;
        }
    });
    console.log("emoji", count)
    if (count >= 30) {
        block.blockMember(roomId, accountId);
        return "ok";
    } 
    if ((body.match(/\)/g) || []).length >= 30) {
      block.blockMember(roomId, accountId);
      return "ok";
    }
    
  return;
}
//メンションに対して反応します
async function to(body, roomId, accountId) {
  if ((body.match(/toall/g) || []).length >= 10) {
    await block.blockMember(roomId, accountId);
    return "ok";
  }
  if ((body.match(/To:/g) || []).length >= 35) {
     await block.blockMember(roomId, accountId);
     return "ok";
  }
  return;
};
module.exports = {
  emoji,
  to
};