"use strict";
const express = require("express");
const app = express();
const compression = require("compression");
const CronJob = require("cron").CronJob;
const { createClient } = require("@supabase/supabase-js");
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);
const date = new Date().toDateString("ja-JP", {
  timeZone: "Asia/Tokyo",
});
const cluster = require("cluster");
const os = require("os");
const numClusters = os.cpus().length;
if (cluster.isMaster) {
  for (let i = 0; i < numClusters; i++) {
    cluster.fork();
  }

  cluster.on("exit", (worker, code, signal) => {
    cluster.fork();
  });
  new CronJob(
    "0 0 0 * * *",
    async () => {
      sendchatwork(`日付変更　今日は${date}日です`, 374987857);
    },
    null,
    true,
    "Asia/Tokyo"
  );
} else {
  app.use(compression());
  app.listen(3000, () => {
    console.log(`Worker ${process.pid} started`);
  });
}

const axios = require("axios");
const PORT = 3000;

app.use(express.json());

const CHATWORK_API_TOKEN = process.env.CHATWORK_API_TOKEN;
const CHATWORK_API_TOKEN_N = process.env.CHATWORK_API_TOKEN_N;

app.get("/", (req, res) => {
  res.sendStatus(200);
});

//全てのメッセージを受け取ります
app.post("/getchat", async (req, res) => {
  console.log(req.body);

  const body = req.body.webhook_event.body;
  const message = req.body.webhook_event.body;
  const accountId = req.body.webhook_event.account_id;
  const roomId = req.body.webhook_event.room_id;
  const messageId = req.body.webhook_event.message_id;
  const sendername = await getSenderName(accountId, roomId);
  const welcomeId = body.replace(/\D/g, "");
  //ここに荒らしだと思われるメッセージの検出
  if ((body.match(/\)/g) || []).length >= 20) {
    await blockMembers(body, message, messageId, roomId, accountId, sendername);
  }
  if ((body.match(/\:/g) || []).length >= 20) {
    await blockMembers(body, message, messageId, roomId, accountId, sendername);
  }
  if (body.match(/\[toall]/g)) {
    const isAdmin = await isUserAdmin(accountId, roomId);
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
    await sankashita(body, message, messageId, roomId, welcomeId, sendername);
  }
  //おみくじ
  if (body.match(/^おみくじ$/)) {
    await omikuji(body, message, messageId, roomId, accountId);
  }
  //宣伝感知
  if (body.match(/\https:\/\/www.chatwork.com/g)) {
    await sendenkinshi(body, message, messageId, roomId, accountId);
  }
  if (body.match(/\https:\/\/odaibako.net/g)) {
    await sendenkinshi(body, message, messageId, roomId, accountId);
  }
  if (body.match(/\https:\/\/scratch.mit.edu/g)) {
    await sendenkinshi(body, message, messageId, roomId, accountId);
  }
  if (body.match(/\https:\/\/padlet.com/g)) {
    await sendenkinshi(body, message, messageId, roomId, accountId);
  }
  if (body.match(/^now$/i)) {
    const today = new Date().toLocaleString("ja-JP", {
      timeZone: "Asia/Tokyo",
    });
    sendchatwork(today, roomId);
  }
  res.sendStatus(200);
});
//メンションされたら起動する
app.post("/mention", async (req, res) => {
  console.log(req.body);

  const fromaccountId = req.body.webhook_event.from_account_id;
  const toaccountId = req.body.webhook_event.to_account_id;
  const roomId = req.body.webhook_event.room_id;
  const messageId = req.body.webhook_event.message_id;
  const body = req.body.webhook_event.body;
  const message = req.body.webhook_event.body;
  await messageread(messageId, roomId);
  if (roomId == 374987857) {
    if (body.match(/\[To:9587322]/g) && body.match(/\おみくじ/)) {
      Toomikuji(fromaccountId, messageId, roomId);
      return;
    }
    if (body.match(/\削除/)) {
      deletemessage(body, message, messageId, roomId, fromaccountId);
    }
    if (body.match(/[To:9587322]暇/g && /\messagecount/g)) {
      messagecount(message, roomId);
    }
  }
  if (body.match(/dice/gi)) {
    const saikoro = [...body.matchAll(/\d+(?=d)/g)].map(
      (saikoro) => saikoro[0]
    );
    const men = [...body.matchAll(/(?<=d)\d+/g)].map((men) => men[0]);
    const number = Math.floor(Math.random() * men) + 1;
    if (men > 0) {
      sendchatwork(
        `[rp aid=${fromaccountId} to=${roomId}-${messageId}][pname:${fromaccountId}]\n${number}`,
        roomId
      );
    } else {
      sendchatwork(
        `[rp aid=${fromaccountId} to=${roomId}-${messageId}][pname:${fromaccountId}]\nダイスの数と面の数を指定してください`,
        roomId
      );
    }
  }
  if (body.match(/[To:9587322]暇/g && /じゃんけん/g)) {
    janken(body, message, messageId, roomId, fromaccountId)
  }
});
//メッセージ送信
async function sendchatwork(ms, CHATWORK_ROOM_ID) {
  try {
    await axios.post(
      `https://api.chatwork.com/v2/rooms/${CHATWORK_ROOM_ID}/messages`,
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
async function deletemessage(body, message, messageId, roomId, fromaccountId) {
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
//利用者データ取得
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

async function getSenderName(accountId, roomId) {
  const members = await getChatworkMembers(roomId);
  //console.log(members);
  if (members) {
    const sender = members.find((member) => member.account_id === accountId);
    return sender ? sender.name : "名前を取得できませんでした";
  }
  return "chatworkユーザー";
}
//管理者ですか？
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
async function messagecount(message, roomId) {
  try {
    const room = [...message.matchAll(/(?<=messagecount\D+)(\d+)/g)].map(
      (room) => room[0]
    );
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
    console.error("メッセージ数エラー:", error.response?.data || error.message);
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
  } catch (error) {
    console.error(
      "不正利用フィルターエラー:",
      error.response ? error.response.data : error.message
    );
  }
}
async function sankashita(
  body,
  message,
  messageId,
  roomId,
  welcomeId,
  sendername
) {
  try {
    const members = await getChatworkMembers(roomId);
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
async function omikuji(body, message, messageId, roomId, accountId) {
  try {
    const { error: insertError } = await supabase
      .from("おみくじ")
      .insert({ aid_today: `${accountId}_${roomId}` });
    if (insertError) {
      await sendchatwork(
        `[rp aid=${accountId} to=${roomId}-${messageId}] おみくじは1日1回までです。`,
        roomId
      );
      return;
    }
    const omikujiResult = getOmikujiResult();
    await sendchatwork(
      `[rp aid=${accountId} to=${roomId}-${messageId}]\n${omikujiResult}`,
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
      else if (random < 87.6) return "願い事叶えたるよ(できることだけ)";
      //0.3
      else return "大吉"; //12.4
    }
  } catch (error) {
    console.error(
      "エラー:",
      error.response ? error.response.data : error.message
    );
  }
}
new CronJob(
  "59 59 23 * * *",
  async () => {
    const { data, error } = await supabase
      .from("おみくじ")
      .delete()
      .neq("aid_today", "0");
  },
  null,
  true,
  "Asia/Tokyo"
);
async function Toomikuji(fromaccountId, messageId, roomId) {
  try {
    const omikujiResult = getOmikujiResult();
    await sendchatwork(
      `[rp aid=${fromaccountId} to=${roomId}-${messageId}]\n${omikujiResult} ※To`,
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
      else if (random < 87.6) return "シークレット";
      //0.3
      else return "大吉"; //12.4
    }
  } catch (error) {
    console.error(
      "エラー:",
      error.response ? error.response.data : error.message
    );
  }
}
async function sendenkinshi(body, message, messageId, roomId, accountId) {
  try {
    const members = await getChatworkMembers(roomId);
    const isAdmin = await isUserAdmin(accountId, roomId);
    if (!isAdmin) {
      await sendchatwork(
        `[rp aid=${accountId} to=${roomId}-${messageId}][pname:${accountId}]さん\n宣伝禁止`,
        roomId
      );
      const { error: insertError } = await supabase
        .from("発禁カウント")
        .insert({ accountId: accountId, 理由: "宣伝", カウント: 1 });
      if (insertError) {
        const { error: insertError } = await supabase
          .from("発禁カウント")
          .upsert({ accountId: accountId, 理由: "宣伝", カウント: 2 });
        if (insertError) {
          console.log("error");
        }
      }
      return;
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
async function janken(body, message, messageId, roomId, fromaccountId) {
  const janken = getjanken();
    function getjanken() {
      const random = Math.random() * 100;
      console.log(random);
      if (random < 33.333333333333333) return "ぐー";
      else if (random < 66.66666666666666) return "ちょき";
      else return "ぱー";
    }
  const jankennote = [
    
  ]
  sendchatwork(
      `[rp aid=${fromaccountId} to=${roomId}-${messageId}][pname:${fromaccountId}]\n${janken}`,
      roomId
    );
  if (body.includes(janken)) {
    sendchatwork(`[rp aid=${fromaccountId} to=${roomId}-${messageId}][pname:${fromaccountId}]\nあいこ`)
  }
  if (body.includes(janken)) {
    
  }
}