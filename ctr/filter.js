const axios = require('axios');

const cwdata = require('/app/ctr/cwdata');
const msedit = require('/app/ctr/message');

const CHATWORK_API_TOKEN = process.env.CWapitoken;

async function blockMember(roomId, accountIdToBlock) {
  try {
    const members = await cwdata.getChatworkMembers(roomId);

    let adminIds = [];
    let memberIds = [];
    let readonlyIds = [];

    members.forEach(member => {
      if (member.role === 'admin') {
        adminIds.push(member.account_id);
      } else if (member.role === 'member') {
        memberIds.push(member.account_id);
      } else if (member.role === 'readonly') {
        readonlyIds.push(member.account_id);
      }
    });

    if (!readonlyIds.includes(accountIdToBlock)) {
      readonlyIds.push(accountIdToBlock);
    }else{
      readonlyIds = readonlyIds.filter(id => id !== accountIdToBlock);
    }

    adminIds = adminIds.filter(id => id !== accountIdToBlock);
    memberIds = memberIds.filter(id => id !== accountIdToBlock);

    const encodedParams = new URLSearchParams();
    encodedParams.set('members_admin_ids', adminIds.join(','));
    encodedParams.set('members_member_ids', memberIds.join(','));
    encodedParams.set('members_readonly_ids', readonlyIds.join(','));

    const url = `https://api.chatwork.com/v2/rooms/${roomId}/members`;
    const response = await axios.put(url, encodedParams.toString(), {
      headers: {
        accept: 'application/json',
        'Content-Type': 'application/x-www-form-urlencoded',
        'x-chatworktoken': CHATWORK_API_TOKEN,
      },
    });
    await msedit.sendchatwork(`[info][title]不正利用記録[/title][piconname:${accountIdToBlock}]さんに対して、不正利用フィルターが発動しました。[/info]`, roomId);

  } catch (error) {
    console.error('不正利用フィルターエラー:', error.response ? error.response.data : error.message);
  }
}

module.exports = {
    blockMember
};