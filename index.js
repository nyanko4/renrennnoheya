const express = require("express");
const axios = require('axios');
const bodyParser = require("body-parser");

const app = express();
const PORT = 3000;

app.get('/', (req, res) => {
    res.sendStatus(200);
});


app.listen(PORT, () => {
  console.log(`ボットがポート${PORT}で待機中...`);
});