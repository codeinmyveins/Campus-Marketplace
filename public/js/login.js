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

// Attach toggle to icon
document
  .getElementById("togglePassword")
  .addEventListener("click", function () {
    toggleVisibility("password", "togglePassword");
  });

// Form Validation & Login Simulation ✅
const form = document.querySelector("form");
const errorMsg = document.getElementById("errorMsg");

form.addEventListener("submit", async function (e) {
  e.preventDefault();

  const usernameOrEmail = form.username.value.trim();
  const password = form.password.value.trim();

  errorMsg.classList.add("hidden");

  // Empty Fields Check
  if (!usernameOrEmail || !password) {
    errorMsg.textContent = "Please fill in both fields.";
    errorMsg.classList.remove("hidden");
    return;
  }

  // Check if input is email or username
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const usernamePattern = /^[a-z0-9]+$/;

  const isEmail = emailPattern.test(usernameOrEmail);
  const isUsername = usernamePattern.test(usernameOrEmail);

  if (!isEmail && !isUsername) {
    errorMsg.textContent =
      "Enter a valid email or a username (lowercase letters and numbers only).";
    errorMsg.classList.remove("hidden");
    return;
  }

  // Password Length Check
  if (password.length < 6) {
    errorMsg.textContent = "Password must be at least 6 characters long.";
    errorMsg.classList.remove("hidden");
    return;
  }

  // ✅ Simulate Login / Replace with Backend API call
  // Example: Replace this with axios POST request if backend exists
  // try {
  //   const { data } = await axios.post('/api/login', { username, password });
  //   // Handle response
  // } catch (err) {
  //   errorMsg.textContent = err.response?.data?.message || "Login failed.";
  //   errorMsg.classList.remove("hidden");
  // }

  if (
    (usernameOrEmail === "admin" || usernameOrEmail === "admin@example.com") &&
    password === "password123"
  ) {
    // alert("Login successful! ✅");
    errorMsg.classList.remove("hidden");
    errorMsg.classList.remove("text-red-600");
    errorMsg.classList.add("text-green-600");
    errorMsg.textContent = "Login successful! ✅";
    // window.location.href = "dashboard.html";
  } else {
    errorMsg.textContent = "Invalid username/email or password.";
    errorMsg.classList.remove("hidden");
  }
});

