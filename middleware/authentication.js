require("dotenv").config();
const CustomAPIError = require("../errors/custom-api");
const accessTokenExpiredError = require("../errors/accessToeknExpiredError");
const refevifyRequiredError = require("../errors/refevifyRequiredError");
const { StatusCodes } = require("http-status-codes");
const jwt = require("jsonwebtoken");

const auth = async (req, res, next) => {

    // const authHeader = req.headers.authorization;
    // if (!authHeader || !authHeader.startsWith("Bearer ")) {
    //     throw new CustomAPIError("Authentication invalid", StatusCodes.UNAUTHORIZED);
    // }
    // const token = authHeader.split(" ")[1];
    const token = req.cookies.access_token;
    if (!token) {
        throw new CustomAPIError("Authentication invalid", StatusCodes.UNAUTHORIZED);
    }
    let payload;
    try {
        payload = jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
        if (error.name === "TokenExpiredError") {
            throw new accessTokenExpiredError();
        }
        throw new CustomAPIError("Authentication Invalid", StatusCodes.UNAUTHORIZED);
    }
    const { sub, rol, sid } = payload;
    if (rol === "reverify_required") {
        throw new refevifyRequiredError();
    }
    if (!sub || !rol || !sid || !["user", "admin"].includes(rol))
        throw new CustomAPIError("Authentication Invalid.", StatusCodes.UNAUTHORIZED);
    req.user = { userId: sub, role: rol, sid };

    next();
}

const refreshAuth = async (req, res, next) => {

    const token = req.cookies.refresh_token;
    if (!token) {
        throw new CustomAPIError("Authentication invalid", StatusCodes.UNAUTHORIZED);
    }
    next();
}

const preUserAuth = async (req, res, next) => {

    const token = req.cookies.access_token;
    if (!token) {
        throw new CustomAPIError("Authentication invalid", StatusCodes.UNAUTHORIZED);
    }
    let payload;
    try {
        payload = jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
        throw new CustomAPIError("Authentication Invalid.", StatusCodes.UNAUTHORIZED);
    }
    const { sub, rol, oid } = payload;
    if (!sub || !rol)
        throw new CustomAPIError("Authentication Invalid", StatusCodes.UNAUTHORIZED);
    req.user = { userId: sub, role: rol, otpId: oid };
    
    next();
}

const otpUserAuth = async (req, res, next) => {

    const { userId, role, otpId } = req.user;
    if (role === "verified")
        throw new CustomAPIError("Forbidden, no need of verification", StatusCodes.FORBIDDEN);
    if (!userId || !role || !otpId)
        throw new CustomAPIError("Forbidden, invalid token", StatusCodes.FORBIDDEN);
    next();

}

module.exports = { auth, preUserAuth, otpUserAuth, refreshAuth};
