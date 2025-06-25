const supabase = require("../supabase/client");
const { sendchatwork } = require("../ctr/message");
const { sendername } = require("../ctr/cwdata");

//おみくじ
async function omikuji(body, messageId, roomId, accountId) {
  if (body.match(/^おみくじ$/)) {
    try {
      const { data, error } = await supabase
        .from("おみくじ")
        .select("*")
        .eq("accountId", accountId)
        .single();

      if (error) {
        console.error("Supabaseエラー:", error);
      }

      if (data) {
        await sendchatwork(
          `[rp aid=${accountId} to=${roomId}-${messageId}] おみくじは1日1回までです。`,
          roomId
        );
        //console.log(data);
        return;
      }
      const name = await sendername(accountId, roomId);
      const omikujiResult = await getOmikujiResult();
      const { data: insertData, error: insertError } = await supabase
        .from("おみくじ")
        .insert([
          {
            accountId: accountId,
            結果: omikujiResult,
            名前: name,
          },
        ]);
      console.log(insertData)
      if (insertData === null) {
        await sendchatwork(
          `[rp aid=${accountId} to=${roomId}-${messageId}]\n${omikujiResult}`,
          roomId
        );
      }
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
