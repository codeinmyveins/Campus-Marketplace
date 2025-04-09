const Joi = require("joi");

const validator = (schema) => (payload) => 
    schema.validate(payload, { abortEarly: true });

const username = Joi.string().min(3).max(16).pattern(/^[a-zA-Z0-9_]+$/)
    .rule({"message": "\"username\" can only contain letters, numbers and underscores"});

const registerInitialSchema = Joi.object({
    username: username.required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(8).required(),
});

const device_fingerprint = Joi.string();

const loginSchema = Joi.object({
    username: username,
    email: Joi.string().email(),
    password: Joi.string().min(8).max(32).required(),
    device_fingerprint: device_fingerprint,
}).xor('username', 'email');

const full_name = Joi.string().max(64).pattern(/^[a-zA-Z\s]+$/)
    .rule({"message": "\"full_name\" can only contains letters and spaces"});
const college_name = Joi.string().max(64).pattern(/^[a-zA-Z\s]+$/)
    .rule({"message": "\"college_name\" can only contains letters and spaces"});
const dob = Joi.date().less("now").iso().messages({"date.format": "\"dob\" must be in the iso 8601 YYYY-MM-DD format"});

const registerCompleteSchema = Joi.object({
    full_name: full_name.required(),
    dob: dob.required(),
    gender: Joi.string().valid("male", "female").required(),
    country_code: Joi.string().length(2).pattern(/^[A-Z]+$/).required(),
    phone: Joi.string().pattern(/^[0-9]+$/).required(),
    college_name: college_name.required(),
    device_fingerprint: device_fingerprint.required(),
});

const emailSchema = Joi.string().email().required();

const otpSchema = Joi.string().length(6).pattern(/^[0-9]+$/)
    .rule({"message": "\"otp\" should only contain numbers" });

const UserInfo = Joi.object({
    full_name: full_name,
    dob: dob,
    gender: Joi.string().valid("male", "female"),
    country_code: Joi.string().length(2).pattern(/^[A-Z]+$/),
    phone: Joi.string().pattern(/^[0-9]+$/),
    college_name: college_name,
    bio: Joi.string().max(2056),
    username: username,
});


exports.validateRegisterInitial = validator(registerInitialSchema);
exports.validateRegisterComplete = validator(registerCompleteSchema);
exports.validateLogin = validator(loginSchema);
exports.validateEmail = validator(emailSchema);
exports.validateOTP = validator(otpSchema);
exports.validateDeviceFingerprint = validator(device_fingerprint);
exports.validateUserInfo = validator(UserInfo);
