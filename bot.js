"use strict";
const express = require("express");
const app = express();
const compression = require("compression");
const CronJob = require("cron").CronJob;
const { DateTime } = require("luxon");
const CHATWORK_API_TOKEN = process.env.CHATWORK_API_TOKEN;
const CHATWORK_API_TOKEN_N = process.env.CHATWORK_API_TOKEN_N;
app.listen(3000, () => {
  console.log(`Worker ${process.pid} started`);
});
new CronJob(
  "0 0 0 * * *",
  async () => {
    const date = DateTime.now().setZone("Asia/Tokyo").toFormat("yyyy年MM月dd");
    rennyan(
      `
      れんにゃん誕生日おめでとう！/n
      日付変更　今日は${date}日です`,
      374987857
    );
    rennyan("れんにゃん誕生日おめでとう！", 364321548);
    rennyan("れんにゃん誕生日おめでとう！", 364295891);
    const { data, error } = await supabase
      .from("おみくじ")
      .delete()
      .neq("accountId", 0);
  },
  null,
  true,
  "Asia/Tokyo"
);
const axios = require("axios");
const bodyParser = require("body-parser");
const { createClient } = require("@supabase/supabase-js");
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);
const PORT = 3000;
app.use(bodyParser.json());

async function rennyan(ms, roomId) {
  try {
    await axios.post(
      `https://api.chatwork.com/v2/rooms/${roomId}/messages`,
      new URLSearchParams({ body: ms }),
      {
        headers: {
          "X-ChatWorkToken": CHATWORK_API_TOKEN_N,
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );

    console.log("メッセージ送信成功");
  } catch (error) {
    console.error(
      "Chatworkへのメッセージ送信エラー:",
      error.response?.data || error.message
    );
  }
}
const zalgo =
  /[\u0300-\u036F\u1AB0-\u1AFF\u1DC0-\u1DFF\u20D0-\u20FF\uFE20-\uFE2F]/;
const commands = {
  おみくじ: Toomikuji,
  messagecount: messagecount,
  messagelink: messagelink,
  dice: diceroll,
  say: displaysay,
  omikuji: omikujiresult,
  list: blacklist,
  poker: poker,
  proxyget: proxyget,
  proxyset: proxyset,
  proxydelete: proxydelete,
};
app.get("/", (req, res) => {
  res.sendStatus(200);
});
//全てのメッセージを受け取ります
app.post("/getchat", async (req, res) => {
  console.log(req.body);
  const body = req.body.webhook_event.body;
  const message = body.replace(/\/.*?\/|\s+/g, "");
  const accountId = req.body.webhook_event.account_id;
  const roomId = req.body.webhook_event.room_id;
  const messageId = req.body.webhook_event.message_id;
  const sendername = await getSenderName(accountId, roomId);
  const isAdmin = await isUserAdmin(accountId, roomId);
  const today = DateTime.now().setZone("Asia/Tokyo").toFormat("yyyy-MM-dd");
  //メッセージを保存
  const { data, error } = await supabase.from("nyankoのへや").insert({
    messageId: messageId,
    message: message,
    accountId: accountId,
    name: sendername,
    date: today,
  });
  if (accountId == 9587322) {
    res.sendStatus(200);
  } else {
    const command = getCommand(body);
    if (command && commands[command]) {
      await commands[command](body, message, messageId, roomId, accountId);
    } else if (command) {
      return res.sendStatus(200);
    }
    //ここに荒らしだと思われるメッセージの検出
    if ((body.match(/\)/g) || []).length >= 20) {
      await blockMembers(
        body,
        message,
        messageId,
        roomId,
        accountId,
        sendername
      );
    }
    if ((body.match(/\*/g) || []).length >= 20) {
      await blockMembers(
        body,
        message,
        messageId,
        roomId,
        accountId,
        sendername
      );
    }
    if ((body.match(/\[To:\d+\]/g) || []).length >= 15) {
      await blockMembers(
        body,
        message,
        messageId,
        roomId,
        accountId,
        sendername
      );
    }
    const zalgoCount = (body.match(zalgo) || []).length;
    if (zalgoCount >= 18) {
      await blockMembers(
        body,
        message,
        messageId,
        roomId,
        accountId,
        sendername
      );
      return res.sendStatus(200);
    }
    if (body.match(/\[toall\]/g)) {
      if (!isAdmin) {
        await blockMembers(
          body,
          message,
          messageId,
          roomId,
          accountId,
          sendername
        );
      } else {
        sendchatwork(
          "管理者がtoallを使用しました。見逃してあげてください()",
          roomId
        );
      }
    }
    //参加
    if (body.match(/\[dtext:chatroom_added]/g)) {
      await welcome(body, message, messageId, roomId, sendername);
    }
    //おみくじ
    if (body.match(/^おみくじ$/)) {
      await omikuji(body, message, messageId, roomId, accountId);
    }
    if (body.match(/^now$/i)) {
      await displaynow(body, message, messageId, roomId, accountId);
    }
    //宣伝感知
    if (body.match(/\https:\/\/www.chatwork.com\/g/g)) {
      await sendenkinshi(
        body,
        message,
        messageId,
        roomId,
        accountId,
        sendername
      );
    }
    if (body.match(/\https:\/\/odaibako.net/g)) {
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
      await sendenkinshi(
        body,
        message,
        messageId,
        roomId,
        accountId,
        sendername
      );
    }
    res.sendStatus(200);
  }
});

function getCommand(body) {
  const pattern = /\/(.*?)\//;
  const match = body.match(pattern);
  return match ? match[1] : null;
}
//メンションされたら起動する
app.post("/mention", async (req, res) => {
  console.log(req.body);

  const accountId = req.body.webhook_event.from_account_id;
  const roomId = req.body.webhook_event.room_id;
  const messageId = req.body.webhook_event.message_id;
  const body = req.body.webhook_event.body;
  const message = req.body.webhook_event.body;
  const isAdmin = await isUserAdmin(accountId, roomId);
  await messageread(messageId, roomId);
  if (body.includes("削除")) {
    if (!isAdmin) {
      sendchatwork("管理者のみ利用可能です", roomId);
    } else {
      await deletemessage(body, message, messageId, roomId, accountId);
      return res.sendStatus(200);
    }
  }
  if (body.includes("member")) {
    await randommember(body, message, messageId, roomId, accountId);
  }
  if (body.includes("[rp aid=9587322")) {
    return res.sendStatus(200);
  }

  if (body.includes("[toall]")) {
    return res.sendStatus(200);
  }
  res.sendStatus(200);
});
//現在の時間を取得
async function displaynow(body, message, messageId, roomId, accountId) {
  const today = DateTime.now().setZone("Asia/Tokyo").toFormat("MM/dd hh:mm:ss");
  sendchatwork(today, roomId);
}
//メッセージを送信
async function sendchatwork(ms, roomId) {
  try {
    await axios.post(
      `https://api.chatwork.com/v2/rooms/${roomId}/messages`,
      new URLSearchParams({ body: ms }),
      {
        headers: {
          "X-ChatWorkToken": CHATWORK_API_TOKEN,
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );

    console.log("メッセージ送信成功");
  } catch (error) {
    console.error(
      "Chatworkへのメッセージ送信エラー:",
      error.response?.data || error.message
    );
  }
}
//メッセージを削除する
async function deletemessage(body, message, messageId, roomId, accountId) {
  const dlmessageIds = [...message.matchAll(/(?<=to=\d+-)(\d+)/g)].map(
    (match) => match[0]
  );
  if (dlmessageIds.length === 0) {
    return;
  }

  for (let i = 0; i < dlmessageIds.length; i++) {
    const messageId = dlmessageIds[i];
    const url = `https://api.chatwork.com/v2/rooms/${roomId}/messages/${messageId}`;

    try {
      const response = await axios.delete(url, {
        headers: {
          Accept: "application/json",
          "x-chatworktoken": CHATWORK_API_TOKEN,
        },
      });
    } catch (err) {
      console.error(
        `メッセージID ${messageId} の削除中にエラーが発生しました:`,
        err.response ? err.response.data : err.message
      );
    }
  }
}
//メッセージに既読をつける
async function messageread(messageId, roomId) {
  try {
    await axios.put(
      `https://api.chatwork.com/v2/rooms/${roomId}/messages/read`,
      new URLSearchParams({ message_id: messageId }),
      {
        headers: {
          "X-ChatWorkToken": CHATWORK_API_TOKEN,
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );
    console.log("既読をつけました");
  } catch (error) {
    console.error(
      "既読がつけれませんでした:",
      error.response?.data || error.message
    );
  }
}

//部屋に入ってる人を取得
async function getChatworkMembers(roomId) {
  try {
    const response = await axios.get(
      `https://api.chatwork.com/v2/rooms/${roomId}/members`,
      {
        headers: {
          "X-ChatWorkToken": CHATWORK_API_TOKEN,
        },
      }
    );

    const members = response.data;
    return members;
  } catch (error) {
    console.error(
      "Error fetching Chatwork members:",
      error.response?.data || error.message
    );
    return null;
  }
}
//送信者の名前を取得
async function getSenderName(accountId, roomId) {
  const members = await getChatworkMembers(roomId);
  //console.log(members);
  if (members) {
    const sender = members.find((member) => member.account_id === accountId);
    return sender ? sender.name : "名前を取得できませんでした";
  }
  return "chatworkユーザー";
}
//管理者かを判別する
async function isUserAdmin(accountId, roomId) {
  try {
    const response = await axios.get(
      `https://api.chatwork.com/v2/rooms/${roomId}/members`,
      {
        headers: {
          "X-ChatWorkToken": CHATWORK_API_TOKEN,
        },
      }
    );
    const member = response.data.find((m) => m.account_id === accountId);

    if (member && member.role === "admin") {
      return true;
    } else {
      return false;
    }
  } catch (error) {
    console.error("エラーが発生しました:", error);
    return false;
  }
}
//メッセージ数を表示する
async function messagecount(body, message, messageId, roomId, accountId) {
  try {
    const room = message.match(/\d+/g);
    const response = await axios.get(
      `https://api.chatwork.com/v2/rooms/${room}`,
      {
        headers: {
          "X-ChatWorkToken": CHATWORK_API_TOKEN_N,
        },
      }
    );
    await sendchatwork(
      `部屋名: ${response.data.name} メッセージ数: ${response.data.message_num}`,
      roomId
    );
  } catch (error) {
    console.error("error:", error);
    await sendchatwork("エラーが起きました", roomId);
  }
}
//最新メッセージのリンクを取得する
async function messagelink(body, message, messageId, roomId, accountId) {
  try {
    const room = message.match(/\d+/g);
    const name = await axios.get(`https://api.chatwork.com/v2/rooms/${room}`, {
      headers: {
        "X-ChatWorkToken": CHATWORK_API_TOKEN_N,
      },
    });
    const response = await axios.get(
      `https://api.chatwork.com/v2/rooms/${room}/messages?force=1`,
      {
        headers: {
          "X-ChatWorkToken": CHATWORK_API_TOKEN_N,
        },
      }
    );
    const messageId = response.data
      .slice()
      .reverse()
      .find((messageid) => messageid.message_id > 0);
    console.log(messageId.message_id);
    await sendchatwork(
      `部屋名: ${name.data.name} メッセージリンク: https://www.chatwork.com/#!rid${room}-${messageId.message_id}`,
      roomId
    );
  } catch (error) {
    console.error("error:", error);
    await sendchatwork("エラーが起きました", roomId);
  }
}
//say
async function displaysay(body, message, messageId, roomId, accountId) {
  try {
    const m = body.replace("/say/", "");
    console.log(m);
    const isAdmin = await isUserAdmin(accountId, roomId);
    if (!isAdmin) {
      sendchatwork("管理者のみ利用可能です", roomId);
    } else {
      sendchatwork(m, roomId);
    }
  } catch (error) {
    console.error("errorが発生しました", error);
  }
}
//部屋に参加したらメッセージを送る
async function welcome(body, message, messageId, roomId, sendername) {
  try {
    const members = await getChatworkMembers(roomId);
    const welcomeId = (message.match(/\[piconname:(\d+)\]/) || [])[1];
    await sendchatwork(
      `[rp aid=${welcomeId} to=${roomId}-${messageId}] [pname:${welcomeId}]さん\nよろ〜`,
      roomId
    );
  } catch (error) {
    console.error(
      "入室エラー",
      error.response ? error.response.data : error.message
    );
  }
}
//荒らし対策
async function blockMembers(
  body,
  message,
  messageId,
  roomId,
  accountIdToBlock,
  sendername
) {
  try {
    const members = await getChatworkMembers(roomId);

    let adminIds = [];
    let memberIds = [];
    let readonlyIds = [];

    members.forEach((member) => {
      if (member.role === "admin") {
        adminIds.push(member.account_id);
      } else if (member.role === "member") {
        memberIds.push(member.account_id);
      } else if (member.role === "readonly") {
        readonlyIds.push(member.account_id);
      }
    });

    if (!readonlyIds.includes(accountIdToBlock)) {
      readonlyIds.push(accountIdToBlock);
    }

    adminIds = adminIds.filter((id) => id !== accountIdToBlock);
    memberIds = memberIds.filter((id) => id !== accountIdToBlock);

    const encodedParams = new URLSearchParams();
    encodedParams.set("members_admin_ids", adminIds.join(","));
    encodedParams.set("members_member_ids", memberIds.join(","));
    encodedParams.set("members_readonly_ids", readonlyIds.join(","));

    const url = `https://api.chatwork.com/v2/rooms/${roomId}/members`;
    const response = await axios.put(url, encodedParams.toString(), {
      headers: {
        accept: "application/json",
        "Content-Type": "application/x-www-form-urlencoded",
        "x-chatworktoken": CHATWORK_API_TOKEN,
      },
    });
    await sendchatwork(
      `[info][title]不正利用記録[/title][piconname:${accountIdToBlock}]さんに対して、不正利用フィルターが発動しました。[/info]`,
      roomId
    );
    const { data } = await supabase
      .from("発禁者")
      .select("accountId, reason, count")
      .eq("accountId", accountIdToBlock);
    let count = "";
    let reason = "";
    data.forEach((person) => {
      count += person.count;
      reason += person.reason;
    });
    const arashi = Number(count) + "1";
    const reasona = reason + "荒らし";
    const { error } = await supabase.from("発禁者").upsert([
      {
        accountId: accountIdToBlock,
        reason: reason,
        count: arashi,
        roomId: roomId,
      },
    ]);
    if (error) {
      console.error(error);
    }
  } catch (error) {
    console.error(
      "不正利用フィルターエラー:",
      error.response ? error.response.data : error.message
    );
  }
}
//おみくじ
async function omikuji(body, message, messageId, roomId, accountId) {
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
      else if (random < 37.3) return "末吉";
      //12.3
      else if (random < 57.3) return "吉";
      //20
      else if (random < 72.3) return "中吉";
      //15
      else if (random < 87.3) return "凶";
      //15
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
//無限おみくじ
async function Toomikuji(body, message, messageId, roomId, accountId) {
  try {
    const omikujiResult = getOmikujiResult();
    await sendchatwork(
      `[rp aid=${accountId} to=${roomId}-${messageId}]\n${omikujiResult} ※`,
      roomId
    );
    function getOmikujiResult() {
      const random = Math.random() * 100;
      if (random < 5) return "大凶";
      //5
      else if (random < 25) return "小吉";
      //20
      else if (random < 37.3) return "末吉";
      //12.3
      else if (random < 57.3) return "吉";
      //20
      else if (random < 72.3) return "中吉";
      //15
      else if (random < 87.3) return "凶";
      //15
      else if (random < 87.4) return "シークレット";
      //0.1
      else return "大吉"; //12.6
    }
  } catch (error) {
    console.error(
      "エラー:",
      error.response ? error.response.data : error.message
    );
  }
}
//おみくじの結果を表示する
async function omikujiresult(body, message, messageId, roomId, accountId) {
  try {
    const isAdmin = await isUserAdmin(accountId, roomId);
    if (!isAdmin) {
      sendchatwork("管理者のみ利用可能です", roomId);
    } else {
      const { data, error } = await supabase
        .from("おみくじ")
        .select("accountId, roomId, today, 結果")
        .eq("roomId", roomId);

      if (error) {
        console.error("おみくじ取得エラー:", error);
      } else {
        if (data.length === 0) {
          await sendchatwork(
            `[rp aid=${accountId} to=${roomId}-${messageId}][pname:${accountId}]さん\nまだおみくじを引いた人はいません`,
            roomId
          );
        } else {
          let messageToSend = `[rp aid=${accountId} to=${roomId}-${messageId}][pname:${accountId}] さん[info][title]おみくじを引いた人[/title]`;
          data.forEach((item) => {
            messageToSend += `${item.roomId} ${item.結果} [piconname:${item.accountId}]\n`;
          });

          messageToSend += "[/info]";
          await sendchatwork(messageToSend, roomId);
        }
      }
    }
  } catch (error) {
    console.error(
      "エラー:",
      error.response ? error.response.data : error.message
    );
  }
}
//宣伝禁止
async function sendenkinshi(
  body,
  message,
  messageId,
  roomId,
  accountId,
  sendername
) {
  try {
    const members = await getChatworkMembers(roomId);
    const isAdmin = await isUserAdmin(accountId, roomId);
    if (!isAdmin) {
      await sendchatwork(
        `[rp aid=${accountId} to=${roomId}-${messageId}][pname:${accountId}]さん\n宣伝禁止`,
        roomId
      );
      const { data } = await supabase
        .from("発禁者")
        .select("accountId, reason, count")
        .eq("accountId", accountId);
      let count = "";
      data.forEach((number) => {
        count += number.count;
      });
      const count1 = Number(count) + 1;
      if (count1 == 3) {
        sendchatwork("3度目の概要違反となりますので発禁になります", roomId);
        await blockMembers(
          body,
          message,
          messageId,
          roomId,
          accountId,
          sendername
        );
      } else if (count1 <= 4) {
        sendchatwork("4度目の概要違反となりますので発禁になります", roomId);
        await blockMembers(
          body,
          message,
          messageId,
          roomId,
          accountId,
          sendername
        );
      } else {
        const { error } = await supabase.from("発禁者").upsert([
          {
            accountId: accountId,
            reason: "宣伝",
            count: count1,
            roomId: roomId,
          },
        ]);
        if (error) {
          console.error(error);
        }
      }
    } else {
      console.log("管理者のため見逃されました");
    }
  } catch (error) {
    console.error(
      "宣伝禁止エラー",
      error.response ? error.response.data : error.message
    );
  }
}
//ブラックリストを表示する
async function blacklist(body, message, messageId, roomId, accountId) {
  try {
    const isAdmin = await isUserAdmin(accountId, roomId);
    if (!isAdmin) {
      sendchatwork("管理者のみ利用可能です", roomId);
    } else {
      const { data, error } = await supabase
        .from("発禁者")
        .select("accountId, reason, count, roomId")
        .eq("roomId", roomId);
      if (error) {
        console.error("発禁者取得エラー:", error);
      } else {
        if (data.length === 0) {
          await sendchatwork(
            `[rp aid=${accountId} to=${roomId}-${messageId}][pname:${accountId}]さん\nまだブラックリスト入りしてる人はいません`,
            roomId
          );
        } else {
          let messageToSend = `[rp aid=${accountId} to=${roomId}-${messageId}][pname:${accountId}]さん[info][title]ブラックリスト[/title]`;
          data.forEach((item) => {
            messageToSend += `[picon:${item.accountId}] ${item.reason} count:${item.count}\n`;
          });
          messageToSend += "[/info]";
          await sendchatwork(messageToSend, roomId);
        }
      }
    }
  } catch (error) {
    console.error(
      "エラー:",
      error.response ? error.response.data : error.message
    );
  }
}
//サイコロを振る
async function diceroll(body, message, messageId, roomId, accountId) {
  const saikoro = [...body.matchAll(/\d+(?=d)/g)].map((saikoro) => saikoro[0]);
  const men = [...body.matchAll(/(?<=d)\d+/g)].map((men) => men[0]);
  const number = [];
  for (let s = 0; s < saikoro; s++) {
    number.push(Math.floor(Math.random() * men) + 1);
  }
  const sum = number.reduce((accumulator, currentValue) => {
    return accumulator + currentValue;
  }, 0);
  if (saikoro <= 100) {
    if (men <= 100) {
      if (saikoro == 1) {
        if (men > 0 && saikoro > 0) {
          sendchatwork(
            `[rp aid=${accountId} to=${roomId}-${messageId}][pname:${accountId}] さん\n${number}`,
            roomId
          );
        } else {
          sendchatwork(
            `[rp aid=${accountId} to=${roomId}-${messageId}][pname:${accountId}] さん\nダイスの数と面の数を指定してください`,
            roomId
          );
        }
      } else if (men > 0 && saikoro > 0) {
        sendchatwork(
          `[rp aid=${accountId} to=${roomId}-${messageId}][pname:${accountId}] さん\n${number} ${
            "合計値" + sum
          }`,
          roomId
        );
      } else {
        sendchatwork(
          `[rp aid=${accountId} to=${roomId}-${messageId}][pname:${accountId}] さん\nダイスの数と面の数を指定してください`,
          roomId
        );
      }
    } else {
      sendchatwork("面の数が多すぎます(1~100)", roomId);
    }
  } else {
    sendchatwork("サイコロの数が多すぎます(1~100)", roomId);
  }
}
//proxyを設定する
async function proxyset(body, message, messageId, roomId, accountId) {
  try {
    const isAdmin = await isUserAdmin(accountId, roomId);
    if (!isAdmin) {
      sendchatwork("管理者のみ利用可能です", roomId);
    } else {
      const match = message.match(/^([^「]+)"(.+)"$/);
      const proxyname = match[1];
      const proxyurl = match[2];
      console.log(proxyname, proxyurl);
      if (!match) {
        await sendchatwork(
          `[rp aid=${accountId} to=${roomId}-${messageId}][pname:${accountId}]さん\n構文エラー`,
          roomId
        );
        return;
      }
      const { data, error } = await supabase
        .from("proxy")
        .insert([{ roomId: roomId, proxyname: proxyname, proxyurl: proxyurl }]);
      if (error) {
        await sendchatwork(
          `[rp aid=${accountId} to=${roomId}-${messageId}][pname:${accountId}]さん\nデータを保存できませんでした`,
          roomId
        );
        console.error(error);
      } else {
        await sendchatwork(
          `[rp aid=${accountId} to=${roomId}-${messageId}][pname:${accountId}]さん\nデータを保存しました！`,
          roomId
        );
      }
    }
  } catch (error) {
    console.error("error", error);
  }
}
//proxyを表示する
async function proxyget(body, message, messageId, roomId, accountId) {
  try {
    const proxyname = message;
    if (message == "") {
      const { data, error } = await supabase.from("proxy").select("proxyname");
      if (error) {
        console.error("URL取得エラー:", error);
      } else {
        if (data.length === 0) {
          await sendchatwork(
            `[rp aid=${accountId} to=${roomId}-${messageId}][pname:${accountId}]さん\n保存されされているproxyはありません`,
            roomId
          );
        } else {
          let messageToSend = `[rp aid=${accountId} to=${roomId}-${messageId}][pname:${accountId}]さん[info][title]保存されているproxy[/title]`;
          data.forEach((item) => {
            messageToSend += `${item.proxyname}\n`;
          });

          messageToSend += "[/info]";
          await sendchatwork(messageToSend, roomId);
        }
      }
    } else {
      const { data, error } = await supabase
        .from("proxy")
        .select("proxyname, proxyurl")
        .eq("proxyname", proxyname);
      if (error) {
        console.error("URL取得エラー:", error);
      } else {
        if (data.length === 0) {
          await sendchatwork(
            `[rp aid=${accountId} to=${roomId}-${messageId}][pname:${accountId}]さん\n保存されたURLはありません`,
            roomId
          );
        } else {
          let messageToSend = `[rp aid=${accountId} to=${roomId}-${messageId}][pname:${accountId}]さん[info][title]保存されているURL[/title]`;
          data.forEach((item) => {
            messageToSend += `${item.proxyname} - https://${item.proxyurl}\n`;
          });
          messageToSend += "[/info]";
          await sendchatwork(messageToSend, roomId);
        }
      }
    }
  } catch (error) {
    console.error("error", error);
  }
}
//proxyを削除する
async function proxydelete(body, message, messageId, roomId, accountId) {
  const isAdmin = await isUserAdmin(accountId, roomId);
  if (!isAdmin) {
    sendchatwork("管理者のみ利用可能です", roomId);
  } else {
    const match = message.match(/^([^「]+)"(.+)"$/);
    const proxyname = match[1];
    const proxyurl = match[2];
    console.log(proxyname);
    console.log(proxyurl);
    const { data, error } = await supabase
      .from("proxy")
      .delete()
      .eq("proxyurl", proxyurl)
      .eq("roomId", roomId)
      .eq("proxyname", proxyname);

    if (error) {
      await sendchatwork(
        `[rp aid=${accountId} to=${roomId}-${messageId}][pname:${accountId}]さん\n削除しようとしているURLが見つかりません。。`,
        roomId
      );
    } else {
      await sendchatwork(
        `[rp aid=${accountId} to=${roomId}-${messageId}][pname:${accountId}]さん\n削除しました`,
        roomId
      );
    }
  }
}

//メッセージ履歴を表示させる
async function messagerireki(body, message, messageId, roomId, accountId) {
  try {
    const kijun = message.match(/^([^「]+)"(.+)"$/);

    {
      const { data, error } = await supabase
        .from("nyankoのへや")
        .select("messageId, message, accountId, name, date")
        .eq(kijun[1], kijun[2]);

      if (error) {
        console.error("メッセージ取得エラー:", error);
      } else {
        if (data.length === 0) {
          await sendchatwork(
            `[rp aid=${accountId} to=${roomId}-${messageId}][pname:${accountId}]さん\n保存されているコメントはありません`,
            roomId
          );
        } else {
          let messageToSend = `[rp aid=${accountId} to=${roomId}-${messageId}][pname:${accountId}]さん[info][title]メッセージ[/title]`;
          data.forEach((item) => {
            messageToSend += `[code]${item.messageId} ${item.message} [piconname:${item.accountId}] ${item.date}[/code]\n`;
          });

          messageToSend += "[/info]";
          await sendchatwork(messageToSend, roomId);
        }
      }
    }
  } catch (error) {
    console.error(
      "エラー:",
      error.response ? error.response.data : error.message
    );
  }
}
async function poker(body, message, messageId, roomId, accountId) {
  try {
    if (message.match(/^役$/)) {
      sendchatwork("[preview id=1670380556 ht=200]", roomId);
    } else {
      const marks = ["♣️", "♦️", "❤️", "♠️"];
      const suuzi = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13];
      const poker = getRandomItems(suuzi, marks);
      sendchatwork(
        `[rp aid=${accountId} to=${roomId}-${messageId}][pname:${accountId}] さん\n${poker}`,
        roomId
      );
    }
  } catch (error) {
    console.error(error);
  }
}
function getRandomItems(suuzi, marks) {
  const result = [];
  const itemCounts = {};
  while (result.length < 5) {
    const mark = marks[Math.floor(Math.random() * marks.length)];
    const randomIndex = suuzi[Math.floor(Math.random() * suuzi.length)];
    itemCounts[randomIndex] = (itemCounts[randomIndex] || 0) + 1;
    if (itemCounts[randomIndex] <= 4) {
      result.push(`${mark}${randomIndex}`);
    }
  }

  return result;
}

async function randommember(body, message, messageId, roomId, accountId) {
  try {
    const members = await getChatworkMembers(roomId);

    if (!members || members.length === 0) {
      return;
    }

    const randomIndex = Math.floor(Math.random() * members.length);
    const randomMember = members[randomIndex];

    await sendchatwork(
      `[rp aid=${accountId} to=${roomId}-${messageId}][pname:${accountId}]さん\n[piconname:${randomMember.account_id}]さんが選ばれました！`,
      roomId
    );
  } catch (error) {
    await sendchatwork(
      `[rp aid=${accountId} to=${roomId}-${messageId}][pname:${accountId}]さん\nエラー。あらら`,
      roomId
    );
  }
}
