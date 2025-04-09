// const inputs = document.querySelectorAll(".otp-input");
// const timerEl = document.getElementById("timer");
// const resendBtn = document.getElementById("resendBtn");
// const overlay = document.getElementById("overlay");
// const changeEmailBtn = document.getElementById("changeEmailBtn");
// const emailPopup = document.getElementById("emailPopup");
// const closePopupBtn = document.getElementById("closePopupBtn");
// const newEmailInput = document.getElementById("newEmail");
// const updateEmailBtn = document.getElementById("updateEmailBtn");
// const currentEmailEl = document.getElementById("currentEmail");
// const statusMessage = document.getElementById("statusMessage");
// const otpForm = document.getElementById("otpForm");
// const errorMsg = document.getElementById("errorMsg");

// const candidateEmail = new URLSearchParams(window.location.search).get("email");

// // 📨 Load Previous Email or Default
// let currentEmail = candidateEmail || "student@example.com";
// currentEmailEl.textContent = currentEmail;

// let timerInterval = null;

// // ✨ Show inline message (success / error / info)
// function showMessage(text, type = "info") {
//   statusMessage.textContent = text;
//   statusMessage.className = `text-sm mt-2 font-medium ${type === "success"
//       ? "text-green-600"
//       : type === "error"
//         ? "text-red-600"
//         : "text-[var(--color2)]"
//     }`;

//   // Auto-clear after 5 seconds
//   setTimeout(() => {
//     statusMessage.textContent = "";
//   }, 7000);
// }

// // 🔢 OTP Input Logic
// inputs.forEach((input, index) => {
//   input.addEventListener("input", () => {
//     input.value = input.value.replace(/\D/g, "");
//     if (input.value && index < inputs.length - 1) {
//       inputs[index + 1].focus();
//     }
//   });

//   input.addEventListener("keydown", (e) => {
//     if (e.key === "Backspace" && !input.value && index > 0) {
//       inputs[index - 1].focus();
//     }
//   });
// });

// // ⏳ Timer Logic
// function startTimer(duration) {
//   clearInterval(timerInterval); // 🛑 Stop existing timer

//   let timeLeft = duration;

//   timerInterval = setInterval(() => {
//     const minutes = Math.floor(timeLeft / 60);
//     const seconds = timeLeft % 60;
//     timerEl.textContent = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;

//     if (timeLeft <= 0) {
//       clearInterval(timerInterval);
//       showMessage("⏰ OTP has expired. Please request a new one.", "error");

//       // Enable resend button
//       resendBtn.disabled = false;
//       resendBtn.classList.remove("opacity-50", "cursor-not-allowed");

//       // Clear OTP fields
//       inputs.forEach((input) => (input.value = ""));
//       timerEl.textContent = "00:00";
//     }

//     timeLeft--;
//   }, 1000);
// }

// // 🚀 Start Timer on Page Load
// startTimer(299);

// // 🔁 Resend OTP
// resendBtn.addEventListener("click", () => {
//   showMessage(`📩 OTP resent to ${currentEmail}`, "success");
//   resendBtn.disabled = true;
//   resendBtn.classList.add("opacity-50", "cursor-not-allowed");
//   startTimer(299);
// });

// // ✉️ Open Email Modal
// changeEmailBtn.addEventListener("click", () => {
//   overlay.classList.remove("hidden");
//   emailPopup.classList.remove("hidden");
//   setTimeout(() => emailPopup.classList.add("scale-100"), 10);
// });

// // ❌ Close Modal via overlay or close button
// function closePopup() {
//   emailPopup.classList.remove("scale-100");
//   overlay.classList.add("hidden");

//   setTimeout(() => {
//     emailPopup.classList.add("hidden");
//     newEmailInput.value = "";
//   }, 300); // match CSS transition
// }

// overlay.addEventListener("click", closePopup);
// closePopupBtn.addEventListener("click", closePopup);

// // ✅ Update Email
// updateEmailBtn.addEventListener("click", () => {
//   const email = newEmailInput.value.trim();
//   const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

//   if (!emailRegex.test(email)) {
//     showMessage("⚠️ Please enter a valid email address.", "error");
//     return;
//   }

//   currentEmail = email;
//   currentEmailEl.textContent = currentEmail;
//   localStorage.setItem("userEmail", currentEmail);

//   showMessage(`✅ OTP sent to ${email}`, "success");
//   closePopup(); // Close the modal
//   newEmailInput.value = "";
//   resendBtn.disabled = true;
//   resendBtn.classList.add("opacity-50", "cursor-not-allowed");
//   startTimer(299);
// });

// // 🔃 Autofocus first OTP input
// inputs[0].focus();


// otpForm.addEventListener("submit", async (e) => {

//   e.preventDefault();
//   let otp = "";
//   for (let i = 0; i < 6; i++) {
//     otp += inputs[i.toString()].value;
//   }

//   if (!/^[0-9]{6}$/.test(otp)) {
//     showError("Please enter a valid email address.");
//     return;
//   }

//   try {
//     const { data } = await axios.post("/api/auth/verify-email", {
//       otp,
//     });

//     errorMsg.textContent = data.msg;
//     window.location.href = "./signup2.html";
    
//   } catch (error) {
//     console.error(error)
//     if (error.status === 401){
//       alert(error.response.data.msg);
//       window.location.href = "./signup1.html";
//       return;
//     }
//     showError(error.response.data.msg);
//   }
//   // Auto-clear after 5 seconds
//   setTimeout(() => {
//     errorMsg.textContent = "";
//   }, 7000);

// });

// // Utility function to display errors
// function showError(message) {
//   const errorMsg = document.getElementById("errorMsg");
//   errorMsg.textContent = message;
//   errorMsg.classList.remove("hidden");
// }

// ---------------------------------------------------------------------------------------

// const inputs = document.querySelectorAll(".otp-input");
// const timerEl = document.getElementById("timer");
// const resendBtn = document.getElementById("resendBtn");
// const overlay = document.getElementById("overlay");
// const changeEmailBtn = document.getElementById("changeEmailBtn");
// const emailPopup = document.getElementById("emailPopup");
// const closePopupBtn = document.getElementById("closePopupBtn");
// const newEmailInput = document.getElementById("newEmail");
// const updateEmailBtn = document.getElementById("updateEmailBtn");
// const currentEmailEl = document.getElementById("currentEmail");
// const statusMessage = document.getElementById("statusMessage");
// const otpForm = document.getElementById("otpForm");
// const errorMsg = document.getElementById("errorMsg");
// const popupError = document.getElementById("popupError"); // 📍 Add this in HTML inside popup

// const candidateEmail = new URLSearchParams(window.location.search).get("email");

// // 📨 Load Previous Email or Default
// let currentEmail = candidateEmail || "student@example.com";
// currentEmailEl.textContent = currentEmail;

// let timerInterval = null;

// // ✨ Show inline message (success / error / info)
// function showMessage(text, type = "info") {
//   statusMessage.textContent = text;
//   statusMessage.className = `text-sm mt-2 font-medium ${type === "success"
//       ? "text-green-600"
//       : type === "error"
//         ? "text-red-600"
//         : "text-[var(--color2)]"
//     }`;

//   setTimeout(() => {
//     statusMessage.textContent = "";
//   }, 7000);
// }

// // 🔢 OTP Input Logic
// inputs.forEach((input, index) => {
//   input.addEventListener("input", () => {
//     input.value = input.value.replace(/\D/g, "");
//     if (input.value && index < inputs.length - 1) {
//       inputs[index + 1].focus();
//     }
//   });

//   input.addEventListener("keydown", (e) => {
//     if (e.key === "Backspace" && !input.value && index > 0) {
//       inputs[index - 1].focus();
//     }
//   });
// });

// // ⏳ Timer Logic
// function startTimer(duration) {
//   clearInterval(timerInterval); // 🛑 Stop existing timer

//   let timeLeft = duration;

//   timerInterval = setInterval(() => {
//     const minutes = Math.floor(timeLeft / 60);
//     const seconds = timeLeft % 60;
//     timerEl.textContent = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;

//     if (timeLeft <= 0) {
//       clearInterval(timerInterval);
//       showMessage("⏰ OTP has expired. Please request a new one.", "error");

//       resendBtn.disabled = false;
//       resendBtn.classList.remove("opacity-50", "cursor-not-allowed");

//       inputs.forEach((input) => (input.value = ""));
//       timerEl.textContent = "00:00";
//     }

//     timeLeft--;
//   }, 1000);
// }

// // 🚀 Start Timer on Page Load
// startTimer(299);

// // 🔁 Resend OTP
// resendBtn.addEventListener("click", () => {
//   showMessage(`📩 OTP resent to ${currentEmail}`, "success");
//   resendBtn.disabled = true;
//   resendBtn.classList.add("opacity-50", "cursor-not-allowed");
//   startTimer(299);
// });

// // ✉️ Open Email Modal
// changeEmailBtn.addEventListener("click", () => {
//   popupError.textContent = ""; // Clear old errors
//   overlay.classList.remove("hidden");
//   emailPopup.classList.remove("hidden");
//   setTimeout(() => emailPopup.classList.add("scale-100"), 10);
// });

// // ❌ Close Modal via overlay or close button
// function closePopup() {
//   emailPopup.classList.remove("scale-100");
//   overlay.classList.add("hidden");

//   setTimeout(() => {
//     emailPopup.classList.add("hidden");
//     newEmailInput.value = "";
//     popupError.textContent = "";
//   }, 300);
// }

// overlay.addEventListener("click", closePopup);
// closePopupBtn.addEventListener("click", closePopup);

// // ✅ Update Email
// updateEmailBtn.addEventListener("click", async () => {
//   const email = newEmailInput.value.trim();
//   const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

//   popupError.textContent = "";

//   if (!emailRegex.test(email)) {
//     popupError.textContent = "⚠️ Please enter a valid email address.";
//     return;
//   }

//   try {
//     // Simulate server call or replace this with real API
//     // const { data } = await axios.post("/api/auth/send-otp", { email });

//     // On success:
//     currentEmail = email;
//     currentEmailEl.textContent = currentEmail;
//     localStorage.setItem("userEmail", currentEmail);

//     showMessage(`✅ OTP sent to ${email}`, "success");
//     closePopup();
//     resendBtn.disabled = true;
//     resendBtn.classList.add("opacity-50", "cursor-not-allowed");
//     startTimer(299);
//   } catch (err) {
//     console.error(err);
//     popupError.textContent = "❌ Failed to update email. Please try again.";
//   }
// });

// // 🔃 Autofocus first OTP input
// inputs[0].focus();

// otpForm.addEventListener("submit", async (e) => {
//   e.preventDefault();
//   let otp = "";
//   for (let i = 0; i < 6; i++) {
//     otp += inputs[i.toString()].value;
//   }

//   if (!/^[0-9]{6}$/.test(otp)) {
//     showError("Please enter a valid 6-digit OTP.");
//     return;
//   }

//   try {
//     const { data } = await axios.post("/api/auth/verify-email", { otp });

//     errorMsg.textContent = data.msg;
//     window.location.href = "./signup2.html";
//   } catch (error) {
//     console.error(error);
//     if (error.response?.status === 401) {
//       alert(error.response.data.msg);
//       window.location.href = "./signup1.html";
//       return;
//     }
//     showError(error.response?.data?.msg || "An error occurred. Please try again.");
//   }

//   setTimeout(() => {
//     errorMsg.textContent = "";
//   }, 7000);
// });

// // Utility function to display errors
// function showError(message) {
//   errorMsg.textContent = message;
//   errorMsg.classList.remove("hidden");
// }
// ______________________________________________________________________
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
const statusMessage = document.getElementById("statusMessage");
const otpForm = document.getElementById("otpForm");
const errorMsg = document.getElementById("errorMsg");
const popupError = document.getElementById("popupError");

const candidateEmail = new URLSearchParams(window.location.search).get("email");
let currentEmail = candidateEmail || "student@example.com";
currentEmailEl.textContent = currentEmail;

let timerInterval = null;
let messageTimeout = null;

// ✨ Show inline message (success / error / info)
function showMessage(text, type = "info") {
  clearTimeout(messageTimeout);
  statusMessage.textContent = text;
  statusMessage.className = `text-sm mt-2 font-medium ${
    type === "success"
      ? "text-green-600"
      : type === "error"
      ? "text-red-600"
      : "text-[var(--color2)]"
  }`;

  messageTimeout = setTimeout(() => {
    statusMessage.textContent = "";
  }, 7000);
}

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
  clearInterval(timerInterval);

  let timeLeft = duration;

  timerInterval = setInterval(() => {
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    timerEl.textContent = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;

    if (timeLeft <= 0) {
      clearInterval(timerInterval);
      showMessage("⏰ OTP has expired. Please request a new one.", "error");

      resendBtn.disabled = false;
      resendBtn.classList.remove("opacity-50", "cursor-not-allowed");

      inputs.forEach((input) => (input.value = ""));
      timerEl.textContent = "00:00";
    }

    timeLeft--;
  }, 1000);
}

startTimer(299);

// 🔁 Resend OTP
resendBtn.addEventListener("click", async () => {

  try {
    const { data } = await axios.post("/api/auth/resend-otp/register");
    showMessage(data.msg, "success");
  } catch (error) {
    console.error(error);
    showMessage(error.response.data.msg, "error");
  }
  setTimeout(() => {
    errorMsg.textContent = "";
    errorMsg.classList.add("hidden");
  }, 7000);

  resendBtn.disabled = true;
  resendBtn.classList.add("opacity-50", "cursor-not-allowed");
  startTimer(299);
});

// ✉️ Open Email Modal
changeEmailBtn.addEventListener("click", () => {
  popupError.textContent = "";
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
    popupError.textContent = "";
  }, 300);
}

overlay.addEventListener("click", closePopup);
closePopupBtn.addEventListener("click", closePopup);

// ✅ Update Email
updateEmailBtn.addEventListener("click", async () => {
  const email = newEmailInput.value.trim();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  popupError.textContent = "";

  if (!emailRegex.test(email)) {
    popupError.textContent = "⚠️ Please enter a valid email address.";
    return;
  }

  try {
    // Simulated request or real server call
    const { data } = await axios.patch("/api/auth/email", { email });

    currentEmail = email;
    currentEmailEl.textContent = currentEmail;
    localStorage.setItem("userEmail", currentEmail);

    showMessage(data.msg, "success");
    closePopup();
    resendBtn.disabled = true;
    resendBtn.classList.add("opacity-50", "cursor-not-allowed");
    startTimer(299);
  } catch (err) {
    console.error(err);
    popupError.textContent = err.response.data.msg;
  }
});

// 🧠 Autofocus first input
inputs[0].focus();

// 🚀 OTP Form Submission
otpForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  let otp = "";
  for (let i = 0; i < 6; i++) {
    otp += inputs[i].value;
  }

  if (!/^[0-9]{6}$/.test(otp)) {
    showError("Please enter a valid 6-digit OTP.","error");
    return;
  }

  try {
    const { data } = await axios.post("/api/auth/verify-email", { otp });

    errorMsg.textContent = data.msg;
    errorMsg.classList.remove("hidden");

    setTimeout(() => {
      window.location.href = "./signup2.html";
    }, 1000);
  } catch (error) {
    console.error(error);
    if (error.response?.status === 401) {
      window.location.href = "./signup1.html";
    } else {
      showError(error.response?.data?.msg || "An error occurred. Please try again.");
    }
  }

  setTimeout(() => {
    errorMsg.textContent = "";
    errorMsg.classList.add("hidden");
  }, 7000);
});

// ❌ Show error
function showError(message) {
  errorMsg.textContent = message;
  errorMsg.classList.remove("hidden");
}
