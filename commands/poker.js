const { createClient } = require("@supabase/supabase-js");
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);
const sendchatwork = require("../ctr/message").sendchatwork;
function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

function generateDeck() {
  const suits = ["♣️","♦️","❤️","♠️"];
  const ranks = [
    "2",
    "3",
    "4",
    "5",
    "6",
    "7",
    "8",
    "9",
    "10",
    "J",
    "Q",
    "K",
    "A",
  ];
  const deck = [];

  for (const suit of suits) {
    for (const rank of ranks) {
      deck.push({ rank, suit });
    }
  }

  return deck;
}

function generateHand(deck) {
  return deck.slice(0, 5);
}

function checkHand(hand) {
  const ranks = hand.map((card) => card.rank);
  const suits = hand.map((card) => card.suit);

  const rankCounts = {};
  for (const rank of ranks) {
    rankCounts[rank] = (rankCounts[rank] || 0) + 1;
  }

  const suitCounts = {};
  for (const suit of suits) {
    suitCounts[suit] = (suitCounts[suit] || 0) + 1;
  }

  const sortedRanks = Object.keys(rankCounts).sort((a, b) => {
    if (rankCounts[a] !== rankCounts[b]) {
      return rankCounts[b] - rankCounts[a];
    } else {
      return ranks.indexOf(b) - ranks.indexOf(a);
    }
  });

  const isFlush = Object.values(suitCounts).some((count) => count === 5);
  const isStraight = checkStraight(sortedRanks);

  if (isFlush && isStraight) {
    if (sortedRanks[0] === "A" && sortedRanks[4] === "10") {
      return "ロイヤルストレートフラッシュ";
    } else {
      return "ストレートフラッシュ";
    }
  }

  if (rankCounts[sortedRanks[0]] === 4) {
    return "フォーカード";
  }

  if (rankCounts[sortedRanks[0]] === 3 && rankCounts[sortedRanks[1]] === 2) {
    return "フルハウス";
  }

  if (isFlush) {
    return "フラッシュ";
  }

  if (isStraight) {
    return "ストレート";
  }

  if (rankCounts[sortedRanks[0]] === 3) {
    return "スリーカード";
  }

  if (rankCounts[sortedRanks[0]] === 2 && rankCounts[sortedRanks[1]] === 2) {
    return "ツーペア";
  }

  if (rankCounts[sortedRanks[0]] === 2) {
    return "ワンペア";
  }

  return "ハイカード";
}

function checkStraight(ranks) {
  const rankValues = {
    2: 2,
    3: 3,
    4: 4,
    5: 5,
    6: 6,
    7: 7,
    8: 8,
    9: 9,
    10: 10,
    J: 11,
    Q: 12,
    K: 13,
    A: 14,
  };

  const values = ranks.map((rank) => rankValues[rank]);
  values.sort((a, b) => a - b);

  if (values[4] - values[0] === 4) {
    return true;
  }

  if (
    values[0] === 2 &&
    values[1] === 3 &&
    values[2] === 4 &&
    values[3] === 5 &&
    values[4] === 14
  ) {
    return true; // A, 2, 3, 4, 5 のストレート
  }

  return false;
}

//poker
async function poker(body, message, messageId, roomId, accountId) {
  try {
    if (message.match(/^役$/)) {
      sendchatwork("[preview id=1670380556 ht=200]", roomId);
    } else {
      //pokerのできる回数
      const number = 15
      const today = new Date().toLocaleDateString("ja-JP", {
        timeZone: "Asia/Tokyo",
      });
      const { datas,  error } = await supabase
        .from("poker")
        .select("*")
        .eq("accountId", accountId);
      if (error) {
        console.error("Supabaseエラー:", error);
      }
      let numbers = "";
      datas.forEach((person) => {
        numbers += person.number;
      });
      if (datas && numbers <= 15) {
        await sendchatwork(
          `[rp aid=${accountId} to=${roomId}-${messageId}] pokerは1日${number}回までです。`,
          roomId
        );
        console.log(data);
        return;
      }
      const { data } = await supabase
        .from("poker")
        .select("*")
        .eq("accountId", accountId);
      let count = "";
      data.forEach((person) => {
        count += person.number;
      });
      const n = Number(count) + 1;
      const { data: insertData, error: insertError } = await supabase
        .from("poker")
        .upsert([
          {
            accountId: accountId,
            roomId: roomId,
            number: n,
            today: today,
          },
        ]);
      if (insertError) {
        console.error("Supabase保存エラー:", insertError);
      } else {
        console.log("保存されました:", insertData);
      }
      const deck = generateDeck();
      const shuffledDeck = shuffle(deck);

      // シャッフルされたデッキから手札を生成
      const hand = generateHand(shuffledDeck);

      // 手札の役を判定
      const result = checkHand(hand);
      const handString = hand.map(card => `${card.suit}${card.rank}`).join(', ');
      // 結果を表示
      console.log(hand);
      console.log(result);
      sendchatwork(`[rp aid=${accountId} to=${roomId}-${messageId}][pname:${accountId}] さん\n${handString}\n${result}`, roomId);
    }
  } catch (error) {
    console.error("poker", error);
  }
}
module.exports = poker;
