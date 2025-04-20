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
const college_name = Joi.string().max(256).pattern(/^[a-zA-Z\s]+$/)
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
    bio: Joi.string().max(2048),
    username: username,
});

const itemPostInfoObj = {
    item_name: Joi.string().max(32),
    item_category: Joi.string().max(32),
    title: Joi.string().max(64),
    description: Joi.string().max(16384),
};

const price = Joi.number().greater(0).precision(2);

const itemPostInfo = Joi.object({
    ...itemPostInfoObj,
    location: Joi.string(),
    closed: Joi.boolean(),
    price: price,
});

const itemPostInfoRequired = Joi.object({
    ...Object.fromEntries(
        Object.entries(itemPostInfoObj).map(([key, schema]) => [key, schema.required()])
    ),
    type: Joi.string().valid("sell", "buy", "lend", "borrow").required(),
    location: Joi.string(),
    price: price.when("type", {
        is: Joi.valid("sell", "lend"),
        then: Joi.required(),
        otherwise: Joi.forbidden()
    }),
});

const itemImageReorderSchema = Joi.array()
    .items(Joi.number().integer().required())
    .unique()
    .required();

exports.validateRegisterInitial = validator(registerInitialSchema);
exports.validateRegisterComplete = validator(registerCompleteSchema);
exports.validateLogin = validator(loginSchema);
exports.validateEmail = validator(emailSchema);
exports.validateOTP = validator(otpSchema);
exports.validateDeviceFingerprint = validator(device_fingerprint);
exports.validateUserInfo = validator(UserInfo);
exports.validateItemPostInfo = validator(itemPostInfo);
exports.validateItemPostInfoRequired = validator(itemPostInfoRequired);
exports.itemImageReorderSchema = itemImageReorderSchema;
exports.priceSchema = price;
