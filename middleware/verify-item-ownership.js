require("dotenv").config();
const CustomAPIError = require("../errors/custom-api");
const { StatusCodes } = require("http-status-codes");
const pool = require("../db/database");

const verifyItemOwnership = async (req, res, next) => {

    const { rowCount } = await pool.query("SELECT 1 FROM items WHERE id = $1 AND user_id = $2",
        [req.params.id, req.user.userId]
    );

    if (rowCount === 0) {
        throw new CustomAPIError(`Item with id: ${req.params.id} not found`, StatusCodes.NOT_FOUND);
    }

    next();
}

module.exports = verifyItemOwnership;
