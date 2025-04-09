require("dotenv").config();
const CustomAPIError = require("../errors/custom-api");
const { StatusCodes } = require("http-status-codes");
const pool = require("../db/database");
const { getCountryCallingCode } = require("libphonenumber-js");
const fs = require("fs");
const path = require("path");

const { validateUserInfo } = require("../validator");

const getCurrentUser = async (req, res) => {

    const { user: { userId }, query: { sensitive } } = req;

    const { rowCount, rows: users } = await pool.query(
        `SELECT id, username, full_name, country_code, college_name, avatar_url${sensitive.toLowerCase()==="true"?",email,to_char(dob, 'DD/MM/YYYY') AS dob,phone,gender":""} bio FROM users WHERE id = $1`,
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

    const { error } = validateUserInfo(req.body);
    if (error) {
        throw new CustomAPIError(error.details[0].message, StatusCodes.BAD_REQUEST);
    }

    const { userId } = req.user;
    const { username, full_name, college_name, gender, dob, phone, country_code, bio } = req.body;
    const patched = {};

    if (phone) {
        patched.phone = phone;
    }
    if (country_code) {
        patched.country_code = country_code;
    }
    if (username) {
        patched.username = username;
    }
    if (full_name) {
        patched.full_name = full_name;
    }
    if (college_name) {
        patched.college_name = college_name;
    }
    if (gender) {
        patched.gender = gender;
    }
    if (dob) {
        patched.dob = dob;
    }
    if (bio) {
        patched.bio = bio;
    }

    if (Object.keys(patched) === 0) {
        throw new CustomAPIError("Please provide the fields", StatusCodes.BAD_REQUEST);
    }

    if (!(phone && country_code) && (phone || country_code)) {
        const { rows: users } = await pool.query("SELECT country_code, phone FROM users WHERE id = $1", [userId]);
        if (phone) {
            patched.country_code = users[0].country_code;
        }
        if (country_code) {
            patched.phone = users[0].phone.split(" ")[1];
        }
    }

    let completePhone = undefined;
    if (phone || country_code) {
        try {
            completePhone = "+" + getCountryCallingCode(patched.country_code) + " " + patched.phone;
        } catch (error) {
            throw new CustomAPIError("Invalid country code", StatusCodes.BAD_REQUEST);
        }
    }
    if (completePhone) {
        patched.phone = completePhone;
    }

    if (username || completePhone) {
        // unique check in users with same username or email check
        const {rows: existingUsers} = await pool.query("SELECT username, email FROM users WHERE (username = $1 OR phone = $2)",
            [username, completePhone]
        );
        const { rows: existingPreUsers } = await pool.query("SELECT username, email FROM pre_users WHERE (username = $1 OR phone = $2) AND status = 'verified' AND NOT id = $3",
            [username, completePhone, userId]
        );
    
        let takenFields = [null, null];
        for (let user of [...existingUsers, ...existingPreUsers]) {
            if (user.username === username) takenFields[0] = "Username";
            if (user.phone === completePhone) takenFields[1] = "Phone";
        }
        takenFields = takenFields.filter(e => e)
    
        if (takenFields.length > 0) {
            throw new CustomAPIError(
                `The following field(s) are already taken: ${takenFields.join(", ")}`,
                StatusCodes.CONFLICT);
        }
    }

    const inputKeys = Object.keys(patched);
    const columnName = inputKeys.map((key, index) => `${key} = $${index+1}`).join(", ");
    const values = [...inputKeys.map((k) => patched[k]), userId];

    const { rowCount } = await pool.query("UPDATE users SET " + columnName +
        " WHERE id = $" + (values.length).toString(),
        values
    );
    if (rowCount < 1) {
        throw new CustomAPIError(`Internal server error, please try again`, StatusCodes.INTERNAL_SERVER_ERROR);
    }
    
    res.status(StatusCodes.OK).json({ msg: "Changes saved successfully", patched: inputKeys });

}


const putAvatarImage = async (req, res) => {

    if (!req.file) {
        throw new CustomAPIError("No avatar image file uploaded", StatusCodes.BAD_REQUEST);
    }

    const { userId } = req.user;

    // await pool.query("UPDATE users SET avatar_url = $1 WHERE id = $2",
    //     [null, userId]);
    const {rows: users} = await pool.query("SELECT avatar_url FROM users WHERE id = $1",
        [userId]);
    const old_path = users[0].avatar_url;
    
    await pool.query("UPDATE users SET avatar_url = $1 WHERE id = $2",
        [req.file.path, userId]);
    
    if (old_path !== null) {
        fs.unlink(path.join(__dirname, "../", old_path), (err) => {
            if (err) console.error(err);
        });
    }
    
    res.status(StatusCodes.CREATED).json({
        msg: "Avatar image uploaded successfully",
        url: req.file.path
    });
}

module.exports = { getUser, getCurrentUser, editUser, putAvatarImage };