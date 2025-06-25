const express = require("express");
const router = express.Router();

router.get("/login", (req, res) => {
  res.render("login", { error: null });
});

router.post("/login", (req, res) => {
  const password = req.body.password;
  if (password === process.env.password) {
    res.cookie("nyanko_a", "ok", {
      maxAge: 5 * 24 * 60 * 60 * 1000,
      httpOnly: true,
    });
    const redirectTo = req.session.redirectTo || "/";
    delete req.session.redirectTo;
    return res.redirect(redirectTo);
  } else {
    res.render("login", {
      error: "パスワードが間違っています。もう一度お試しください。",
    });
  }
});

module.exports = router;
