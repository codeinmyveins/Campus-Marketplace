// const inputs = document.querySelectorAll(".otp-input");

//       inputs.forEach((input, index) => {
//         input.addEventListener("input", (e) => {
//           // Allow only digits
//           input.value = input.value.replace(/\D/g, "");

//           // Auto move to next
//           if (input.value && index < inputs.length - 1) {
//             inputs[index + 1].focus();
//           }
//         });

//         input.addEventListener("keydown", (e) => {
//           // Move to previous on backspace
//           if (e.key === "Backspace" && !input.value && index > 0) {
//             inputs[index - 1].focus();
//           }
//         });
//       });
  const inputs = document.querySelectorAll(".otp-input");
  const timerEl = document.getElementById("timer");
  const resendBtn = document.getElementById("resendBtn");

  // 🔢 OTP Input Logic
  inputs.forEach((input, index) => {
    input.addEventListener("input", (e) => {
      input.value = input.value.replace(/\D/g, ""); // Allow only digits

      if (input.value && index < inputs.length - 1) {
        inputs[index + 1].focus(); // Auto move to next input
      }
    });

    input.addEventListener("keydown", (e) => {
      if (e.key === "Backspace" && !input.value && index > 0) {
        inputs[index - 1].focus(); // Move to previous on backspace
      }
    });
  });

  // ⏳ Timer Logic for Resend OTP
  function startTimer(duration) {
    let timeLeft = duration;

    const interval = setInterval(() => {
      const minutes = Math.floor(timeLeft / 60);
      const seconds = timeLeft % 60;
      timerEl.textContent = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;

      if (timeLeft <= 0) {
        clearInterval(interval);
        resendBtn.disabled = false;
        resendBtn.classList.remove("opacity-50", "cursor-not-allowed");
        timerEl.textContent = "00:00";
      }

      timeLeft--;
    }, 1000);
  }

  // Start timer on page load (2 minutes)
  startTimer(119);

  // 🔁 Resend OTP Handler
  resendBtn.addEventListener("click", () => {
    alert("OTP resent!"); // Placeholder — replace with actual resend logic

    resendBtn.disabled = true;
    resendBtn.classList.add("opacity-50", "cursor-not-allowed");
    timerEl.textContent = "01:59";

    startTimer(119); // Restart timer
  });
