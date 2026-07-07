const express = require("express");
const router = express.Router();
const db = require("../db");

// GET all wishlist items
router.get("/", (req, res) => {
  db.query("SELECT * FROM wishlist", (err, result) => {
    if (err) return res.status(500).json(err);
    res.json(result);
  });
});

// ADD item
router.post("/", (req, res) => {
  const { title, category, image } = req.body;

  const sql = "INSERT INTO wishlist (title, category, image) VALUES (?, ?, ?)";
  db.query(sql, [title, category, image], (err, result) => {
    if (err) return res.status(500).json(err);
    res.json({ message: "Item added ✅" });
  });
});

// DELETE item
router.delete("/:id", (req, res) => {
  const sql = "DELETE FROM wishlist WHERE id = ?";
  db.query(sql, [req.params.id], (err) => {
    if (err) return res.status(500).json(err);
    res.json({ message: "Item removed ❌" });
  });
});

module.exports = router;
// ADD item (with duplicate check)
router.post("/", (req, res) => {
  const { title, category, image } = req.body;

  const checkSql = "SELECT * FROM wishlist WHERE title = ?";
  
  db.query(checkSql, [title], (err, result) => {
    if (result.length > 0) {
      return res.json({ message: "Already in wishlist ⚠️" });
    }

    const insertSql = "INSERT INTO wishlist (title, category, image) VALUES (?, ?, ?)";
    
    db.query(insertSql, [title, category, image], (err) => {
      if (err) return res.status(500).json(err);
      res.json({ message: "Added ✅" });
    });
  });
});