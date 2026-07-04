const jwt = require("jsonwebtoken");

function extractToken(req) {
  const authHeader = req.headers.authorization || "";

  if (authHeader.startsWith("Bearer ")) {
    return authHeader.slice(7).trim();
  }

  return authHeader.trim();
}

function verifyToken(req, res, next) {
  const token = extractToken(req);

  if (!token) {
    return res.status(401).json({
      message: "Authentication token is required."
    });
  }

  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "luxe-interiors-secret"
    );

    req.user = {
      id: decoded.id,
      role: decoded.role || "user",
      email: decoded.email || ""
    };

    return next();
  } catch (_error) {
    return res.status(401).json({
      message: "Invalid or expired token."
    });
  }
}

module.exports = verifyToken;
