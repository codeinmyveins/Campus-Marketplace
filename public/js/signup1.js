// Toggle the mobile menu
function toggleMenu() {
    document.getElementById("mobileMenu").classList.toggle("hidden");
}
// Auto-close menu on link click (only on mobile)
document.addEventListener("DOMContentLoaded", function () {
    const links = document.querySelectorAll("#mobileMenu a");
    links.forEach(link => {
        link.addEventListener("click", () => {
            const menu = document.getElementById("mobileMenu");
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

document.querySelector("#signup1-form").addEventListener("submit", async function (event) {
    event.preventDefault(); // Prevent form submission if validation fails

    let username = document.querySelector("input[type='text']").value.trim();
    let email = document.querySelector("input[type='email']").value.trim();
    let password = document.getElementById("password").value;
    let confirmPassword = document.getElementById("confirmPassword").value;

    const errorMsg = document.getElementById("errorMsg");
    errorMsg.textContent = "";
    errorMsg.classList.add("hidden");

    // Username Validation
    let usernameRegex = /^[a-zA-Z0-9_]+$/;
    if (!usernameRegex.test(username)) {
        showError("Username can only contain letters, numbers, and underscores.","error");
        return;
    }

    // Email Validation
    let emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(email)) {
        showError("Please enter a valid email address.","error");
        return;
    }

    // Password Validation
    if (password.length < 8) {
        showError("Password must be at least 8 characters long.","error");
        return;
    }

    // Confirm Password Match
    if (password !== confirmPassword) {
        showError("Passwords do not match.","error");
        return;
    }

    // All validations passed
    // errorMsg.textContent = "";
    // errorMsg.classList.add("hidden");

    // Proceed with form submission
    showError("Loading...", "neutral");
    errorMsg.classList.remove("hidden");
    const submitBtn = document.querySelector("#signup1-form button[type='submit']");
    submitBtn.disabled = true;

    try {
        const { data } = await axios.post("/api/auth/register", {
            username,
            email,
            password,
        });
        errorMsg.textContent = data.msg;
        window.location.href = `./otp.html?email=${email}`;


    } catch (error) {
        showError(error.response?.data?.msg || "Something went wrong. Please try again.");
    }
    
   // Auto-clears error msg & Re-enable button after 7 seconds
   setTimeout(() => {
    errorMsg.textContent = "";
    errorMsg.classList.add("hidden"); // <— hide the message
    errorMsg.classList.remove("text-green-500", "text-red-500", "text-white");
    submitBtn.disabled = false;
}, 7000);


});

// Utility function to display errors
function showError(message, type = "error") {
    const errorMsg = document.getElementById("errorMsg");
    errorMsg.classList.remove("hidden", "text-green-500", "text-red-500", "text-white");

    if (type === "success") {
        errorMsg.classList.add("text-green-500");
    } else if (type === "neutral") {
        errorMsg.classList.add("text-white");
    } else {
        errorMsg.classList.add("text-red-500");
    }

    errorMsg.textContent = message;
}



// Utility function to display errors
// function showError(message) {
//     const errorMsg = document.getElementById("errorMsg");
//     errorMsg.textContent = message;
//     errorMsg.classList.remove("hidden");
// }

