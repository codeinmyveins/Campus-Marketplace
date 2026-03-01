require("dotenv").config();
const CustomAPIError = require("../errors/custom-api");
const { StatusCodes } = require("http-status-codes");
const pool = require("../db/database");
const supabase = require("../utils/supabase");
const { getCountryCallingCode } = require("libphonenumber-js");

const path = require("path");

const { validateUserInfo } = require("../validator");
const { STATUS_CODES } = require("http");

const getCurrentUser = async (req, res) => {

    const { user: { userId }, query: { sensitive } } = req;

    const { rowCount, rows: users } = await pool.query(
        `SELECT u.id, u.username, u.full_name, u.country_code, c.name college_name, u.avatar_url, u.bio
            ${sensitive?.toLowerCase()==="true"?",u.email,to_char(u.dob, 'DD/MM/YYYY') AS dob,u.phone,u.gender":""}
        FROM users u
        LEFT JOIN colleges c ON u.college_id = c.id
        WHERE u.id = $1`,
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

    const { identfier } = req.params;
    let type = "username";
    if (req.query?.id?.toLowerCase() === "true") {
        type = "id";
    }
    if (!identfier) {
        throw new CustomAPIError(`No ${type} provided`, StatusCodes.BAD_REQUEST);
    }

    const { rowCount, rows: users } = await pool.query(
        `SELECT u.id, u.username, u.full_name, u.country_code, c.name college_name, u.avatar_url, u.bio
        FROM users u
        LEFT JOIN colleges c ON u.college_id = c.id
        WHERE u.${type} = $1`,
        [identfier.toLowerCase()]
    );

    if (rowCount === 0) {
        throw new CustomAPIError(`No user with ${type}: ${identfier} found`, StatusCodes.NOT_FOUND);
    }

    res.status(StatusCodes.OK).json({
        user: users[0]
    });

}

const contactUser = async (req, res) => {

    const userId = req.params.id;

    const { rowCount, rows: users } = await pool.query("SELECT phone FROM users WHERE id = $1",
        [userId]
    );
    if (rowCount === 0) {
        throw CustomAPIError("User not found", StatusCodes.NOT_FOUND);
    }

    res.status(StatusCodes.OK).json({
        user_phone :users[0].phone
    });

}

const editUser = async (req, res) => {

    const { error, value: joiValue } = validateUserInfo(req.body);
    if (error) {
        throw new CustomAPIError(error.details[0].message, StatusCodes.BAD_REQUEST);
    }

    const { userId } = req.user;
    const { username, full_name, college_id, gender, dob, phone, country_code, bio } = joiValue;
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
    if (college_id) {
        const { rowCount: cllg_exists } = await pool.query("SELECT 1 FROM colleges WHERE id = $1", [college_id]);
        if (cllg_exists === 0) {
            throw new CustomAPIError("Unknown college provided", StatusCodes.BAD_REQUEST);
        }
        patched.college_id = college_id;
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
    const client = await pool.connect();

    try {
        if (!req.file) {
            return res.status(StatusCodes.BAD_REQUEST).json({ msg: "No file uploaded" });
        }

        const { userId } = req.user;

        const fileName = `${userId}-${Date.now()}`;

        const { error: uploadError } = await supabase.storage
            .from("avatars")
            .upload(fileName, req.file.buffer, {
                contentType: req.file.mimetype,
                upsert: false,
            });

        if (uploadError) {
            throw new CustomAPIError("Storage upload failed", StatusCodes.INTERNAL_SERVER_ERROR);
        }

        await client.query("BEGIN");

        const oldAvatarResult = await client.query(
            "SELECT avatar_url FROM users WHERE id = $1 FOR UPDATE",
            [userId]
        );

        const oldAvatar = oldAvatarResult.rows[0]?.avatar_url;

        const publicUrl = `${process.env.STORAGE_URL}/storage/v1/object/public/avatars/${fileName}`;

        // Update DB
        await client.query(
            "UPDATE users SET avatar_url = $1 WHERE id = $2",
            [publicUrl, userId]
        );

        await client.query("COMMIT");

        if (oldAvatar) {
            const oldFileName = oldAvatar.split("/").pop();
            await supabase.storage.from("avatars").remove([oldFileName]);
        }

        return res.status(StatusCodes.CREATED).json({
            msg: "Avatar updated successfully",
            avatar_url: publicUrl,
        });

    } catch (err) {
        await client.query("ROLLBACK");

        if (req.file) {
            try {
                const fileExt = path.extname(req.file.originalname);
                const fileName = `${req.user.id}-${Date.now()}${fileExt}`;
                await supabase.storage.from("avatars").remove([fileName]);
            } catch (_) {}
        }

        console.log(err);
        throw new CustomAPIError("Avatar update failed", StatusCodes.INTERNAL_SERVER_ERROR);

    } finally {
        client.release();
    }
}


module.exports = {
    getUser, getCurrentUser, editUser, putAvatarImage,
    contactUser
};
