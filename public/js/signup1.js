// Toggle the mobile menu
function toggleMenu() {
    document.getElementById("mobileMenu").classList.toggle("hidden");
}

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
        showError("Username must contain only lowercase letters and numbers.");
        return;
    }

    // Email Validation
    let emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(email)) {
        showError("Please enter a valid email address.");
        return;
    }

    // Password Validation
    if (password.length < 8) {
        showError("Password must be at least 6 characters long.");
        return;
    }

    // Confirm Password Match
    if (password !== confirmPassword) {
        showError("Passwords do not match.");
        return;
    }

    // All validations passed
    // errorMsg.textContent = "";
    // errorMsg.classList.add("hidden");
    
    // Proceed with form submission
    errorMsg.textContent = "Loading...";
    errorMsg.classList.remove("hidden");
    
    try {
        const {data} = await axios.post("/api/auth/register", {
            username,
            email,
            password,
        });
        errorMsg.textContent = data.msg;
        window.location.href = `./otp.html?email=${email}`;


    } catch (error) {
        showError(error.response.data.msg);
    }
    // Auto-clear after 5 seconds
  setTimeout(() => {
    errorMsg.textContent = "";
  }, 7000);
});

// Utility function to display errors
function showError(message) {
    const errorMsg = document.getElementById("errorMsg");
    errorMsg.textContent = message;
    errorMsg.classList.remove("hidden");
}

// Utility function to display errors
// function showError(message) {
//     const errorMsg = document.getElementById("errorMsg");
//     errorMsg.textContent = message;
//     errorMsg.classList.remove("hidden");
// }

