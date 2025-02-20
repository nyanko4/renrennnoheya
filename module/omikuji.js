const { createClient } = require("@supabase/supabase-js");
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);
const { DateTime } = require("luxon");
const sendchatwork = require("../ctr/message").sendchatwork;
//おみくじ
async function omikuji(body, messageId, roomId, accountId) {
  if (body.match(/^おみくじ$/)) {
    try {
      const today = new Date().toLocaleDateString("ja-JP", {
        timeZone: "Asia/Tokyo",
      });
      const { data, error } = await supabase
        .from("おみくじ")
        .select("*")
        .eq("accountId", accountId)
        .eq("roomId", roomId)
        .eq("today", today)
        .single();

      if (error) {
        console.error("Supabaseエラー:", error);
      }

      if (data) {
        await sendchatwork(
          `[rp aid=${accountId} to=${roomId}-${messageId}] おみくじは1日1回までです。`,
          roomId
        );
        console.log(data);
        return;
      }

      const omikujiResult = getOmikujiResult();
      const { data: insertData, error: insertError } = await supabase
        .from("おみくじ")
        .insert([
          {
            accountId: accountId,
            roomId: roomId,
            today: today,
            結果: omikujiResult,
          },
        ]);
      await sendchatwork(
        `[rp aid=${accountId} to=${roomId}-${messageId}]\n${omikujiResult}`,
        roomId
      );

      if (insertError) {
        console.error("Supabase保存エラー:", insertError);
      } else {
        console.log("おみくじ結果が保存されました:", insertData);
      }
      function getOmikujiResult() {
        const random = Math.random() * 100;
        if (random < 5) return "大凶";
        //5
        else if (random < 25) return "小吉";
        //20
        else if (random < 42.3) return "末吉";
        //17.3
        else if (random < 62.3) return "吉";
        //20
        else if (random < 77.3) return "中吉";
        //15
        else if (random < 87.3) return "凶";
        //10
        else if (random < 87.4) return "願い事叶えたるよ(できることだけ)";
        //0.1
        else return "大吉";
        //12.6
      }
    } catch (error) {
      console.error(
        "エラー:",
        error.response ? error.response.data : error.message
      );
    }
  }
}

module.exports = omikuji;