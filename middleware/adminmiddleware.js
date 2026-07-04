function isadmin(req, res, next) {
  // ✅ Check if user exists
  if (!req.user) {
    return res.status(401).json({
      message: "Not authorized, no user found"
    });
  }

  // ✅ Check role
  if (req.user.role === "admin") {
    next();
  } else {
    return res.status(403).json({
      message: "Access denied: Admin only"
    });
  }
}

module.exports = isadmin;