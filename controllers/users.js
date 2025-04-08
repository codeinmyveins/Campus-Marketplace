require("dotenv").config();
const CustomAPIError = require("../errors/custom-api");
const { StatusCodes } = require("http-status-codes");
const pool = require("../db/database");

const getCurrentUser = async (req, res) => {

    const { user: { userId }, query: { sensitive } } = req;

    const { rowCount, rows: users } = await pool.query(
        `SELECT id, username, full_name, country_code, college_name, avatar_url${sensitive==="true"?",email,to_char(dob, 'DD/MM/YYYY') AS dob,phone,gender":""} bio FROM users WHERE id = $1`,
        [userId]
    );

    if (rowCount === 0) {
        throw new CustomAPIError("Invalid User", StatusCodes.UNAUTHORIZED);
    }

    res.status(StatusCodes.OK).json({
        user: users[0]
    });

}

const getUser = async (req, res) => {

    const { username } = req.params;
    if (!username) {
        throw new CustomAPIError("No username provided", StatusCodes.BAD_REQUEST);
    }

    const { rowCount, rows: users } = await pool.query(
        "SELECT id, username, full_name, country_code, college_name, avatar_url, bio FROM users WHERE username = $1",
        [username]
    );

    if (rowCount === 0) {
        throw new CustomAPIError(`No user with username: ${username} found`, StatusCodes.NOT_FOUND);
    }

    res.status(StatusCodes.OK).json({
        user: users[0]
    });

}

const editUser = async (req, res) => {

    // const { error } = validateUserInfo(req.body)
    // if (error) {
    //     throw new CustomAPIError(error.details[0].message, StatusCodes.BAD_REQUEST);
    // }

}


module.exports = { getUser, getCurrentUser };