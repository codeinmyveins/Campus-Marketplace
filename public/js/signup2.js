// Toggle the mobile menu
function toggleMenu() {
    document.getElementById("mobileMenu").classList.toggle("hidden");
}

document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("signupForm");
    const fullName = document.getElementById("fullName");
    const dob = document.getElementById("dob");
    const gender = document.getElementById("gender");
    const countryCodeDOM = document.getElementById("country"); // select tag
    const college = document.querySelector("select[name='college']");
    const errorMsg = document.getElementById("errorMsg");

    // Individual Error Elements
    const fullNameError = document.getElementById("fullNameError");
    const dobError = document.getElementById("dobError");
    const genderError = document.getElementById("genderError");

    // Validate full name (at least 3 characters)
    const isValidName = name => /^[A-Za-z ]{3,}$/.test(name.trim());

    // Validate age (min 16)
    const isAtLeast16 = dobValue => {
        const birthDate = new Date(dobValue);
        const today = new Date();
        const age = today.getFullYear() - birthDate.getFullYear();
        const hasHadBirthday =
            today.getMonth() > birthDate.getMonth() ||
            (today.getMonth() === birthDate.getMonth() &&
                today.getDate() >= birthDate.getDate());
        return age >= 16 || (age === 16 && hasHadBirthday);
    };

    // Handle Form Submission
    form.addEventListener("submit", e => {
        e.preventDefault();

        let isValid = true;
        errorMsg.classList.add("hidden");

        // Full Name Validation
        if (!isValidName(fullName.value)) {
            fullNameError.classList.remove("hidden");
            isValid = false;
        } else {
            fullNameError.classList.add("hidden");
        }

        // DOB Validation
        if (!isAtLeast16(dob.value)) {
            dobError.classList.remove("hidden");
            isValid = false;
        } else {
            dobError.classList.add("hidden");
        }

        // Gender Validation
        if (!gender.value) {
            genderError.classList.remove("hidden");
            isValid = false;
        } else {
            genderError.classList.add("hidden");
        }

        // Country and College required
        if (!countryCodeDOM.value || !college.value) {
            errorMsg.innerText = "Please select both country and college.";
            errorMsg.classList.remove("hidden");
            isValid = false;
        }

        // Final Check
        if (isValid) {
            errorMsg.classList.add("hidden");
            // alert("✅ Form submitted successfully!");
            // Submit via AJAX or redirect here
        }
    });

    // Truncate long country names
    const truncateString = (str, max) =>
        str.length > max ? str.slice(0, max) + "…" : str;

    // Populate country options dynamically
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
                            ? `${c.idd.root}${c.idd.suffixes[0]}`
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
