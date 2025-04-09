// require("dotenv").config();
const CustomAPIError = require("../errors/custom-api");
const { StatusCodes } = require("http-status-codes");
const pool = require("../db/database");
const fs = require("fs");
const path = require("path");

const { validateItemPostInfoRequired, validateItemPostInfo } = require("../validator");

const getItem = async (req, res) => {

    const item_id = req.params.id;

    const { rowCount, rows: items } = pool.query("SELECT * FROM items WHERE id = $1", [item_id]);
    if (rowCount === 0) {
        throw new CustomAPIError(`No item with id ${item_id} found`, StatusCodes.NOT_FOUND);
    }

    req.status(StatusCodes.OK).json({ item: items[0] });

}


module.exports = {
    getItem,
}