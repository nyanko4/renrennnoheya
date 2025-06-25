const express = require("express");
const router = express.Router();
const mention = require("../webhook/mention");
const getchat = require("../webhook/getchat");
const quiz = require("../quiz/quiz")

router.post("/mention", (req, res) => {
  mention(req, res);
});

router.post("/getchat", (req, res) => {
  getchat(req, res);
});

router.post("/quiz", (req, res) => {
  quiz(req, res)
})

module.exports = router;
