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
      const date = new Date().toLocaleDateString("ja-JP", {
  timeZone: "Asia/Tokyo",
});
      sendchatwork(`日付変更　今日は${date}日です`, 374987857);
      const { data, error } = await supabase
        .from("おみくじ")
        .delete()
        .neq("accountId", 0);
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
  const messagee = body.replace(/\/.*?\/|\s+/g, "");
  const accountId = req.body.webhook_event.account_id;
  const roomId = req.body.webhook_event.room_id;
  const messageId = req.body.webhook_event.message_id;
  const sendername = await getSenderName(accountId, roomId);
  const welcomeId = body.replace(/\D/g, "");
  const isAdmin = await isUserAdmin(accountId, roomId);
  const today = new Date().toLocaleDateString("ja-JP", {
  timeZone: "Asia/Tokyo",
});
  //メッセージを保存
  const { data, error } = await supabase.from("nyankoのへや").insert({
    messageId: messageId,
    message: message,
    accountId: accountId,
    name: sendername,
    date: today
  });

  //ここに荒らしだと思われるメッセージの検出
  if ((body.match(/\)/g) || []).length >= 20) {
    await blockMembers(body, message, messageId, roomId, accountId, sendername);
  }
  if ((body.match(/\*/g) || []).length >= 20) {
    await blockMembers(body, message, messageId, roomId, accountId, sendername);
  }
  if ((body.match(/\[To:\d+]/g) || []).length >= 15) {
    await blockMembers(body, message, messageId, roomId, accountId, sendername);
  }
  if (body.match(/\[toall]/g)) {
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
  if (body.match(/\https:\/\/www.chatwork.com\/g/g)) {
    await sendenkinshi(body, message, messageId, roomId, accountId, sendername);
  }
  if (body.match(/\https:\/\/odaibako.net/g)) {
    await sendenkinshi(body, message, messageId, roomId, accountId, sendername);
  }
  if (body.match(/\https:\/\/scratch.mit.edu/g)) {
    await sendenkinshi(body, message, messageId, roomId, accountId, sendername);
  }
  if (body.match(/\https:\/\/padlet.com/g)) {
    await sendenkinshi(body, message, messageId, roomId, accountId, sendername);
  }
  if (body.match(/^now$/i)) {
    const now = new Date().toLocaleString("ja-JP", {
      timeZone: "Asia/Tokyo",
    });
    sendchatwork(now, roomId);
  }
  if (body.includes("/proxyget/")) {
    proxyget(body, messagee, messageId, roomId, accountId);
  }
  if (body.includes("/proxyset/")) {
    if (!isAdmin) {
      sendchatwork("管理者のみ使用可能です", roomId);
    } else {
      proxyset(body, messagee, messageId, roomId, accountId);
    }
  }
  if (body.includes("/proxydelete/")) {
    if (!isAdmin) {
      sendchatwork("管理者のみ使用可能です", roomId);
    } else {
      deleteproxy(body, messagee, messageId, roomId, accountId);
    }
  }
  if (body.match(/^bot$/)) {
    sendchatwork("[code][To:9587322]\na[/code]", roomId);
  }
  res.sendStatus(200);
});
//メンションされたら起動する
app.post("/mention", async (req, res) => {
  console.log(req.body);

  const accountId = req.body.webhook_event.from_account_id;
  const toaccountId = req.body.webhook_event.to_account_id;
  const roomId = req.body.webhook_event.room_id;
  const messageId = req.body.webhook_event.message_id;
  const body = req.body.webhook_event.body;
  const message = req.body.webhook_event.body;
  const messagee = body.replace(/\/.*?\/|\s+/g, "");
  const isAdmin = await isUserAdmin(accountId, roomId);
  await messageread(messageId, roomId);
  if (roomId == 374987857) {
    if (body.match(/\[To:9587322]/g) && body.match(/\おみくじ/)) {
      Toomikuji(accountId, messageId, roomId);
      return;
    }
    if (body.match(/\削除/)) {
      if (!isAdmin) {
        sendchatwork("管理者のみ使用可能です", roomId);
      } else {
        deletemessage(body, message, messageId, roomId, accountId);
      }
    }
    if (body.match(/[To:9587322]/g && /\messagecount/g)) {
      messagecount(message, roomId);
    }

    if (body.match(/[To:9587322]/g && /dice/gi)) {
      saikoro(body, message, messageId, roomId, accountId);
    }
    if (body.match(/[To:9587322]/g && /omikuji/g)) {
      if (!isAdmin) {
        sendchatwork("管理者のみ使用可能です", roomId);
      } else {
        omikujihiitahito(body, message, messageId, roomId, accountId);
      }
    }
    if (body.match(/[To:9587322]/g && /\messagelink/g)) {
      messagelink(message, roomId);
    }
  }
  if (roomId == 367747947) {
    if (body.includes("/履歴/")) {
      messagerireki(body, message, messagee, messageId, roomId, accountId);
    }
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
    console.error("error:", error);
    await sendchatwork("エラーが起きました", roomId);
  }
}
//メッセージの最新リンクを取得する
async function messagelink(message, roomId) {
  try {
    const room = [...message.matchAll(/(?<=messagelink\D+)(\d+)/g)].map(
      (room) => room[0]
    );
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
      else if (random < 87.6) return "願い事叶えたるよ(できることだけ)";
      //0.3
      else return "大吉";
      //12.4
    }
  } catch (error) {
    console.error(
      "エラー:",
      error.response ? error.response.data : error.message
    );
  }
}
async function omikujihiitahito(body, message, messageId, roomId, accountId) {
  try {
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
        let messageToSend = `[rp aid=${accountId} to=${roomId}-${messageId}][pname:${accountId}]さん[info][title]おみくじを引いた人[/title]`;
        data.forEach((item) => {
          messageToSend += `${item.roomId} ${item.結果} [piconname:${item.accountId}]\n`;
        });

        messageToSend += "[/info]";
        await sendchatwork(messageToSend, roomId);
      }
    }
  } catch (error) {
    console.error(
      "エラー:",
      error.response ? error.response.data : error.message
    );
  }
}
async function Toomikuji(accountId, messageId, roomId) {
  try {
    const omikujiResult = getOmikujiResult();
    await sendchatwork(
      `[rp aid=${accountId} to=${roomId}-${messageId}]\n${omikujiResult} ※To`,
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
      const { error: insertError } = await supabase
        .from("発禁者")
        .insert({ accountId: accountId, 理由: "宣伝" });
      if (insertError) {
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
async function saikoro(body, message, messageId, roomId, accountId) {
  const saikoro = [...body.matchAll(/\d+(?=d)/g)].map((saikoro) => saikoro[0]);
  const men = [...body.matchAll(/(?<=d)\d+/g)].map((men) => men[0]);
  const number = [];
  for (let s = 0; s < saikoro; s++) {
    number.push(Math.floor(Math.random() * men) + 1);
  }
  const sum = number.reduce((accumulator, currentValue) => {
    return accumulator + currentValue;
  }, 0);
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
}
//proxyを表示する
async function proxyget(body, messagee, messageId, roomId, accountId) {
  try {
    const proxyname = messagee;
    console.log(messagee);
    if (messagee == "") {
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
      console.log(data);
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
//proxyを設定する
async function proxyset(body, messagee, messageId, roomId, accountId) {
  try {
    console.log(messagee);
    const match = messagee.match(/^([^「]+)"(.+)"$/);
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
  } catch (error) {
    console.error("error", error);
  }
}
//proxyを削除する
async function deleteproxy(body, messagee, messageId, roomId, accountId) {
  const match = messagee.match(/^([^「]+)"(.+)"$/);
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
//メッセージ履歴を表示させる
async function messagerireki(
  body,
  message,
  messagee,
  messageId,
  roomId,
  accountId
) {
  try {
    const kijun = messagee.match(/^([^「]+)"(.+)"$/);

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
