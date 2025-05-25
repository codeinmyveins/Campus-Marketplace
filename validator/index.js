const Joi = require("joi");

const validator = (schema) => (payload) => 
    schema.validate(payload, { abortEarly: true });

const toTitleCase = (str, helpers) => str
  .toLowerCase()
  .replace(/\b\w/g, char => char.toUpperCase());

const username = Joi.string().trim().min(3).max(16).lowercase().pattern(/^[a-z0-9_-]+$/)
    .rule({"message": "\"username\" can only contain letters, numbers and underscores"});

const email = Joi.string().trim().email().lowercase();

const registerInitialSchema = Joi.object({
    username: username.required(),
    email: email.required(),
    password: Joi.string().trim().min(8).required(),
});

const device_fingerprint = Joi.string().trim();

const loginSchema = Joi.object({
    username: username,
    email: email,
    password: Joi.string().trim().min(8).required(),
    device_fingerprint: device_fingerprint,
}).xor("username", "email");

const full_name = Joi.string().trim().max(64).custom(toTitleCase, "Title Case Transformer").pattern(/^[a-zA-Z\s]+$/)
    .rule({"message": "\"full_name\" can only contains letters and spaces"});
const dob = Joi.date().less("now").iso().messages({"date.format": "\"dob\" must be in the iso 8601 YYYY-MM-DD format"});

const registerCompleteSchema = Joi.object({
    full_name: full_name.required(),
    dob: dob.required(),
    gender: Joi.string().trim().lowercase().valid("male", "female", "other").required(),
    country_code: Joi.string().trim().uppercase().length(2).pattern(/^[A-Z]+$/).required(),
    phone: Joi.string().trim().pattern(/^[0-9]+$/).required(),
    college_id: Joi.number().min(1).required(),
    device_fingerprint: device_fingerprint.required(),
});

const emailSchema = Joi.string().trim().email().required();

const otpSchema = Joi.string().trim().length(6).pattern(/^[0-9]+$/)
    .rule({"message": "\"otp\" should only contain numbers" });

const UserInfo = Joi.object({
    full_name: full_name,
    dob: dob,
    gender: Joi.string().trim().lowercase().valid("male", "female"),
    country_code: Joi.string().trim().uppercase().length(2).pattern(/^[A-Z]+$/),
    phone: Joi.string().trim().pattern(/^[0-9]+$/),
    college_id: Joi.number().min(1),
    bio: Joi.string().trim().max(2048),
    username: username,
});

const itemPostInfoObj = {
    item_name: Joi.string().trim().max(32),
    item_category: Joi.string().trim().max(32).custom(toTitleCase, "Title Case Transformer"),
    title: Joi.string().trim().max(64),
    description: Joi.string().trim().max(16384),
};

const price = Joi.number().greater(0).precision(2);

const itemPostInfo = Joi.object({
    ...itemPostInfoObj,
    location: Joi.string().trim(),
    closed: Joi.boolean(),
    price: price,
});

const itemPostInfoRequired = Joi.object({
    ...Object.fromEntries(
        Object.entries(itemPostInfoObj).map(([key, schema]) => [key, schema.required()])
    ),
    type: Joi.string().trim().lowercase().valid("sell", "buy", "lend", "borrow").required(),
    location: Joi.string().trim(),
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
