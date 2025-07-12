const express = require("express");
const router = express.Router();
const axios = require("axios");
const port = 3000;
const CHATWORK_API_TOKEN = process.env.CHATWORK_API_TOKEN;
const ROOM_IDS = {
  renren: 364321548,
  proxy: 364362698,
  renrenproxy: 372453591,
  senden: 365406836,
};
router.use(express.json());

async function fetchChatworkMembers(roomId) {
  try {
    const response = await axios.get(
      `https://api.chatwork.com/v2/rooms/${roomId}/members`,
      { headers: { "X-ChatWorkToken": CHATWORK_API_TOKEN } }
    );
    return response.data;
  } catch (error) {
    console.error(
      `Chatworkメンバー取得エラー (Room ID: ${roomId}):`,
      error.response?.data || error.message
    );
    return null;
  }
}
async function getRoomMembersNotInRenren(targetRoomId, roomName) {
  const renrenMembersData = await fetchChatworkMembers(ROOM_IDS.renren);
  const targetRoomMembersData = await fetchChatworkMembers(targetRoomId);

  if (!renrenMembersData || !targetRoomMembersData) {
    return "エラー";
  }

  const renrenMemberIds = renrenMembersData.map((member) => member.account_id);

  const membersNotInRenren = targetRoomMembersData
    .filter((member) => {
      const isNotInRenrenAndInTarget = !renrenMemberIds.includes(
        member.account_id
      );
      const isInRenrenAndIsViewerAndInTarget =
        renrenMemberIds.includes(member.account_id) &&
        member.role === "readonly";
      return isNotInRenrenAndInTarget || isInRenrenAndIsViewerAndInTarget;
    })
    .map((member) => `${member.account_id} ${member.name}`);
  console.log(
    `${roomName} にいて、条件に合致するメンバー:\n${membersNotInRenren.join(
      "\n"
    )}`
  );
  return membersNotInRenren.join("|") || "該当者なし";
}
router.get("/proxy", async (req, res) => {
  const result = await getRoomMembersNotInRenren(
    ROOM_IDS.proxy,
    "プロキシ部屋"
  );
  res.send(result);
});
router.get("/renrenproxy", async (req, res) => {
  const result = await getRoomMembersNotInRenren(
    ROOM_IDS.renrenproxy,
    "れんれんプロキシ部屋"
  );
  res.send(result);
});
router.get("/senden", async (req, res) => {
  const result = await getRoomMembersNotInRenren(ROOM_IDS.senden, "宣伝部屋");
  res.send(result);
});

module.exports = router;
