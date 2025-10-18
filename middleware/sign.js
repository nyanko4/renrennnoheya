const crypto = require('crypto');

const webhookTokens = [
    Buffer.from(process.env.webhookToken, 'base64'),
    Buffer.from(process.env.webhookToken2, 'base64'),
    Buffer.from(process.env.webhookToken3, 'base64'),
];

async function trustSignature(req) {
    const receivedSignature = req.header('x-chatworkwebhooksignature');
    if (!receivedSignature) {
        return "f";
    }
    
    const contents = JSON.stringify(req.body);

    for (const token of webhookTokens) {
        const hmac = crypto.createHmac('sha256', token);
        hmac.update(contents);
        const expectedSignature = hmac.digest('base64');
        
        if (receivedSignature === expectedSignature) {
            return "ok";
        }
    }

    return "f";
}

module.exports = trustSignature;
