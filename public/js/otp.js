const otpInputs = document.querySelectorAll(".otp-input");
const timerEl = document.getElementById("otpExpTimer");
const timerReEl = document.getElementById("otpResndTimer");
const resendBtn = document.getElementById("resendBtn");
const overlay = document.getElementById("overlay");
const changeEmailBtn = document.getElementById("changeEmailBtn");
const emailPopup = document.getElementById("emailPopup");
const closePopupBtn = document.getElementById("closePopupBtn");
const newEmailInput = document.getElementById("newEmail");
const updateEmailBtn = document.getElementById("updateEmailBtn");
const otpForm = document.getElementById("otpForm");

const currentEmailEl = document.getElementById("currentEmail");
currentEmailEl.textContent = localStorage.getItem("userEmail") || "student@example.com";;

const otpShowMsg = getShowMsg(document.querySelector("#otpForm #infoErrorMsg"));
const emailShowMsg = getShowMsg(document.querySelector("#emailPopup #infoErrorMsg"));

let otpExpTimerInterval = null;
let otpResndInterval = null;
let messageTimeout = null;

// 🔢 OTP Input Logic
otpInputs.forEach((input, index) => {
  input.addEventListener("input", () => {
    input.value = input.value.replace(/\D/g, "");
    if (input.value && index < otpInputs.length - 1) {
      otpInputs[index + 1].focus();
    }
  });

  input.addEventListener("keydown", (e) => {
    if (e.key === "Backspace" && !input.value && index > 0) {
      otpInputs[index - 1].focus();
    }
  });
});

// ⏳ OTP Expire Timer Logic
function startOtpEpxTimer(duration) {
  clearInterval(otpExpTimerInterval);

  let timeLeft = parseInt(localStorage.getItem("otpTime")) + duration - Math.floor(Date.now() / 1000);

  if (timeLeft <= 0) {
    clearInterval(otpExpTimerInterval);
    otpShowMsg("⏰ OTP has expired. Please request a new one.", ERROR);

    otpInputs.forEach((input) => (input.value = ""));
    timerEl.textContent = "00:00";
    return;
  }

  otpExpTimerInterval = setInterval(() => {
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    timerEl.textContent = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;

    startOtpEpxTimer(duration);
  }, 1000);
}

function startOtpResndTimer(duration) {
  clearInterval(otpResndInterval);

  let timeLeft = parseInt(localStorage.getItem("otpResnd")) + duration - Math.floor(Date.now() / 1000);

  if (timeLeft <= 0) {
    clearInterval(otpResndInterval);

    resendBtn.disabled = false;
    resendBtn.classList.remove("opacity-50", "cursor-not-allowed");
    timerReEl.textContent = "";
    return;
  }

  otpResndInterval = setInterval(() => {
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    timerReEl.textContent = ` in ${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;

    startOtpResndTimer(duration);
  }, 1000);
}

startOtpEpxTimer(300);
startOtpResndTimer(60);

// 🔁 Resend OTP
resendBtn.addEventListener("click", async () => {

  otpShowMsg("Loading...", INFO);

  try {
    const { data } = await axios.post("/api/auth/resend-otp/register");

    otpShowMsg(data.msg, SUCCESS);
    localStorage.setItem("otpTime", Math.floor(Date.now() / 1000));
    localStorage.setItem("otpResnd", Math.floor(Date.now() / 1000));
    startOtpResndTimer(60);

    resendBtn.disabled = true;
    resendBtn.classList.add("opacity-50", "cursor-not-allowed");

  } catch (error) {
    if (error.response?.data?.msg)
      otpShowMsg(error.response.data.msg, ERROR);
    else
      console.error(error);
  }
});

// ✉️ Open Email Modal
changeEmailBtn.addEventListener("click", () => {
  overlay.classList.remove("hidden");
  emailPopup.classList.remove("hidden");
  setTimeout(() => {
    emailPopup.classList.add("scale-100");
    newEmailInput.focus();
  }, 10);
});

// ❌ Close Modal
function closePopup() {
  emailPopup.classList.remove("scale-100");
  overlay.classList.add("hidden");

  setTimeout(() => {
    emailPopup.classList.add("hidden");
    newEmailInput.value = "";
  }, 300);
}

overlay.addEventListener("click", closePopup);
closePopupBtn.addEventListener("click", closePopup);

// ✅ Update Email
emailPopup.addEventListener("submit", async (e) => {
  e.preventDefault();
  const email = newEmailInput.value.trim();

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    emailShowMsg("Please enter a valid email address.", ERROR);
    return;
  }

  emailShowMsg("Loading...", INFOD);
  try {
    const { data } = await axios.patch("/api/auth/email", { email });

    currentEmail = email;
    currentEmailEl.textContent = currentEmail;
    localStorage.setItem("userEmail", currentEmail);

    localStorage.setItem("otpTime", Math.floor(Date.now() / 1000));
    localStorage.setItem("otpResnd", Math.floor(Date.now() / 1000));
    startOtpEpxTimer(300);
    
    emailShowMsg(data.msg, SUCCESS);
    otpShowMsg(data.msg, SUCCESS);

    closePopup();
  } catch (error) {
    if (error.response?.data?.msg)
      emailShowMsg(error.response.data.msg, ERROR);
    else console.error(error);
  }
});

// 🧠 Autofocus first input
otpInputs[0].focus();

// 🚀 OTP Form Submission
otpForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  let otp = "";
  for (let i = 0; i < 6; i++) {
    otp += otpInputs[i].value;
  }

  if (!/^[0-9]{6}$/.test(otp)) {
    otpShowMsg("Please enter a valid 6-digit OTP.", ERROR);
    return;
  }

  otpShowMsg("Loading...", INFO);

  try {
    const { data } = await axios.post("/api/auth/verify-email", { otp });

    otpShowMsg(data.msg, SUCCESS);
    localStorage.removeItem("userEmail");
    localStorage.removeItem("otpTime");

    setTimeout(() => {
      window.location.href = "./signup2.html";
    }, 1000);
  } catch (error) {
    
    if (!error.response?.data?.msg)
      return console.error(error);
    
    if (error.response?.status === 401){
      alert("Authentication Invalid")
      return window.location.href = "./signup1.html";
    }
    else
      otpShowMsg(error.response.data.msg, ERROR);
  }
});
