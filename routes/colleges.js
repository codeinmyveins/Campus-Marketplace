const express = require("express");

const { getColleges } = require("../controllers/colleges");

const router = express.Router();

router.route("/").get(getColleges);

module.exports = router;
