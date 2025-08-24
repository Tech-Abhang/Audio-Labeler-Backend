const express = require("express");
const router = express.Router();
const { register, login, logout, checkAuthStatus, getUserData,} = require("../controllers/authController.js");
const { isLogin } = require("../middleware/isLogin");

// Register route
router.post("/register", register);

// Login route
router.post("/login", login);

router.get("/get-user", isLogin, getUserData);

//Check Auth
router.post("/check-auth", checkAuthStatus);

// Logout route
router.delete("/logout", logout);

module.exports = router;