const showMsg = getShowMsg(document.getElementById("infoErrorMsg"));

// Toggle the mobile menu func
function toggleMenu() {
    document.getElementById("mobileMenu").classList.toggle("hidden");
}
// Auto-close menu on link click (only on mobile)
document.addEventListener("DOMContentLoaded", function () {
    const links = document.querySelectorAll("#mobileMenu a");
    const menu = document.getElementById("mobileMenu");
    links.forEach(link => {
        link.addEventListener("click", () => {
            if (!menu.classList.contains("hidden")) {
                menu.classList.add("hidden");
            }
        });
    });
});

// Toggle password visibility
function toggleVisibility(inputId, toggleId) {
    let passwordField = document.getElementById(inputId);
    let toggleIcon = document.getElementById(toggleId);

    if (passwordField.type === "password") {
        passwordField.type = "text";
        toggleIcon.textContent = "👀";
    } else {
        passwordField.type = "password";
        toggleIcon.textContent = "👁️";
    }
}

document
    .getElementById("togglePassword")
    .addEventListener("click", function (e) {
        e.preventDefault();
        toggleVisibility("password", "togglePassword");
    });

document
    .getElementById("toggleConfirmPassword")
    .addEventListener("click", function (e) {
        e.preventDefault();
        toggleVisibility("confirmPassword", "toggleConfirmPassword");
    });


// form submission
const form = document.querySelector("#signup1-form");
form.addEventListener("submit", async function (event) {
    event.preventDefault(); // Prevent form submission if validation fails

    const username = form.username.value.trim();
    const email = form.email.value.trim();
    const password = form.password.value;
    const confirmPassword = form.confirmPassword.value;

    // Username Validation
    const usernameRegex = /^[a-zA-Z0-9_]+$/;
    if (!usernameRegex.test(username)) {
        showMsg("Username can only contain letters, numbers, and underscores.", ERROR);
        return;
    }

    // Email Validation
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(email)) {
        showMsg("Please enter a valid email address.", ERROR);
        return;
    }

    // Password Validation
    if (password.length < 8) {
        showMsg("Password must be at least 8 characters long.", ERROR);
        return;
    }

    // Confirm Password Match
    if (password !== confirmPassword) {
        showMsg("Passwords do not match.", ERROR);
        return;
    }

    // All validations passed

    // Proceed with form submission
    showMsg("Loading...", INFO);
    const submitBtn = document.querySelector("#signup1-form button[type='submit']");
    submitBtn.disabled = true;

    try {
        const { data } = await axios.post("/api/auth/register", {
            username,
            email,
            password,
        });
        showMsg(data.msg, SUCCESS);
        localStorage.setItem("userEmail", email);
        localStorage.setItem("otpTime", Math.floor(Date.now() / 1000));
        localStorage.setItem("otpResnd", Math.floor(Date.now() / 1000));
        window.location.href = "./otp.html";


    } catch (error) {
        if (error.response?.data?.msg)
            showMsg(error.response.data.msg, ERROR);
        else console.error(error);
    }

    // Auto-clears error msg & Re-enable button after 7 seconds
    setTimeout(() => {
        submitBtn.disabled = false;
    }, 7000);

});

