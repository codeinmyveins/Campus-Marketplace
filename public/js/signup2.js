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

document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("signupForm");
    const fullName = document.getElementById("fullName");
    const gender = document.getElementById("gender");
    const countryCodeDOM = document.getElementById("country");
    const college = document.querySelector("select[name='college']");
    const phoneInput = document.getElementById("phone");
    const errorMsg = document.getElementById("errorMsg");

    // DOB dropdown fields
    const day = document.getElementById("day");
    const month = document.getElementById("month");
    const year = document.getElementById("year");

    // Error Elements
    const fullNameError = document.getElementById("fullNameError");
    const dobError = document.getElementById("dobError");
    const genderError = document.getElementById("genderError");
    const phoneError = document.getElementById("phoneError");

    // ✅ Validate full name (at least 3 characters, only alphabets and space)
    const isValidName = name => /^[A-Za-z\s]{3,}$/.test(name.trim());

    // ✅ Validate age (at least 16)
    const isAtLeast16 = (y, m, d) => {
        const birthDate = new Date(y, m - 1, d);
        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const hasHadBirthday =
            today.getMonth() > birthDate.getMonth() ||
            (today.getMonth() === birthDate.getMonth() && today.getDate() >= birthDate.getDate());
        return age > 16 || (age === 16 && hasHadBirthday);
    };

    // ✅ Validate phone number (10 to 15 digits, no special characters)
    const isValidPhone = phone => /^\d{10,15}$/.test(phone.trim());

    // ✅ Form Submission Handler
    form.addEventListener("submit", e => {
        e.preventDefault();

        let isValid = true;
        errorMsg.classList.add("hidden");

        // Full Name Validation
        if (!isValidName(fullName.value)) {
            fullNameError.textContent = "Full name must be at least 3 characters and only contain letters and spaces.";
            fullNameError.classList.remove("hidden");
            isValid = false;
        } else {
            fullNameError.classList.add("hidden");
        }

        // DOB Validation
        if (!day.value || !month.value || !year.value || !isAtLeast16(year.value, month.value, day.value)) {
            dobError.textContent = "You must be at least 16 years old.";
            dobError.classList.remove("hidden");
            isValid = false;
        } else {
            dobError.classList.add("hidden");
        }

        // Gender Validation
        if (!gender.value) {
            genderError.textContent = "Please select a gender.";
            genderError.classList.remove("hidden");
            isValid = false;
        } else {
            genderError.classList.add("hidden");
        }

        // Phone Validation
        if (!isValidPhone(phoneInput.value)) {
            phoneError.textContent = "Phone number must be 10–15 digits without any letters or special characters.";
            phoneError.classList.remove("hidden");
            isValid = false;
        } else {
            phoneError.classList.add("hidden");
        }

        // Country & College Validation
        if (!countryCodeDOM.value || !college.value) {
            errorMsg.innerText = "Please select both a valid country and college.";
            errorMsg.classList.remove("hidden");
            isValid = false;
        } else {
            errorMsg.classList.add("hidden");
        }

        // Final Check
        if (isValid) {
            // ✅ Success - Submit the form or do something
            console.log("Form is valid! ✅ Submitting...");
            // form.submit(); // Uncomment this line to enable actual form submission
        }
    });

    // ✅ Populate Day
    for (let d = 1; d <= 31; d++) {
        const opt = document.createElement("option");
        opt.value = d;
        opt.textContent = d;
        day.appendChild(opt);
    }

    // ✅ Populate Month
    const monthNames = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];
    monthNames.forEach((m, idx) => {
        const opt = document.createElement("option");
        opt.value = idx + 1;
        opt.textContent = m;
        month.appendChild(opt);
    });

    // ✅ Populate Year (last 100 years)
    const currentYear = new Date().getFullYear();
    for (let y = currentYear; y >= currentYear - 100; y--) {
        const opt = document.createElement("option");
        opt.value = y;
        opt.textContent = y;
        year.appendChild(opt);
    }

    // ✅ Truncate helper
    const truncateString = (str, max) =>
        str.length > max ? str.slice(0, max) + "…" : str;

    // ✅ Fetch and Fill Countries
    const fillCountryCodes = async () => {
        try {
            const { data } = await axios.get(
                "https://restcountries.com/v3.1/all?fields=name,cca2,idd"
            );

            data
                .sort((a, b) => a.name.common.localeCompare(b.name.common))
                .forEach(c => {
                    const name = truncateString(c.name.common, 18);
                    const option = document.createElement("option");
                    option.value = c.cca2;

                    const code =
                        c.idd?.root && c.idd?.suffixes
                            ? `${c.idd.root}${c.idd.suffixes[0]}`.trim()
                            : "";

                    option.innerText = `${name} ${code ? `(${code})` : ""}`;
                    countryCodeDOM.appendChild(option);
                });
        } catch (error) {
            console.error("Failed to fetch countries:", error);
        }
    };

    fillCountryCodes();
});
