const express = require("express");
const router = express.Router();
const supabase = require("../supabase/client");

router.get("/", async (req, res) => {
  const selectedTable = req.query.table === "ブラックリスト" ? "ブラックリスト" : "おみくじ";
  const nameColumn = selectedTable === "ブラックリスト" ? "理由" : "名前";
  const resultColumn = selectedTable === "ブラックリスト" ? "回数" : "結果";

  try {
    const { data: items, error } = await supabase.from(selectedTable).select("*");
    if (error) throw error;
    res.render("index", { items, selectedTable, nameColumn, resultColumn });
  } catch (error) {
    console.error("データ取得エラー:", error);
    res.status(500).send("データの取得に失敗しました");
  }
});

module.exports = router;