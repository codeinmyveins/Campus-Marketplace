const showMsg = getShowMsg(document.getElementById("infoErrorMsg"));

const form = document.getElementById("signupForm");
const countryCodeDOM = document.getElementById("country");

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

// college Setup

const collegeInput = document.getElementById('college');
const dropdown = document.getElementById('college-options');

let selectedCollegeId = null;

collegeInput.addEventListener('input', async () => {
  const query = collegeInput.value.trim();
  if (query.length < 2) {
    dropdown.classList.add('hidden');
    return;
  }

  try {
    const { data: { nbHits, colleges } } = await axios.get(`/api/colleges?search=${encodeURIComponent(query)}`);

    if (nbHits === 0) {
        showMsg("No colleges matched", INFO);
        return;
    }

    dropdown.innerHTML = colleges.map(college => `
        <li class="cursor-pointer px-4 py-2 hover:bg-[var(--color2)] hover:text-[var(--color3)]" data-id="${college.id}">
          ${college.name}
        </li>
      `).join('');
    
      dropdown.classList.remove('hidden');

  } catch(error) {
    console.error(error);
    showMsg("Server is Down", ERROR);
  }

});

dropdown.addEventListener('click', e => {
  const li = e.target.closest('li');
  if (!li) return;
  collegeInput.value = li.textContent.trim();
  selectedCollegeId = li.dataset.id;
  dropdown.classList.add('hidden');
});

// Optional: click outside to close dropdown
document.addEventListener('click', (e) => {
  if (!dropdown.contains(e.target) && e.target !== collegeInput) {
    dropdown.classList.add('hidden');
  }
});

// To access the selected college ID in form submission
function getSelectedCollegeId() {
  return selectedCollegeId;
}

// ✅ Form Submission Handler
form.addEventListener("submit", async (e) => {
    e.preventDefault();
    
    const full_name = form.fullName.value.trim();
    const gender = form.gender.value.trim();
    const day = form.day.value.trim();
    const month = form.month.value.trim();
    const year = form.year.value.trim();
    const dob = `${year}-${month}-${day}`;
    const country_code = form.country.value.trim();
    const phone = form.phone.value.trim();
    // const college_id = form.college.value.trim();
    const college_id = getSelectedCollegeId();

    
    
    // Full Name Validation
    // ✅ Validate full name (at least 3 characters, only alphabets and space)
    const isValidName = name => /^[A-Za-z\s]{3,}$/.test(name.trim());
    if (!isValidName(full_name)) {
        showMsg("Full name must be at least 3 characters and only contain letters and spaces.",ERROR);
        return;
    }

    // Gender Validation
    if (!gender) {
        showMsg("Please select a gender.",ERROR);
        return;
    }
    
    // Country Code Validation
    if (!country_code) {
    showMsg("Please select a country.",ERROR);
    return;
    };

    // college name Validation
    if (!college_id) {
        showMsg("Please select a college.",ERROR);
        return;
    }

    showMsg("loading...", INFO);

    try {
        const { data } = await axios.patch("/api/auth/register/complete", {
            full_name,
            dob,
            gender,
            country_code,
            phone,
            college_id,
            device_fingerprint:await generateDeviceFingerprint(),
        });


        showMsg(data.msg, SUCCESS);
        window.location.href = "./loader.html";

    } catch (error) {
        if (error.response?.data?.msg)
            showMsg(error.response.data.msg, ERROR);
        else console.error(error);
    }});

// ✅ Populate Day
for (let d = 1; d <= 31; d++) {
    const opt = document.createElement("option");
    opt.value = String(d).padStart(2, "0");
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
    opt.value = String(idx + 1).padStart(2, "0");
    opt.textContent = m;
    month.appendChild(opt);
});

// ✅ Populate Year (last 100 years)
const currentYear = new Date().getFullYear();
for (let y = currentYear; y >= currentYear - 100; y--) {
    const opt = document.createElement("option");
    opt.value = String(y);
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
