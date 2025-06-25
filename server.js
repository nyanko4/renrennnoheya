const express = require("express");
const session = require("express-session");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const compression = require("compression");
const path = require("path");

const app = express();

// ミドルウェア設定
app.use(express.json());
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use(compression());
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

// セッション設定
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: true,
  cookie: { maxAge: 5 * 24 * 60 * 60 * 1000 },
}));

// 認証ミドルウェア
app.use((req, res, next) => {
  const publicRoutes = ["/login", "/getchat", "/mention", "/quiz"];
  if (!publicRoutes.includes(req.path) && req.cookies.nyanko_a !== "ok") {
    req.session.redirectTo = req.path !== "/" ? req.path : null;
    return res.redirect("/login");
  } else {
    next();
  }
});

// ルート登録
app.use("/", require("./routes/index"));
app.use("/", require("./routes/auth"));
app.use("/api", require("./routes/api"));
app.use("/", require("./routes/webhook"));

// サーバ起動
app.listen(3000, () => {
  console.log(`${process.pid} started`);
});
