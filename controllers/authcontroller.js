const { getDB } = require("../database/db");
const crypto = require("crypto");
const nodemailer = require("nodemailer");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken"); // 🔥 MISSING (IMPORTANT)

require("dotenv").config();

/* ================================
   EMAIL SETUP
================================ */
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

/* ================================
   REGISTER USER
================================ */
async function registerUser(req, res) {
  try {
    let { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        message: "All fields required"
      });
    }

    const db = getDB();

    email = email.trim().toLowerCase();

    const [existing] = await db.query(
      "SELECT id FROM users WHERE email = ? LIMIT 1",
      [email]
    );

    if (existing.length > 0) {
      return res.status(400).json({
        message: "Email already registered"
      });
    }

    const hashedPassword = await bcrypt.hash(password.trim(), 10);

    await db.query(
      `INSERT INTO users (name, email, password, role)
       VALUES (?, ?, ?, ?)`,
      [name.trim(), email, hashedPassword, "user"]
    );

    res.json({
      message: "Registration successful"
    });

  } catch (error) {
    console.error("❌ Register Error:", error);
    res.status(500).json({ message: "Server error" });
  }
}

/* ================================
   LOGIN USER (FINAL FIX 🔥)
================================ */
async function loginUser(req, res) {
  try {
    let { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: "Email and password required"
      });
    }

    const db = getDB();

    email = email.trim().toLowerCase();
    const trimmedPassword = password.trim();
    const configuredAdminEmail = (process.env.ADMIN_EMAIL || "admin@luxestudio.com").trim().toLowerCase();
    const configuredAdminPassword = process.env.ADMIN_PASSWORD || "LuxeAdmin@2026";
    const configuredAdminName = (process.env.ADMIN_NAME || "Luxe Admin").trim();

    if (
      configuredAdminEmail &&
      email === configuredAdminEmail &&
      trimmedPassword === configuredAdminPassword
    ) {
      const role = "admin";
      const token = jwt.sign(
        {
          id: 0,
          role,
          email: configuredAdminEmail
        },
        process.env.JWT_SECRET || "luxe-interiors-secret",
        { expiresIn: "1d" }
      );

      return res.json({
        message: "Login successful",
        token,
        role,
        user: {
          id: 0,
          name: configuredAdminName,
          email: configuredAdminEmail,
          role
        }
      });
    }

    const [rows] = await db.query(
      "SELECT * FROM users WHERE email = ? LIMIT 1",
      [email]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        message: "User not found"
      });
    }

    const user = rows[0];

    const isMatch = await bcrypt.compare(trimmedPassword, user.password);

    if (!isMatch) {
      return res.status(401).json({
        message: "Invalid password"
      });
    }

    const role = user.email === configuredAdminEmail ? "admin" : (user.role || "user");

    if (role === "admin" && user.role !== "admin") {
      await db.query(
        "UPDATE users SET role = 'admin' WHERE id = ?",
        [user.id]
      );
    }

    // ✅ TOKEN
    const token = jwt.sign(
      {
        id: user.id,
        role: role,
        email: user.email
      },
      process.env.JWT_SECRET || "luxe-interiors-secret",
      { expiresIn: "1d" }
    );

    // ✅ FINAL RESPONSE (VERY IMPORTANT)
    res.json({
      message: "Login successful",
      token,
      role,
      user: {
        id: user.id,
        name: user.name,   // 🔥 fixes profile name
        email: user.email,
        role
      }
    });

  } catch (error) {
    console.error("❌ Login Error:", error);
    res.status(500).json({ message: "Server error" });
  }
}

/* ================================
   FORGOT PASSWORD
================================ */
async function forgotPassword(req, res) {
  try {
    let { email } = req.body;

    if (!email) {
      return res.status(400).json({
        message: "Email is required"
      });
    }

    const db = getDB();

    email = email.trim().toLowerCase();

    const [rows] = await db.query(
      "SELECT id FROM users WHERE email = ? LIMIT 1",
      [email]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        message: "User not found"
      });
    }

    const user = rows[0];

    const resetToken = crypto.randomBytes(32).toString("hex");
    const expiry = new Date(Date.now() + 60 * 60 * 1000);

    await db.query(
      `UPDATE users
       SET reset_token = ?, reset_token_expiry = ?
       WHERE id = ?`,
      [resetToken, expiry, user.id]
    );

    const resetLink =
      `http://localhost:5500/reset-password.html?token=${encodeURIComponent(resetToken)}`;

    console.log("✅ Reset Link:", resetLink);

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Password Reset",
      html: `
        <h3>Password Reset</h3>
        <a href="${resetLink}">Reset Password</a>
        <p>Expires in 1 hour</p>
      `
    });

    res.json({
      message: "Reset link sent to email"
    });

  } catch (error) {
    console.error("❌ Forgot Password Error:", error);
    res.status(500).json({
      message: "Email sending failed"
    });
  }
}

/* ================================
   RESET PASSWORD
================================ */
async function resetPassword(req, res) {
  try {
    const { token } = req.params;
    const { password } = req.body;

    if (!token || !password) {
      return res.status(400).json({
        message: "Token and password required"
      });
    }

    const db = getDB();

    const [rows] = await db.query(
      `SELECT id FROM users
       WHERE reset_token = ?
       AND reset_token_expiry > NOW()
       LIMIT 1`,
      [token]
    );

    if (rows.length === 0) {
      return res.status(400).json({
        message: "Invalid or expired token"
      });
    }

    const user = rows[0];

    const hashedPassword = await bcrypt.hash(password.trim(), 10);

    await db.query(
      `UPDATE users
       SET password = ?, reset_token = NULL, reset_token_expiry = NULL
       WHERE id = ?`,
      [hashedPassword, user.id]
    );

    res.json({
      message: "Password reset successful"
    });

  } catch (error) {
    console.error("❌ Reset Error:", error);
    res.status(500).json({
      message: "Server error"
    });
  }
}

/* ================================
   EXPORTS
================================ */
module.exports = {
  registerUser,
  loginUser,
  forgotPassword,
  resetPassword
};
