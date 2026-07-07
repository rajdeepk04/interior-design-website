const express = require('express');
const router = express.Router();
const { getDB } = require('../database/db');

router.get('/status', async (_req, res) => {
  try {
    const db = getDB();
    const [[{ dbName }]] = await db.query('SELECT DATABASE() as dbName');

    // Helper to safely get counts (returns null if table missing)
    async function countTable(name) {
      try {
        const [[{ cnt }]] = await db.query(`SELECT COUNT(*) as cnt FROM \`${name}\``);
        return Number(cnt || 0);
      } catch (_e) {
        return null;
      }
    }

    const counts = {
      designs: await countTable('designs'),
      contact: await countTable('contact'),
      bookings: await countTable('bookings'),
      reviews: await countTable('reviews'),
      users: await countTable('users')
    };

    return res.json({ dbName, counts });
  } catch (error) {
    return res.status(500).json({ message: 'Unable to read database status', error: String(error) });
  }
});

module.exports = router;
