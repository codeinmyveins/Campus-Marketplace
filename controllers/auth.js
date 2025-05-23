require("dotenv").config();
const CustomAPIError = require("../errors/custom-api");
const { StatusCodes } = require("http-status-codes");
const pool = require("../db/database");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken")
const redis = require("../redis/redis");
const crypto = require("crypto");
const emailTransporter = require("../mailer/transporter");
const { getCountryCallingCode } = require("libphonenumber-js");
const UAParser = require('ua-parser-js');
const axios = require("axios");
const {
    validateRegisterInitial,
    validateOTP,
    validateEmail,
    validateRegisterComplete,
    validateLogin,
    validateDeviceFingerprint
} = require("../validator");
const { STATUS } = require("../db/enums");

function generateOTP() {
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpId = crypto.randomUUID().toString();

    return { otp, otpId };
}

const registerInitial = async (req, res) => {

    // Joi validation
    const { error, value: joiValue } = validateRegisterInitial(req.body);
    if (error) {
        throw new CustomAPIError(error.details[0].message, StatusCodes.BAD_REQUEST);
    }

    const { username, email:inputEmail, password } = joiValue;
    const email = inputEmail.toLowerCase();

    // prune unverified pre_users older than one hour
    await pool.query("DELETE FROM pre_users WHERE status = 'unverified' AND created_at <= NOW() - INTERVAL '1 hour'");

    // unique check in users with same username or email check
    const {rows: existingUsers} = await pool.query("SELECT username, email FROM users WHERE username = $1 OR email = $2",
        [username, email]
    );
    const { rows: existingPreUsers } = await pool.query("SELECT username, email FROM pre_users WHERE (username = $1 OR email = $2) AND status = 'verified'",
        [username, email]
    );

    let takenFields = [null, null];
    for (let user of [...existingUsers, ...existingPreUsers]) {
        if (user.username === username) takenFields[0] = "Username";
        if (user.email === email) takenFields[1] = "Email";
    }
    takenFields = takenFields.filter(e => e);
    // generating error message
    if (takenFields.length > 0) {
        throw new CustomAPIError(
            `The following field(s) are already taken: ${takenFields.join(", ")}`,
            StatusCodes.CONFLICT);
    }

    //password hashing
    const hashedPassword = await bcrypt.hash(password, 10);
    const { rows: newUser } = await pool.query("INSERT INTO pre_users (username, email, password) VALUES ($1, $2, $3) Returning id, status",
        [username, email, hashedPassword]
    );

    // One Time Password generating/ 5 min expiration
    const { otp, otpId } = generateOTP();
    redis.set(`otpId:${otpId}`, otp, "EX", 60 * 5);
    redis.set(`userId:${newUser[0].id}`, otpId, "EX", 60 * 5);
    console.log(`OTP to ${email}`, otp);

    // send OTP through email
    emailTransporter.sendMail(
        {
            to: email,
            subject: "Confirmation code for Campus Marketplace",
            text: `Hello ${username}, ${otp} is your confirmation code for registering to Campus Marketplace`
        },
        (error, info) => {
            if (error) {
                console.error("Error sending email:\n", error);
            }
            // else {
            //     console.error("Email sent:\n", info);
            // }
        }
    );

    // access_token signing
    const access_token = jwt.sign(
        {
            sub: newUser[0].id,
            rol: newUser[0].status,
            oid: otpId,
            lrt: Math.floor(Date.now() / 1000), // now
            elt: Math.floor(Date.now() / 1000) - 60 // 1 min before
        },
        process.env.JWT_SECRET, {
        expiresIn: "1h"
    });

    //success
    res.status(StatusCodes.CREATED)
        .cookie("access_token", access_token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
            maxAge: 1000 * 60 * 60, // 60 minutes
            path: "/",
        })
        .json({ msg: "user successfully created"});

}

const verifyEmail = async (req, res) =>  {

    const { body: { otp }, user: { userId, otpId, role } } = req;

    const { error, value: candidateOTP } = validateOTP(otp);
    // otp validation
    if (error) {
        throw new CustomAPIError(error.details[0].message, StatusCodes.BAD_REQUEST);
    }

    // prune unverified pre_users older than one hour
    await pool.query("DELETE FROM pre_users WHERE status = 'unverified' AND created_at <= NOW() - INTERVAL '1 hour'");

    // check user exists in pre_users
    const { rowCount, rows: temp_users } = await pool.query("SELECT * FROM pre_users WHERE id = $1", [userId]);
    if (rowCount === 0 && !temp_users[0]) {
        throw new CustomAPIError("Session Invalid or expired", StatusCodes.UNAUTHORIZED);
    }
    // no need of verifying
    if (temp_users[0].status === 'verified') {
        throw new CustomAPIError("Forbidden, no need of verification", StatusCodes.FORBIDDEN);
    }

    // get stored otp if there
    const storedOtpId = await redis.get(`userId:${userId}`);
    if (storedOtpId === null || otpId !== storedOtpId) {
        throw new CustomAPIError("OTP invalid or expired, Try Again", StatusCodes.UNAUTHORIZED);
    }

    // check candidate otp against stored one
    const storedOtp = await redis.get(`otpId:${otpId}`)
    if (storedOtp === null || candidateOTP !== storedOtp) {
        throw new CustomAPIError("Incorrect OTP", StatusCodes.BAD_REQUEST);
    }

    // delete otp from redis
    redis.del(`otpId:${otpId}`);
    redis.del(`userId:${userId}`);

    // update user status to verified
    const { rows: verifiedUsers } = await pool.query("UPDATE pre_users SET status = 'verified' WHERE id = $1 RETURNING status", [userId]);

    // acces_token signing
    const access_token = jwt.sign({ sub: userId, rol: verifiedUsers[0].status }, process.env.JWT_SECRET, {
        expiresIn: "7d"
    });

    res.status(StatusCodes.OK)
        .cookie("access_token", access_token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
            maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
            path: "/",
        })
        .json({ msg: "Verfication successfully" });
}

const changeEmailInitial = async (req, res) => {

    const { body: { email: inputEmail }, user: { userId, otpId, role, lastEmailTime } } = req;

    const epochNow = Math.floor(Date.now() / 1000); // current epoch in seconds
    if (lastEmailTime + 60 > epochNow) {
        const tryAfter = lastEmailTime + 60 - epochNow
        res.set("Retry-After", tryAfter);
        throw new CustomAPIError(`Too many requests. try after ${tryAfter} seconds`, StatusCodes.TOO_MANY_REQUESTS);
    }
    
    // Joi validation
    const { error, value: email } = validateEmail(inputEmail);
    if (error) {
        throw new CustomAPIError(error.details[0].message, StatusCodes.BAD_REQUEST);
    }

    // prune unverified pre_users older than one hour
    await pool.query("DELETE FROM pre_users WHERE status = 'unverified' AND created_at <= NOW() - INTERVAL '1 hour'");
    
    const {rowCount, rows: preUsers} = await pool.query("UPDATE pre_users SET email = $1 WHERE id = $2 RETURNING username",
        [email, userId]
    );
    if (rowCount === 0 && !preUsers[0]) {
        throw new CustomAPIError("Session Invalid or expired", StatusCodes.UNAUTHORIZED);
    }

    // One Time Password generating/ 5 min expiration
    const { otp } = generateOTP();
    redis.set(`otpId:${otpId}`, otp, "EX", 60 * 5);
    redis.set(`userId:${userId}`, otpId, "EX", 60 * 5);
    console.log(`OTP to ${email}`, otp);

    // send OTP through email
    emailTransporter.sendMail(
        {
            to: email,
            subject: "Confirmation code for Campus Marketplace",
            text: `Hello ${preUsers[0].username}, ${otp} is your confirmation code for registering to Campus Marketplace`
        },
        (error, info) => {
            if (error) {
                console.error("Error sending email:\n", error);
            }
            // else {
            //     console.error("Email sent:\n", info);
            // }
        }
    );

    // access_token signing
    const access_token = jwt.sign(
        {
            sub: userId,
            rol: role,
            oid: otpId,
            lrt: epochNow,
            elt: epochNow
        },
        process.env.JWT_SECRET, {
        expiresIn: "1h"
    });

    //success
    res.status(StatusCodes.OK)
        .cookie("access_token", access_token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
            maxAge: 1000 * 60 * 60, // 60 minutes
            path: "/",
        })
        .json({ msg: "successfully updated email" });

}

const resendOTPInitial = async (req, res) => {

    const { user: { userId, otpId, role, lastResendTime, lastEmailTime } } = req;

    const epochNow = Math.floor(Date.now() / 1000); // current epoch in seconds
    if (lastResendTime + 60 > epochNow) {
        const tryAfter = lastResendTime + 60 - epochNow
        res.set("Retry-After", tryAfter);
        throw new CustomAPIError(`Too many requests. try after ${tryAfter} seconds`, StatusCodes.TOO_MANY_REQUESTS);
    }

    // prune unverified pre_users older than one hour
    await pool.query("DELETE FROM pre_users WHERE status = 'unverified' AND created_at <= NOW() - INTERVAL '1 hour'");
    
    const { rowCount, rows: preUsers } = await pool.query("SELECT username, email FROM pre_users WHERE id = $1",
        [userId]
    );
    if (rowCount === 0 && !preUsers[0]) {
        throw new CustomAPIError("Session Invalid or expired", StatusCodes.UNAUTHORIZED);
    }

    // One Time Password generating/ 5 min expiration
    const { otp } = generateOTP();
    redis.set(`otpId:${otpId}`, otp, "EX", 60 * 5);
    redis.set(`userId:${userId}`, otpId, "EX", 60 * 5);
    console.log(`OTP to ${preUsers[0].email}`, otp);
    
    // send OTP through email
    emailTransporter.sendMail(
        {
            to: preUsers[0].email,
            subject: "Confirmation code for Campus Marketplace",
            text: `Hello ${preUsers[0].username}, ${otp} is your confirmation code for registering to Campus Marketplace`
        },
        (error, info) => {
            if (error) {
                console.error("Error sending email:\n", error);
            }
            // else {
            //         console.error("Email sent:\n", info);
            // }
        }
    );
        
    // access_token signing
    const access_token = jwt.sign(
        {
            sub: userId,
            rol: role,
            oid: otpId,
            lrt: epochNow,
            elt: lastEmailTime
        },
        process.env.JWT_SECRET, {
        expiresIn: "1h"
    });
        
        //success
    res.status(StatusCodes.OK)
        .cookie("access_token", access_token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
            maxAge: 1000 * 60 * 60, // 60 minutes
            path: "/",
        })
        .json({ msg: "resent otp" });

}

const registerComplete = async (req, res) => {

    const { userId, role } = req.user;

    if (role !== STATUS.VERIFIED) {
        throw new CustomAPIError("Forbidden, user unverified", StatusCodes.FORBIDDEN);
    }

    const { error, value: joiValue } = validateRegisterComplete(req.body);
    if (error) {
        throw new CustomAPIError(error.details[0].message, StatusCodes.BAD_REQUEST);
    }
    
    const { full_name, dob, gender, country_code, phone, college_id, device_fingerprint } = joiValue;
    const user_agent = req.headers['user-agent'];
    if (!user_agent) {
        throw new CustomAPIError("user-agent header not present", StatusCodes.BAD_REQUEST);
    }
    const ip_address = req.headers['x-forwarded-for']?.split(',')[0] || req.socket.remoteAddress;
    if (!ip_address) {
        throw new CustomAPIError("ip_address not present", StatusCodes.BAD_REQUEST);
    }
    
    const { rowCount, rows: preUsers } = await pool.query("SELECT username, email, password FROM pre_users WHERE id = $1",
        [userId]
    )
    if (rowCount === 0 && !preUsers[0]) {
        throw new CustomAPIError("Session Invalid or expired", StatusCodes.UNAUTHORIZED);
    }
    const { username, email, password } = preUsers[0];
    
    let completePhone;
    try {
        completePhone = "+" + getCountryCallingCode(country_code) + " " + phone;
    } catch (error) {
        throw new CustomAPIError("Invalid country code", StatusCodes.BAD_REQUEST);
    }

    // unique check in users with same username or email check
    const {rows: existingUsers} = await pool.query("SELECT username, email FROM users WHERE (username = $1 OR email = $2 OR phone = $3)",
        [username, email, completePhone]
    );
    const { rows: existingPreUsers } = await pool.query("SELECT username, email FROM pre_users WHERE (username = $1 OR email = $2 OR phone = $3) AND status = 'verified' AND NOT id = $4",
        [username, email, completePhone, userId]
    );

    let takenFields = [null, null, null];
    for (let user of [...existingUsers, ...existingPreUsers]) {
        if (user.username === username) takenFields[0] = "Username";
        if (user.email === email) takenFields[1] = "Email";
        if (user.phone === phone) takenFields[2] = "Phone";
    }
    takenFields = takenFields.filter(e => e)

    if (takenFields.length > 0) {
        throw new CustomAPIError(
            `The following field(s) are already taken: ${takenFields.join(", ")}`,
            StatusCodes.CONFLICT);
    }

    const { rowCount: cllg_exists } = await pool.query("SELECT 1 FROM colleges WHERE id = $1", [college_id]);
    if (cllg_exists === 0) {
        throw new CustomAPIError("Unknown college provided", StatusCodes.BAD_REQUEST);
    }

    const { rows: newUser } = await pool.query("INSERT INTO users (username, full_name, email, password, dob, gender, country_code, phone, college_id) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id, role",
        [username, full_name, email, password, dob, gender, country_code, completePhone, college_id]
    );

    await pool.query("DELETE FROM pre_users WHERE id = $1", [userId]);

    // refresh_token generation
    const refresh_token = crypto.randomBytes(64).toString('hex');
    const hashedRefToken = crypto.createHash('sha256').update(refresh_token).digest('hex');
    const session_id = crypto.randomUUID();

    await pool.query("INSERT INTO sessions (id, user_id, hashed_refresh_token, device_fingerprint, user_agent, ip_address) VALUES ($1, $2, $3, $4, $5, $6)",
        [session_id, newUser[0].id, hashedRefToken, device_fingerprint, user_agent, ip_address]
    );

    // access_token signing
    const access_token = jwt.sign(
        {
            sub: newUser[0].id,
            rol: newUser[0].role,
            sid: session_id,
        },
        process.env.JWT_SECRET, {
        expiresIn: "30m"
    });

    res.status(StatusCodes.CREATED)
        .cookie("access_token", access_token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
            maxAge: 1000 * 60 * 60 * 24 * 30, // 30 day
            path: "/",
        })
        .cookie("refresh_token", refresh_token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
            maxAge: 1000 * 60 * 60 * 24 * 30, // 30 day
            path: "/",
        })
        .json({ msg: "User setup finished successfully" });

}

const login = async (req, res) => {

    const { error, value: joiValue } = validateLogin(req.body);
    if (error) {
        throw new CustomAPIError(error.details[0].message, StatusCodes.BAD_REQUEST);
    }

    const { username, email, password, device_fingerprint } = joiValue;

    const { rowCount, rows: preUsers } = await pool.query("SELECT id, status, password FROM pre_users WHERE status = 'verified' AND (username = $1 OR email = $2)",
        [username, email]
    );

    if (rowCount !== 0 && preUsers) {
    
        const isPasswordCorrect = await bcrypt.compare(password, preUsers[0].password);
        if (!isPasswordCorrect) {
            throw new CustomAPIError("Invalid Credentials", StatusCodes.UNAUTHORIZED);
        }

        // acces_token signing
        const access_token = jwt.sign({ sub: preUsers[0].id, rol: preUsers[0].status }, process.env.JWT_SECRET, {
            expiresIn: "7d"
        });

        res.clearCookie('refresh_token');
        return res.status(StatusCodes.OK)
            .cookie("access_token", access_token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
                sameSite: "strict",
                maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
                path: "/",
            })
            .json({ msg: "Logged in as incomplete user successfully", code: 31 });
    }

    const { rowCount: rowCount2, rows: users } = await pool.query("SELECT id, role, password FROM users WHERE username = $1 OR email = $2",
        [username, email]
    );

    if (rowCount2 !== 0 && users) {

        if (!device_fingerprint) {
            throw new CustomAPIError("\"device_fingerprint\" is required", StatusCodes.BAD_REQUEST);
        }
    
        const isPasswordCorrect = await bcrypt.compare(password, users[0].password);
        if (!isPasswordCorrect) {
            throw new CustomAPIError("Invalid Credentials", StatusCodes.UNAUTHORIZED);
        }

        // refresh_token generation
        const refresh_token = crypto.randomBytes(64).toString('hex');
        const hashedRefToken = crypto.createHash('sha256').update(refresh_token).digest('hex');
        
        const user_agent = req.headers['user-agent'];
        if (!user_agent) {
            throw new CustomAPIError("user-agent header not present", StatusCodes.BAD_REQUEST);
        }
        const ip_address = req.headers['x-forwarded-for']?.split(',')[0] || req.socket.remoteAddress;
        if (!ip_address) {
            throw new CustomAPIError("ip_address not present", StatusCodes.BAD_REQUEST);
        }

        let session_id = crypto.randomUUID();
    
        const { rows: sessions } = await pool.query(
            `INSERT INTO sessions
                (id, user_id, hashed_refresh_token, device_fingerprint, user_agent, ip_address)
                VALUES ($1, $2, $3, $4, $5, $6)
                ON CONFLICT (user_id, device_fingerprint) DO UPDATE SET
                hashed_refresh_token = EXCLUDED.hashed_refresh_token,
                user_agent = EXCLUDED.user_agent,
                ip_address = EXCLUDED.ip_address,
                last_used_at = NOW(),
                expires_at = NOW() + INTERVAL '30 days'
            RETURNING id`,
            [session_id, users[0].id, hashedRefToken, device_fingerprint, user_agent, ip_address]
        );
        session_id = sessions[0].id;
        // } catch (error) {
        //     if (error.code === "23505") {
        //         const { rows: sessions } = await pool.query("UPDATE sessions SET hashed_refresh_token = $1, device_fingerprint = $2, user_agent = $3, ip_address = $4, last_used_at = NOW(), expires_at = (NOW() + INTERVAL '30 days') WHERE user_id = $5 RETURNING id",
        //             [hashedRefToken, device_fingerprint, user_agent, ip_address, users[0].id]
        //         );
        //     } else {
        //         console.error(error);
        //         return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error });
        //     }
        // }

        // access_token signing
        const access_token = jwt.sign(
            {
                sub: users[0].id,
                rol: users[0].role,
                sid: session_id
            },
            process.env.JWT_SECRET, {
            expiresIn: "30m"
        });
        

        return res.status(StatusCodes.OK)
            .cookie("access_token", access_token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
                sameSite: "strict",
                maxAge: 1000 * 60 * 60 * 24 * 30, // 30 day
                path: "/",
            })
            .cookie("refresh_token", refresh_token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
                sameSite: "strict",
                maxAge: 1000 * 60 * 60 * 24 * 30, // 30 day
                path: "/",
            })
            .json({ msg: "Logged in successfully" });
    }

    throw new CustomAPIError("Invalid Credentials.", StatusCodes.UNAUTHORIZED);

}

const refreshAccessToken = async (req, res) => {

    const { device_fingerprint: inputDeviceFingerprint } = req.body;
    const { error, value: device_fingerprint } = validateDeviceFingerprint(inputDeviceFingerprint);
    if (error) {
        throw new CustomAPIError(error.details[0].message, StatusCodes.BAD_REQUEST);
    }

    const curr_refresh_token = req.cookies.refresh_token;
    if (!curr_refresh_token) {
        throw new CustomAPIError("Authentication invalid", StatusCodes.UNAUTHORIZED);
    }
    const curr_access_token = req.cookies.access_token;
    if (!curr_access_token) {
        throw new CustomAPIError("Authentication invalid", StatusCodes.UNAUTHORIZED);
    }

    var payload;
    var successfull = false;
    try {
        payload = jwt.verify(curr_access_token, process.env.JWT_SECRET);
        successfull = true
    } catch (error) {
        if (error.name !== "TokenExpiredError") {
            throw new CustomAPIError("Authentication invalid", StatusCodes.UNAUTHORIZED);
        }
    } if (successfull) {
        const { sub, rol, sid } = payload;
        if (!sub || !rol || !sid) {
            throw new CustomAPIError("Authentication invalid", StatusCodes.UNAUTHORIZED);
        }
        throw new CustomAPIError("Forbidden, valid access token present", StatusCodes.FORBIDDEN);
    }
    
    await pool.query("DELETE FROM sessions WHERE expires_at <= NOW()");

    const hashedCurrRefToken = crypto.createHash('sha256').update(curr_refresh_token).digest('hex');

    const { rowCount, rows: sessions } = await pool.query("SELECT * FROM sessions WHERE hashed_refresh_token = $1",
        [hashedCurrRefToken]
    );
    if (rowCount === 0) {
        throw new CustomAPIError("Authentication invalid", StatusCodes.UNAUTHORIZED);
    }

    const session = sessions[0];

    const user_agent = req.headers['user-agent'];
    if (!user_agent) {
        throw new CustomAPIError("user-agent header not present", StatusCodes.BAD_REQUEST);
    }
    const ip_address = req.headers['x-forwarded-for']?.split(',')[0] || req.socket.remoteAddress;
    if (!ip_address) {
        throw new CustomAPIError("ip_address not present", StatusCodes.BAD_REQUEST);
    }

    // if (device_fingerprint !== session.device_fingerprint) {
    //     // TODO set user role to reverify_requested
    //        throw new CustomAPIError();;;;
    // }

    const refresh_token = crypto.randomBytes(64).toString('hex');
    const hashedRefToken = crypto.createHash('sha256').update(refresh_token).digest('hex');

    let session_id = crypto.randomUUID();
    
        const { rows: session2 } = await pool.query(
            `INSERT INTO sessions
                (id, user_id, hashed_refresh_token, device_fingerprint, user_agent, ip_address)
                VALUES ($1, $2, $3, $4, $5, $6)
                ON CONFLICT (user_id, device_fingerprint) DO UPDATE SET
                hashed_refresh_token = EXCLUDED.hashed_refresh_token,
                user_agent = EXCLUDED.user_agent,
                ip_address = EXCLUDED.ip_address,
                last_used_at = NOW(),
                expires_at = NOW() + INTERVAL '30 days'
            RETURNING id`,
            [session_id, session.user_id, hashedRefToken, device_fingerprint, user_agent, ip_address]
        );
        session_id = session2[0].id;

    const { rows: users } = await pool.query("SELECT role FROM users WHERE id = $1", [session.user_id]);

    // access_token signing
    const access_token = jwt.sign(
        {
            sub: session.user_id,
            rol: users[0].role,
            sid: session_id
        },
        process.env.JWT_SECRET, {
        expiresIn: "30m"
    });
    

    return res.status(StatusCodes.OK)
        .cookie("access_token", access_token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
            maxAge: 1000 * 60 * 60 * 24 * 30, // 30 day
            path: "/",
        })
        .cookie("refresh_token", refresh_token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
            maxAge: 1000 * 60 * 60 * 24 * 30, // 30 day
            path: "/",
        })
        .json({ msg: "token refreshed" });

}

const getSession = async (req, res) => {

    const { userId, sid } = req.user;
    const sessionId = req.params.id;

    const { rowCount, rows: sessions} = await pool.query(
        `SELECT id, user_agent, ip_address, created_at, last_used_at FROM sessions
            WHERE id = $1 AND user_id = $2`,
        [sessionId, userId]
    );
    if (rowCount === 0) {
        throw new CustomAPIError("Session not found", StatusCodes.NOT_FOUND);
    }

    const session = sessions[0];

    const parser = new UAParser(session.user_agent);
    const device = parser.getDevice();
    const os = parser.getOS();
    const browser = parser.getBrowser();

    session.device_type = device.type || "desktop";
    session.device_name = device.model || device.vendor;
    session.os = os.name;
    session.os_version = os.version;
    session.browser = browser.name;
    session.browser_version = browser.version;
    session.current = session.id === sid;

    try {

        const { data } = await axios.get(`https://freeipapi.com/api/json/${session.ip_address}`);

        session.country = data.countryName;
        session.region = data.regionName;
        session.city = data.cityName;

    } catch (error) {
        console.error(error);
    }

    res.status(StatusCodes.OK).json({ session });
}

const getAllSessions = async (req, res) => {

    const { userId, sid } = req.user;

    const { rowCount, rows: sessions} = await pool.query(
        `SELECT id, user_agent, ip_address, created_at, last_used_at FROM sessions
             WHERE user_id = $1`,
        [userId]
    );
    if (rowCount === 0) {
        res.clearCookie('access_token');
        res.clearCookie('refresh_token');
        throw new CustomAPIError("No session ???!!!!", StatusCodes.NOT_FOUND);
    }

    for (let i = 0; i < sessions.length; i++) {
        const session = sessions[i];
        const parser = new UAParser(session.user_agent);
        const device = parser.getDevice();
        const os = parser.getOS();
        const browser = parser.getBrowser();

        session.device_type = device.type || "desktop";
        session.device_name = device.model || device.vendor;
        session.os = os.name;
        session.os_version = os.version;
        session.browser = browser.name;
        session.browser_version = browser.version;
        session.current = session.id === sid;

        try {

            const { data } = await axios.get(`https://freeipapi.com/api/json/${session.ip_address}`);
    
            session.country = data.countryName;
            session.region = data.regionName;
            session.city = data.cityName;
    
        } catch (error) {
            console.error(error);
        }

    }

    res.status(StatusCodes.OK).json({ sessions });
}

const logout = async (req, res) => {

    const token = req.cookies.access_token;

    res.clearCookie('access_token');
    res.clearCookie('refresh_token');

    try {
        const payload = jwt.verify(token, process.env.JWT_SECRET);
        if (payload.sid) {
            await pool.query("DELETE FROM sessions WHERE id = $1 AND user_id = $2",
                [payload.sid, payload.sub]
            );
        }
    } catch (error) {
        throw new CustomAPIError("Valid session not found", StatusCodes.UNAUTHORIZED);
    }
    
    res.status(StatusCodes.OK).json({ msg: "logged out successfully" });

}

const deleteSession = async (req, res) => {
    const { userId } = req.user;
    const sessionId = req.params.id;

    const { rowCount } = await pool.query("DELETE FROM sessions WHERE id = $1 AND user_id = $2",
        [sessionId, userId]
    );
    if (rowCount === 0) {
        throw new CustomAPIError("Session not found", StatusCodes.NOT_FOUND);
    }
    
    res.status(StatusCodes.OK).json({ msg: "logged out session successfully" });

}

const deleteAllSessions = async (req, res) => {
    const { userId } = req.user;

    const { rowCount } = await pool.query("DELETE FROM sessions WHERE user_id = $1",
        [userId]
    );
    res.clearCookie('access_token');
    res.clearCookie('refresh_token');
    if (rowCount === 0) {
        throw new CustomAPIError("No sessions not found", StatusCodes.NOT_FOUND);
    }
    
    res.status(StatusCodes.OK).json({ msg: `logged out from all ${rowCount} sessions` });
}

module.exports = {
    registerInitial, verifyEmail, changeEmailInitial, resendOTPInitial, registerComplete,
    login, refreshAccessToken,
    getSession, getAllSessions,
    logout, deleteSession, deleteAllSessions
};
