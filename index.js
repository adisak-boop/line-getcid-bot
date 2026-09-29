const express = require('express');
const line = require('@line/bot-sdk');
const axios = require('axios');

const config = {
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN,
  channelSecret: process.env.LINE_CHANNEL_SECRET,
};

const app = express();

app.get('/', (req, res) => res.send('LINE Bot Service is running!'));

app.post('/webhook', line.middleware(config), (req, res) => {
  Promise.all(req.body.events.map(handleEvent))
    .then((result) => res.json(result))
    .catch((err) => {
      console.error(err);
      res.status(500).end();
    });
});

async function handleEvent(event) {
  if (event.type !== 'message' || event.message.type !== 'text') {
    return Promise.resolve(null);
  }

  const userText = event.message.text.trim();
  const token = process.env.GETCID_TOKEN;

  try {
    const response = await axios.get(`https://bs.getcid.xyz/webapi/getcid/?token=${token}&iid=${userText}&onlycid=1`);
    const data = response.data;

    let replyText = '';
    if (data.cid) {
      replyText = `Confirmation ID (CID):\n${data.cid}`;
    } else if (data.errorDetail) {
      replyText = `เกิดข้อผิดพลาด: ${data.errorDetail}`;
    } else {
      replyText = 'ไม่สามารถดึงข้อมูล CID ได้ กรุณาตรวจสอบ Installation ID อีกครั้ง';
    }

    return lineClient.replyMessage(event.replyToken, { type: 'text', text: replyText });
  } catch (error) {
    return lineClient.replyMessage(event.replyToken, { type: 'text', text: 'เกิดข้อผิดพลาดในการเชื่อมต่อกับ GetCID API' });
  }
}

const lineClient = new line.Client(config);
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server listening on port ${PORT}`));
