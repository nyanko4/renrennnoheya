const CHATWORK_API_TOKEN = process.env.CWapitoken;
const { createClient } = require("@supabase/supabase-js");
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);
const { DateTime } = require("luxon");
const fs = require("fs");
const axios = require("axios");
const reqcheck = require("../middleware/sign");
const { sendername: name, fileurl, arashi: arashim } = require("../ctr/cwdata");
const { sendchatwork, deleteMessage, readmessage } = require("../ctr/message");
const arashi = require("../module/arashi");
const command = require("../module/command");
const omikuji = require("../module/omikuji");
const senden = require("../module/senden");
const welcome = require("../module/welcome");

async function getchat(req, res) {
  const c = await reqcheck(req);
  if (c !== "ok") {
    return res.sendStatus(400);
  }
  const today = DateTime.now().setZone("Asia/Tokyo").toFormat("yyyy-MM-dd");
  console.log(req.body);
  const event = req.body.webhook_event_type;
  const {
    body,
    account_id: accountId,
    room_id: roomId,
    message_id: messageId,
    send_time: sendtime,
    update_time: updatetime,
  } = req.body.webhook_event;
  await readmessage(roomId, messageId);
  const sendername = await name(accountId, roomId);
  if (accountId === 9587322) {
    if (body.includes("[dtext:chatroom_chat_edited]")) {
      deleteMessage(body, messageId, roomId, accountId);
    } else return res.sendStatus(200);
  }
  log(body, messageId, roomId, accountId, event, sendtime, updatetime);
  if (roomId == 374987857) {
    //メッセージを保存
    const { data, error } = await supabase.from("nyankoのへや").insert({
      messageId: messageId,
      message: body,
      accountId: accountId,
      name: sendername,
      date: today,
    });
  }
  const handlers = [arashi, omikuji, senden, welcome, command];

  for (const handler of handlers) {
    if ((await handler(body, messageId, roomId, accountId)) === "ok") {
      return res.sendStatus(200);
    }
  }

  res.sendStatus(200);
}
async function log(
  body,
  messageId,
  roomId,
  accountId,
  event,
  sendtime,
  updatetime
) {
  try {
    const a = await arashim(body, messageId, roomId, accountId);
    const sendername = await name(accountId, roomId);
    if (a !== "ok") {
      if (body.includes("[info][title][dtext:file_uploaded][/title]")) {
        const url = await fileurl(body, roomId);
        if (url === false) {
          sendchatwork(
            `${sendername}\n[qt][qtmeta aid=${accountId} time=${sendtime}]${body}[/qt]`,
            389966097
          );
        } else {
          try {
            const localFilePath = url.filename; // 拡張子をpngに変更
            const writer = fs.createWriteStream(localFilePath);
            const response = await axios({
              method: "get",
              url: url.fileurl,
              responseType: "stream",
            });

            response.data.pipe(writer);

            await new Promise((resolve, reject) => {
              writer.on("finish", resolve);
              writer.on("error", reject);
            });

            const formData = new FormData();
            formData.append("file", fs.createReadStream(localFilePath));

            const uploadUrl = `https://api.chatwork.com/v2/rooms/389966097/files`;
            const headers = {
              ...formData.getHeaders(),
              "x-chatworktoken": CHATWORK_API_TOKEN,
            };

            const uploadResponse = await axios.post(uploadUrl, formData, {
              headers,
            });

            console.log("ファイルアップロード成功:", uploadResponse.data);

            await new Promise((resolve, reject) => {
              fs.unlink(localFilePath, (err) => {
                if (err) {
                  console.error("ローカルファイルの削除エラー:", err);
                  reject(err); // エラーをreject
                } else {
                  resolve(); // 正常終了
                }
              });
            });

            console.log("ローカルファイルを削除しました。");
          } catch (error) {
            console.error("ファイル送信でエラーが発生しました:", error.message);
            if (error.response) {
              console.error(
                "Chatwork APIエラー:",
                error.response.status,
                error.response.data
              );
            }
          }
        }
      } else {
        if (event === "message_updated") {
          sendchatwork(
            `${sendername}\n[qt][qtmeta aid=${accountId} time=${updatetime}]${body}[/qt]`,
            389966097
          );
        } else {
          sendchatwork(
            `${sendername}\n[qt][qtmeta aid=${accountId} time=${sendtime}]${body}[/qt]`,
            389966097
          );
        }
      }
    }
  } catch (error) {
    console.error("error", error);
  }
}

module.exports = getchat;
