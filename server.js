"use strict";
const express = require("express");
let app = express();
app.listen(3000, () => {
  console.log(`${process.pid} started`);
});
const https = require("https");
const mention = require("./webhook/mention");
const getchat = require("./webhook/getchat");

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/", (req, res) => {
  res.end(JSON.stringify(process.versions, null, 2));
});

app.post("/mention", (req, res) => {
  mention(req, res);
});

app.post("/getchat", (req, res) => {
  getchat(req, res);
});
