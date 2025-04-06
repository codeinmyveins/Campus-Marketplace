const CustomAPIError = require("./custom-api");
const { StatusCodes } = require("http-status-codes");

class accessTokenExpiredError extends CustomAPIError {
    constructor () {
        super("access token expired", StatusCodes.UNAUTHORIZED);
        this.code = 69;
    }
}

module.exports = accessTokenExpiredError