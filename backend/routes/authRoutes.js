const express = require("express");
const router = express.Router();

const {
  registerUser,
  loginUser,
  forgotPassword,
  resetPassword
} = require("../controllers/authcontroller");


// ================================
// TEST ROUTE
// ================================

router.get("/test", (req, res) => {

  res.json({
    message: "Auth route working"
  });

});


// ================================
// REGISTER ROUTE
// ================================

router.post(
  "/register",
  registerUser
);


// ================================
// LOGIN ROUTE
// ================================

router.post(
  "/login",
  loginUser
);


// ================================
// FORGOT PASSWORD
// ================================

router.post(
  "/forgot-password",
  forgotPassword
);


// ================================
// RESET PASSWORD
// ================================

router.post(
  "/reset-password/:token",
  resetPassword
);

module.exports = router;