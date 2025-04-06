const inputs = document.querySelectorAll(".otp-input");
const timerEl = document.getElementById("timer");
const resendBtn = document.getElementById("resendBtn");
const overlay = document.getElementById("overlay");
const changeEmailBtn = document.getElementById("changeEmailBtn");
const emailPopup = document.getElementById("emailPopup");
const closePopupBtn = document.getElementById("closePopupBtn");
const newEmailInput = document.getElementById("newEmail");
const updateEmailBtn = document.getElementById("updateEmailBtn");
const currentEmailEl = document.getElementById("currentEmail");

// 📨 Load Previous Email or Default
let currentEmail = localStorage.getItem("userEmail") || "student@example.com";
currentEmailEl.textContent = currentEmail;

let timerInterval = null;

// 🔢 OTP Input Logic
inputs.forEach((input, index) => {
  input.addEventListener("input", () => {
    input.value = input.value.replace(/\D/g, "");
    if (input.value && index < inputs.length - 1) {
      inputs[index + 1].focus();
    }
  });

  input.addEventListener("keydown", (e) => {
    if (e.key === "Backspace" && !input.value && index > 0) {
      inputs[index - 1].focus();
    }
  });
});

// ⏳ Timer Logic
function startTimer(duration) {
  clearInterval(timerInterval); // 🛑 Stop existing timer

  let timeLeft = duration;

  timerInterval = setInterval(() => {
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    timerEl.textContent = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;

    if (timeLeft <= 0) {
      clearInterval(timerInterval);
      alert("⏰ OTP has expired. Please request a new one.");

      // Enable resend button
      resendBtn.disabled = false;
      resendBtn.classList.remove("opacity-50", "cursor-not-allowed");

      // Clear OTP fields
      inputs.forEach((input) => (input.value = ""));
      timerEl.textContent = "00:00";
    }

    timeLeft--;
  }, 1000);
}

// 🚀 Start Timer on Page Load
startTimer(299);

// 🔁 Resend OTP
resendBtn.addEventListener("click", () => {
  alert("OTP resent to " + currentEmail);
  resendBtn.disabled = true;
  resendBtn.classList.add("opacity-50", "cursor-not-allowed");
  startTimer(299);
});

// ✉️ Open Email Modal
changeEmailBtn.addEventListener("click", () => {
  overlay.classList.remove("hidden");
  emailPopup.classList.remove("hidden");
  setTimeout(() => emailPopup.classList.add("scale-100"), 10);
});

// ❌ Close Modal via overlay or close button
function closePopup() {
  emailPopup.classList.remove("scale-100");
  overlay.classList.add("hidden");

  setTimeout(() => {
    emailPopup.classList.add("hidden");
  }, 300); // match CSS transition
}

overlay.addEventListener("click", closePopup);
closePopupBtn.addEventListener("click", closePopup);

// ✅ Update Email
updateEmailBtn.addEventListener("click", () => {
  const email = newEmailInput.value.trim();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!emailRegex.test(email)) {
    alert("Please enter a valid email.");
    return;
  }

  currentEmail = email;
  currentEmailEl.textContent = currentEmail;
  localStorage.setItem("userEmail", currentEmail);

  alert(`OTP sent to ${email}`);
  closePopup(); // Close the modal
  newEmailInput.value = "";
  resendBtn.disabled = true;
  resendBtn.classList.add("opacity-50", "cursor-not-allowed");
  startTimer(299);
});

// 🔃 Autofocus first OTP input
inputs[0].focus();
