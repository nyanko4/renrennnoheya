const express = require("express");

const app = express();

// ミドルウェア設定
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ルート登録
app.use("/", require("./routes/webhook"));
app.get("/", (req, res) => {
  res.send("<a href='/proxy'>proxy</a><br>
           <a href='/renrenproxy'>れんにゃんproxy</a><br>")
           <a href='/senden'>宣伝部屋</a><br>")
})
app.use("/member", require("./routes/member"))
app.get('/send', (req, res) => {
  res.json(process.versions);
});

// サーバ起動
app.listen(3000, () => {
  console.log(`${process.pid} started`);
});
