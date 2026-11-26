const express = require("express");
const router = express.Router();

const passwordController = require("../controller/passwordController");

router.post("/forgotpassword", passwordController.forgotPassword);

module.exports = router;