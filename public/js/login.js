const showMsg = getShowMsg(document.getElementById("infoErrorMsg"));


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

form.addEventListener("submit", async function (e) {
  e.preventDefault();

  const usernameOrEmail = form.username.value.trim();
  const password = form.password.value.trim();


  // Empty Fields Check
  if (!usernameOrEmail || !password) {
    showMsg("Please fill in both fields.", ERROR);
    return;
  }

  // Check if input is email or username
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const usernamePattern = /^[a-zA-Z0-9]+$/;

  const isEmail = emailPattern.test(usernameOrEmail);
  const isUsername = usernamePattern.test(usernameOrEmail);

  if (!isEmail && !isUsername) {
    showMsg("Enter a valid email or a username (letters and numbers only).", ERROR);
    return;
  }

  // Check if usernameOrEmail is an email or username
  let reqBody = { password, device_fingerprint: await generateDeviceFingerprint() };

  if (usernameOrEmail.includes("@")) {
    reqBody.email = usernameOrEmail;
  }
  else {
    reqBody.username = usernameOrEmail;
  }

  showMsg("Loading...", INFO); // Show loading message

  try {
    const { data } = await axios.post('/api/auth/login', reqBody);
    // Handle response
    showMsg(data.msg, SUCCESS); // Replace with actual success handling
    // Redirect to dashboard or show success message 

    if (data.code === 31) {
      window.location.href = "./signup2.html";
    } else {
      window.location.href = "./dashboard.html";
    }

  } catch (error) {
    if (error.response?.data?.msg)
      showMsg(error.response.data.msg, ERROR);
    else console.error(error);
  }
});
