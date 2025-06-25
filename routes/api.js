const express = require("express");
const router = express.Router();
const supabase = require("../supabase/client");

// 追加
router.post("/items", async (req, res) => {
  const { accountId, name, result, table, moduleReason } = req.body;
  const nameKey = table === "ブラックリスト" ? "理由" : "名前";
  const resultKey = table === "ブラックリスト" ? "回数" : "結果";

  const insertData = { accountId };
  insertData[nameKey] = name;
  insertData[resultKey] = result;
  if (table === "ブラックリスト") insertData["モジュール理由"] = moduleReason || "不明";

  try {
    const { error } = await supabase.from(table).insert([insertData]);
    if (error) throw error;
    res.status(200).json({ message: "追加成功" });
  } catch (error) {
    res.status(500).json({ message: "追加失敗", error: error.message });
  }
});

// 更新
router.put("/items/:id", async (req, res) => {
  const { id } = req.params;
  const { name, result, table } = req.body;
  const nameKey = table === "ブラックリスト" ? "理由" : "名前";
  const resultKey = table === "ブラックリスト" ? "回数" : "結果";

  const updateData = {};
  updateData[nameKey] = name;
  updateData[resultKey] = result;

  try {
    const { error } = await supabase.from(table).update(updateData).eq("accountId", id);
    if (error) throw error;
    res.status(200).json({ message: "更新成功" });
  } catch (error) {
    res.status(500).json({ message: "更新失敗", error: error.message });
  }
});

// 削除
router.delete("/items/:id", async (req, res) => {
  const { id } = req.params;
  const table = req.query.table;

  try {
    const { error } = await supabase.from(table).delete().eq("accountId", id);
    if (error) throw error;
    res.status(200).json({ message: "削除成功" });
  } catch (error) {
    res.status(500).json({ message: "削除失敗", error: error.message });
  }
});

module.exports = router;
