const express = require("express");
const { getDatapoint, addLabel } = require("../controllers/labelerController");
const { isLogin } = require("../middleware/isLogin");

const router = express.Router();

router.get("/get-datapoint", isLogin, getDatapoint);
router.post("/add-label", isLogin, addLabel);

module.exports = router;