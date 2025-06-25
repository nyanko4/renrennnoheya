const express = require("express");
const router = express.Router();
const mention = require("../webhook/mention");
const getchat = require("../webhook/getchat");

router.post("/mention", (req, res) => {
  mention(req, res);
});

router.post("/getchat", (req, res) => {
  getchat(req, res);
});

module.exports = router;
