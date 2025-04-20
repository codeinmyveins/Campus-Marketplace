const GENDER = Object.freeze({
    MALE: "male",
    FEMALE: "female",
    OTHER: "other"
});

const ROLE = Object.freeze({
    REVERIFY_REQUIRED: "reverify_required",
    USER: "user",
    ADMIN: "admin"
});

const STATUS = Object.freeze({
    UNVERIFIED: "unverified",
    VERIFIED: "verified",
});

module.exports = { ROLE, STATUS, GENDER };
