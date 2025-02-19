const block = require('../ctr/filter');

const m = [
  ":D", "8-)", ":o", ";)", ";(", "(sweat)", ":|", ":*", ":p", 
  "(blush)", ":^)", "|-)", "(inlove)", "]:)", "(talk)", "(yawn)", 
  "(puke)", "(emo)", "8-|", ":#)", "(nod)", "(shake)", "(^^;)", "(whew)", 
  "(clap)", "(bow)", "(roger)", "(flex)", "(dance)", "(:/)", "(gogo)", 
  "(think)", "(please)", "(quick)", "(anger)", "(devil)", "(lightbulb)", 
  "(*)", "(h)", "(F)", "(cracker)", "(eat)", "(^)", "(coffee)", "(beer)", 
  "(handshake)", "(y)", /\[p\D+\d+\]/, ")", /\[toall\]/, /\[to:\d+\]/
];
//絵文字に対して反応します
async function arashi(body, roomId, accountId) {
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

  return;
}
module.exports = {
  arashi
};