const express = require("express");
const compression = require("compression");

const app = express();

// ミドルウェア設定
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ルート登録
app.use("/", require("./routes/webhook"));

// サーバ起動
app.listen(3000, () => {
  console.log(`${process.pid} started`);
});
