const CustomAPIError = require('../errors/custom-api');
const { StatusCodes } = require('http-status-codes');
const errorHandlerMiddleware = (err, req, res, next) => {
  
  if (err instanceof CustomAPIError) {
    return res.status(err.statusCode).json({ msg: err.message, code: err.code });
  }

  // multer middleware errors
  if (err.code === "LIMIT_UNEXPECTED_FILE") {
    return res.status(StatusCodes.BAD_REQUEST).json({ msg: err.message + ": " + err.field })
  }
  if (err.code === "LIMIT_FILE_SIZE") {
    return res.status(StatusCodes.BAD_REQUEST).json({ msg: err.message })
  }

  console.log(err);
  return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ err });
}

module.exports = errorHandlerMiddleware;
