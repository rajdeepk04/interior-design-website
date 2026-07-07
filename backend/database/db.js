const mysql = require("mysql2/promise");
const bcrypt = require("bcrypt");

let pool;

const seedDesigns = [
  {
    title: "Modern Haven Living Room",
    category: "residential",
    style: "Warm Minimal Luxury",
    area: "680 sq ft",
    timeline: "8 weeks",
    year: "2026",
    description: "Soft neutrals, sculptural seating, and layered lighting for a calm family lounge.",
    longDescription: "This concept balances contemporary silhouettes with natural warmth. The room uses soft architectural lines, tailored upholstery, and premium finishes to create an interior that feels elegant without becoming cold or overworked.",
    image: "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=1200&q=80",
    heroImage: "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=1400&q=80",
    gallery: JSON.stringify([
      "https://images.unsplash.com/photo-1600607687644-aac4c3eac7f4?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1600210492493-0946911123ea?auto=format&fit=crop&w=1200&q=80"
    ])
  },
  {
    title: "Skyline Executive Lounge",
    category: "commercial",
    style: "Urban Prestige",
    area: "920 sq ft",
    timeline: "10 weeks",
    year: "2026",
    description: "Dark woods, bronze detailing, and statement furniture for premium client-facing spaces.",
    longDescription: "Designed for executive meetings and quiet conversations, this lounge uses deep tonal contrast, sculptural lighting, and hospitality-grade finishes to reinforce confidence and calm.",
    image: "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1200&q=80",
    heroImage: "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1400&q=80",
    gallery: JSON.stringify([
      "https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1555529771-7888783a18d3?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=1200&q=80"
    ])
  },
  {
    title: "Stone & Timber Kitchen",
    category: "kitchen",
    style: "Textured Contemporary",
    area: "540 sq ft",
    timeline: "7 weeks",
    year: "2025",
    description: "An open kitchen concept with natural stone counters and warm oak cabinetry.",
    longDescription: "This kitchen balances utility and atmosphere with clean joinery, subtle contrast, and a generous island for cooking, gathering, and entertaining.",
    image: "https://images.unsplash.com/photo-1556912172-45b7abe8b7e1?auto=format&fit=crop&w=1200&q=80",
    heroImage: "https://images.unsplash.com/photo-1556912172-45b7abe8b7e1?auto=format&fit=crop&w=1400&q=80",
    gallery: JSON.stringify([
      "https://images.unsplash.com/photo-1556909212-d5b604d0c90d?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1595514535415-dae2c29a9e4d?auto=format&fit=crop&w=1200&q=80"
    ])
  }
];

async function ensureAdminUser() {
  const adminEmail = (process.env.ADMIN_EMAIL || "admin@luxestudio.com").trim().toLowerCase();
  const adminPassword = process.env.ADMIN_PASSWORD || "LuxeAdmin@2026";
  const adminName = (process.env.ADMIN_NAME || "Luxe Admin").trim();

  const [rows] = await pool.query(
    "SELECT id FROM users WHERE email = ? LIMIT 1",
    [adminEmail]
  );

  const hashedPassword = await bcrypt.hash(adminPassword, 10);

  if (rows.length > 0) {
    await pool.query(
      `UPDATE users
       SET name = ?, password = ?, role = 'admin'
       WHERE id = ?`,
      [adminName, hashedPassword, rows[0].id]
    );
    return;
  }

  await pool.query(
    `INSERT INTO users (name, email, password, role)
     VALUES (?, ?, ?, 'admin')`,
    [adminName, adminEmail, hashedPassword]
  );
}

async function seedInitialDesigns() {
  const [rows] = await pool.query("SELECT COUNT(*) AS count FROM designs");

  if ((rows[0]?.count || 0) > 0) {
    return;
  }

  for (const design of seedDesigns) {
    await pool.query(
      `INSERT INTO designs
        (title, category, style, area, timeline, year, image, hero_image, description, long_description, gallery)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        design.title,
        design.category,
        design.style,
        design.area,
        design.timeline,
        design.year,
        design.image,
        design.heroImage,
        design.description,
        design.longDescription,
        design.gallery
      ]
    );
  }
}

async function ensureColumn(tableName, columnName, definition) {
  const [rows] = await pool.query(
    `SELECT COUNT(*) AS count
     FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = ?
       AND TABLE_NAME = ?
       AND COLUMN_NAME = ?`,
    [process.env.DB_NAME || "Interiord", tableName, columnName]
  );

  if (rows[0]?.count) {
    return;
  }

  await pool.query(
    `ALTER TABLE \`${tableName}\` ADD COLUMN ${definition}`
  );
}

// Initialize Database
async function initializeDatabase() {
  try {

    // Step 1 — Create database if not exists
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || "localhost",
      user: process.env.DB_USER || "root",
      password: process.env.DB_PASSWORD || "raj@0416#"
    });

    await connection.query(
      `CREATE DATABASE IF NOT EXISTS \`${process.env.DB_NAME || "Interiord"}\``
    );

    console.log(`Database '${process.env.DB_NAME || "Interiord"}' ready`);

    // Step 2 — Create pool
    pool = mysql.createPool({
      host: process.env.DB_HOST || "localhost",
      user: process.env.DB_USER || "root",
      password: process.env.DB_PASSWORD || "raj@0416#",
      database: process.env.DB_NAME || "Interiord",
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0
    });

    // Step 3 — Create tables

    await pool.query(`
      CREATE TABLE IF NOT EXISTS bookings (
        id INT PRIMARY KEY AUTO_INCREMENT,
        user_name VARCHAR(100) NOT NULL,
        email VARCHAR(150) NOT NULL,
        project_type VARCHAR(100) NOT NULL,
        preferred_date DATE,
        time_slot VARCHAR(40),
        budget VARCHAR(80),
        room_images TEXT,
        requirements TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await pool.query(`
      CREATE TABLE IF NOT EXISTS contact (
        id INT PRIMARY KEY AUTO_INCREMENT,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(150) NOT NULL,
        phone VARCHAR(30) NOT NULL DEFAULT '',
        subject VARCHAR(200),
        message TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT PRIMARY KEY AUTO_INCREMENT,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(150) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        role VARCHAR(20) NOT NULL DEFAULT 'user',
        reset_token VARCHAR(255),
        reset_token_expiry DATETIME,
        last_login_at TIMESTAMP NULL DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await pool.query(`
      CREATE TABLE IF NOT EXISTS designs (
        id INT PRIMARY KEY AUTO_INCREMENT,
        title VARCHAR(150) NOT NULL,
        category VARCHAR(80) NOT NULL,
        style VARCHAR(120) DEFAULT 'Signature Luxe',
        area VARCHAR(80) DEFAULT 'Custom',
        timeline VARCHAR(80) DEFAULT 'Flexible',
        year VARCHAR(10) DEFAULT '',
        image TEXT,
        hero_image TEXT,
        description TEXT,
        long_description TEXT,
        gallery JSON,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
    await pool.query(`
      CREATE TABLE IF NOT EXISTS wishlist (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        design_id INT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await pool.query(`
      CREATE TABLE IF NOT EXISTS reviews (
        id INT PRIMARY KEY AUTO_INCREMENT,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(150) DEFAULT '',
        rating INT NOT NULL DEFAULT 5,
        \`comment\` TEXT,
        page VARCHAR(120) DEFAULT '',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await ensureColumn("users", "role", "`role` VARCHAR(20) NOT NULL DEFAULT 'user'");
    await ensureColumn("designs", "style", "`style` VARCHAR(120) DEFAULT 'Signature Luxe'");
    await ensureColumn("designs", "area", "`area` VARCHAR(80) DEFAULT 'Custom'");
    await ensureColumn("designs", "timeline", "`timeline` VARCHAR(80) DEFAULT 'Flexible'");
    await ensureColumn("designs", "year", "`year` VARCHAR(10) DEFAULT ''");
    await ensureColumn("designs", "hero_image", "`hero_image` TEXT");
    await ensureColumn("designs", "long_description", "`long_description` TEXT");
    await ensureColumn("designs", "gallery", "`gallery` JSON");
    await ensureColumn("designs", "catalog_identity", "`catalog_identity` VARCHAR(255) DEFAULT NULL");
    await ensureColumn("designs", "is_hidden", "`is_hidden` TINYINT(1) NOT NULL DEFAULT 0");
    await ensureColumn("designs", "is_archived", "`is_archived` TINYINT(1) NOT NULL DEFAULT 0");
    await ensureColumn("designs", "updated_at", "`updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP");
    await ensureColumn("reviews", "name", "`name` VARCHAR(100) NOT NULL DEFAULT 'Anonymous'");
    await ensureColumn("reviews", "user_name", "`user_name` VARCHAR(100) NOT NULL DEFAULT 'Anonymous'");
    await ensureColumn("reviews", "rating", "`rating` INT NOT NULL DEFAULT 5");
    await ensureColumn("reviews", "comment", "`comment` TEXT");
    await ensureColumn("reviews", "email", "`email` VARCHAR(150) DEFAULT ''");
    await ensureColumn("reviews", "page", "`page` VARCHAR(120) DEFAULT ''");
    await ensureColumn("users", "avatar", "`avatar` VARCHAR(255) DEFAULT NULL");
    // Soft-delete (archive) flags for admin-managed lists
    await ensureColumn("contact", "is_archived", "`is_archived` TINYINT(1) NOT NULL DEFAULT 0");
    await ensureColumn("bookings", "is_archived", "`is_archived` TINYINT(1) NOT NULL DEFAULT 0");
    await ensureColumn("reviews", "is_archived", "`is_archived` TINYINT(1) NOT NULL DEFAULT 0");

    await ensureAdminUser();
    await seedInitialDesigns();

    console.log("Tables ready");

  } catch (error) {
    console.error("Database initialization error:", error);
    throw error;
  }
}

// Safe getter
function getDB() {
  if (!pool) {
    throw new Error("Database pool not initialized");
  }
  return pool;
}

module.exports = {
  initializeDatabase,
  getDB
};
