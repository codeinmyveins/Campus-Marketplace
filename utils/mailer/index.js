require("dotenv").config();
const { Resend } = require("resend");

const resend = new Resend(process.env.RESEND_API_KEY);

const sendMail = async (email, subject, text, html) => {

    try {
        await resend.emails.send({
            from: "Campus Marketplace <onboarding@resend.dev>",
            to: email,
            subject,
            text,
            html
        });
    } catch (error) {
        if (error) {
            console.error("Error sending email:\n", error);
        }
    }
};


const sendOTP = async (email, username, otp) => {

    const formattedOTP = otp.slice(0, 3) + " " + otp.slice(3, 6);

    try {
        await resend.emails.send({
            from: "Campus Marketplace <onboarding@resend.dev>",
            to: email,
            subject: "Confirmation code for Campus Marketplace",
            text: `Hello ${username}, ${otp} is your confirmation code for registering to Campus Marketplace`,
            html: `
            <div style="font-family: Arial, sans-serif; background-color: #f4f4f7; padding: 40px 20px;">
                <div style="max-width: 500px; margin: auto; background: #ffffff; padding: 30px; border-radius: 8px; text-align: center;">
                    
                    <h2 style="margin-bottom: 10px; color: #111827;">
                        Campus Marketplace
                    </h2>
                    
                    <p style="font-size: 16px; color: #374151;">
                        Hello <strong>${username}</strong>,
                    </p>
                    
                    <p style="font-size: 15px; color: #4b5563;">
                        Use the verification code below to complete your registration.
                        This code will expire in <strong>5 minutes</strong>.
                    </p>

                    <div style=" margin: 30px 0; font-size: 28px; letter-spacing: 6px; font-weight: bold;
                        color: #111827; background: #f3f4f6; padding: 15px; border-radius: 6px; display: inline-block;
                    ">
                        ${formattedOTP}
                    </div>

                    <p style="font-size: 13px; color: #6b7280;">
                        If you did not request this code, you can safely ignore this email.
                    </p>

                    <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;" />

                    <p style="font-size: 12px; color: #9ca3af;">
                        © ${new Date().getFullYear()} Campus Marketplace. All rights reserved.
                    </p>
                </div>
            </div>
            `
        });
    } catch (error) {
        if (error) {
            console.error("Error sending email:\n", error);
        }
    }

};


module.exports = { sendMail, sendOTP };
