const express = require("express");

const app = express();

// ミドルウェア設定
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ルート登録
app.get("/", (req, res) => {
  res.send(`
    <a href='/member/proxy'>proxy</a><br>
    <a href='/member/renrenproxy'>れんにゃんproxy</a><br>
    <a href='/member/senden'>宣伝部屋</a><br>
  `);
})
app.use("/member", require("./routes/member"))
app.use("/", require("./routes/webhook"));
app.get('/send', (req, res) => {
  res.json(process.versions);
});

// サーバ起動
app.listen(3000, () => {
  console.log(`${process.pid} started`);
});
