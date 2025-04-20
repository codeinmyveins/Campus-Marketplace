const express = require("express");
// middleware
const { auth, refreshAuth, preUserAuth, otpUserAuth } = require("../middleware/authentication");
//controller
const {
    registerInitial, verifyEmail, changeEmailInitial, resendOTPInitial, registerComplete,
    login, refreshAccessToken,
    getSession, getAllSessions,
    logout, deleteSession, deleteAllSessions
} = require("../controllers/auth");

const router = express.Router();

router.route("/register").post(registerInitial);
router.route("/verify-email").post(preUserAuth, otpUserAuth, verifyEmail);
router.route("/email").patch(preUserAuth, otpUserAuth, changeEmailInitial);
router.route("/resend-otp/register").post(preUserAuth, otpUserAuth, resendOTPInitial);
router.route("/register/complete").patch(preUserAuth, registerComplete);


router.route("/login").post(login);

router.route("/logout").delete(logout);
router.route("/session/all").get(auth, getAllSessions).delete(auth, deleteAllSessions);
router.route("/session/:id").get(auth, getSession).delete(auth, deleteSession);

router.route("/reverify").post();
router.route("/resend-otp/reverify").post();

router.route("/refresh").post(refreshAccessToken);

module.exports = router;