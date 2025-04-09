const express = require("express");
const { getItem, } = require("../controllers/items");

const router = express.Router();

router.route("/:id").get(getItem);

module.exports = router;