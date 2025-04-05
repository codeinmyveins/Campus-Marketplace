// // Function to toggle the mobile menu
// function toggleMenu() {
//     document.getElementById("mobileMenu").classList.toggle("hidden");
//   }
//   function toggleVisibility(inputId, toggleId) {
//     let passwordField = document.getElementById(inputId);
//     let toggleIcon = document.getElementById(toggleId);

//     if (passwordField.type === "password") {
//       passwordField.type = "text";
//       toggleIcon.textContent = "👀"; // Show open eye when visible
//     } else {
//       passwordField.type = "password";
//       toggleIcon.textContent = "👁️"; // Show closed eye when hidden
//     }
//   }

//   document
//     .getElementById("togglePassword")
//     .addEventListener("click", function () {
//       toggleVisibility("password", "togglePassword");
//     });

//   document
//     .getElementById("toggleConfirmPassword")
//     .addEventListener("click", function () {
//       toggleVisibility("confirmPassword", "toggleConfirmPassword");
//     });

//   document
//     .querySelector("form")
//     .addEventListener("submit", function (event) {
//       event.preventDefault(); // Prevent form submission if validation fails

//       let username = document
//         .querySelector("input[type='text']")
//         .value.trim();
//       let email = document
//         .querySelector("input[type='email']")
//         .value.trim();
//       let password = document.getElementById("password").value;
//       let confirmPassword =
//         document.getElementById("confirmPassword").value;

//       // Username Validation (Only lowercase letters and numbers)
//       let usernameRegex = /^[a-z0-9]+$/;
//       if (!usernameRegex.test(username)) {
//         alert("Username must contain only lowercase letters and numbers.");
//         return;
//       }

//       // Email Validation
//       let emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
//       if (!emailRegex.test(email)) {
//         alert("Please enter a valid email address.");
//         return;
//       }

//       // Password Validation (Minimum 6 characters)
//       if (password.length < 6) {
//         alert("Password must be at least 6 characters long.");
//         return;
//       }

//       // Confirm Password Validation
//       if (password !== confirmPassword) {
//         alert("Passwords do not match.");
//         return;
//       }

//       // If all validations pass, allow form submission
//       event.target.submit();
//     });
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
    .addEventListener("click", function () {
        toggleVisibility("password", "togglePassword");
    });

document
    .getElementById("toggleConfirmPassword")
    .addEventListener("click", function () {
        toggleVisibility("confirmPassword", "toggleConfirmPassword");
    });

document.querySelector("form").addEventListener("submit", function (event) {
    event.preventDefault(); // Prevent form submission if validation fails

    let username = document.querySelector("input[type='text']").value.trim();
    let email = document.querySelector("input[type='email']").value.trim();
    let password = document.getElementById("password").value;
    let confirmPassword = document.getElementById("confirmPassword").value;

    const errorMsg = document.getElementById("errorMsg");
    errorMsg.textContent = "";
    errorMsg.classList.add("hidden");

    // Username Validation
    let usernameRegex = /^[a-z0-9]+$/;
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
    if (password.length < 6) {
        showError("Password must be at least 6 characters long.");
        return;
    }

    // Confirm Password Match
    if (password !== confirmPassword) {
        showError("Passwords do not match.");
        return;
    }

    // All validations passed
    errorMsg.textContent = "";
    errorMsg.classList.add("hidden");

    // Proceed with form submission
    event.target.submit();
});

// Utility function to display errors
function showError(message) {
    const errorMsg = document.getElementById("errorMsg");
    errorMsg.textContent = message;
    errorMsg.classList.remove("hidden");
}

