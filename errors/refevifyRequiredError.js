const CustomAPIError = require("./custom-api");
const { StatusCodes } = require("http-status-codes");

class refevifyRequiredError extends CustomAPIError {
    constructor () {
        super("reverify required", StatusCodes.FORBIDDEN);
        this.code = 120;
    }
}

module.exports = refevifyRequiredError