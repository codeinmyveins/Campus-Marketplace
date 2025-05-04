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

async function getCountryNameFromCode(code) {
    try {
        const response = await axios.get(`https://restcountries.com/v3.1/alpha/${code}`);
        const country = response.data[0];
        return country.name.common;
    } catch (error) {
        console.error("Error fetching country:", error.message);
    }
}

function capitalizeWords(str) {
    return str.toLowerCase().split(" ").map(word => {
        return word.charAt(0).toUpperCase() + word.slice(1);
    }).join(" ");
}

// ✅ Truncate helper
function truncateString (str, max) {
    return str.length > max ? str.slice(0, max) + "…" : str;
}

let userData;
async function fillUserDetails() {

    try {

        const { data } = await apiAuth.get("/api/users?sensitive=true");

        const user = data.user;
        userData = user;

        const pfp = document.getElementById("pfp");
        pfp.dataset.value = user.avatar_url;
        if (user.avatar_url)
            pfp.src = user.avatar_url;

        const full_name = document.getElementById("full_name");
        full_name.textContent = user.full_name;
        full_name.dataset.value = user.full_name;

        const username = document.getElementById("username");
        username.textContent = user.username;
        username.dataset.value = user.username;

        const dob = document.getElementById("dob");
        dob.textContent = user.dob;
        const [dd, mm, yyyy] = user.dob.split("/");
        dob.dataset.value = `${yyyy}-${mm}-${dd}`;

        const gender = document.getElementById("gender");
        gender.textContent = capitalizeWords(user.gender);
        gender.dataset.value = user.gender;

        const country = document.getElementById("country_code");
        country.textContent = await getCountryNameFromCode(user.country_code);
        country.dataset.value = user.country_code;

        const college = document.getElementById("college_id");
        college.textContent = user.college_name;
        college.dataset.value = user.college_name;

        const bio = document.getElementById("bio");
        if (user.bio)
            bio.textContent = truncateString(user.bio, 32);
        bio.dataset.value = user.bio || "";

        const email = document.getElementById("email");
        email.textContent = user.email;
        email.dataset.value = user.email;

        const phone = document.getElementById("phone");
        phone.textContent = user.phone.split(" ")[1];
        phone.dataset.value = user.phone.split(" ")[1];


    } catch (error) {
        console.error(error);
        alert("Something went Wrong")
    }

}

fillUserDetails();

const showMsg = getShowMsg(document.getElementById("infoErrorMsg"));

const popup = document.getElementById("editPopup");
const label = document.getElementById("popupLabel");
const inputContainer = document.getElementById("popupInput");

let currentInputDiv = null;
let currentInput = null;
let originalContainer = null;

const popupCloseBtn = document.getElementById("popupCancel");
const popupSaveBtn = document.getElementById("popupSave");

document.querySelectorAll(".edit-btn").forEach(btn => {
    btn.addEventListener("click", () => {
        if (currentInputDiv && originalContainer) {
            popupCloseBtn.click();
            return;
        }
        const field = btn.closest(".field");
        const labelText = field.querySelector("p.text-sm").textContent;
        const inputDiv = field.querySelector(".input-div");
        const inputEl = inputDiv.querySelector(".input-el");
        const valueDisplay = field.querySelector(".field-value");
        if (inputEl.tagName === "INPUT") {
            inputEl.value = valueDisplay.dataset.value;
        } else if (inputEl.tagName === "TEXTAREA") {
            inputEl.value = valueDisplay.dataset.value;
        } else if (inputEl.tagName === "SELECT") {
            inputEl.value = valueDisplay.dataset.value;
        }
        
        // Move input to popup
        currentInput = inputEl;
        originalContainer = inputDiv.parentElement;
        currentInputDiv = inputDiv;
        inputDiv.classList.remove("hidden");
        inputContainer.appendChild(inputDiv);
        // input.value = valueDisplay.innerText;

        // Set popup label and input value
        label.textContent = labelText;

        // Position and show popup
        // const rect = field.getBoundingClientRect();
        // popup.style.top = `${window.scrollY + rect.bottom + 8}px`;
        // popup.style.left = `${rect.left}px`;
        // popup.style.width = `${rect.width}px`;

        popup.classList.remove("hidden");
        setTimeout(() => {
            popup.classList.add("opacity-100", "scale-100");
            popup.classList.remove("opacity-0", "scale-95");
        });
    });
});

popupCloseBtn.addEventListener("click", () => {
    if (currentInputDiv && originalContainer) {
        originalContainer.appendChild(currentInputDiv);
        currentInputDiv.classList.add("hidden");
        currentInput = null;
        currentInputDiv = null;
        originalContainer = null;
    }
    popup.classList.remove("opacity-100", "scale-100");
    popup.classList.add("opacity-0", "scale-95");
    setTimeout(() => popup.classList.add("hidden"), 150);
});

// Close when clicking outside
document.addEventListener("click", (e) => {
    if (!popup.contains(e.target) && !e.target.closest(".edit-btn")) {
        popupCloseBtn.click();
    }
});

// college Setup

const collegeInput = document.getElementById("collegeInput");
const dropdown = document.getElementById("college-options");

let selectedCollegeId = null;

collegeInput.addEventListener("input", async () => {
    const query = collegeInput.value.trim();
    if (query.length < 2) {
        dropdown.classList.add("hidden");
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
      `).join("");

        dropdown.classList.remove("hidden");

    } catch (error) {
        console.error(error);
        showMsg("Server is Down", ERROR);
    }

});

dropdown.addEventListener("click", e => {
    const li = e.target.closest("li");
    if (!li) return;
    collegeInput.value = li.textContent.trim();
    selectedCollegeId = li.dataset.id;
    dropdown.classList.add("hidden");
});

// Optional: click outside to close dropdown
document.addEventListener("click", (e) => {
    if (!dropdown.contains(e.target) && e.target !== collegeInput) {
        dropdown.classList.add("hidden");
    }
});

// To access the selected college ID in form submission
function getSelectedCollegeId() {
    return selectedCollegeId;
}

const countryCodeDOM = document.getElementById("countrySelect");

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

popup.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (currentInputDiv && originalContainer) {
        const name = currentInput.name;
        const value = (currentInput.tagName === "INPUT" && currentInput.id === "collegeInput")? getSelectedCollegeId():currentInput.value;

        showMsg("Loading...", INFO);

        try {

            const body = {};
            body[name] = value;

            const { data } = await apiAuth.patch("/api/users", body);

            showMsg(data.msg, SUCCESS);
            setTimeout(() => { popupCloseBtn.click(); }, 1000);

            const textDisplay = document.getElementById(name);
            if (name === "bio") {
                textDisplay.textContent = truncateString(value, 32);
                textDisplay.dataset.value = value;
            }
            else if (name === "country_code" || name === "gender"){
                textDisplay.textContent = currentInput.options[currentInput.selectedIndex].text.split(" ")[0];
                textDisplay.dataset.value = value;
            }
            else if (name === "college_id") {
                textDisplay.textContent = currentInput.value;
                textDisplay.dataset.value = currentInput.value;
            }
            else if (name === "dob") {
                const [yyyy, mm, dd] = value.split("-");
                textDisplay.textContent = `${dd}/${mm}/${yyyy}`;
                textDisplay.dataset.value = value;
            }
            else {
                textDisplay.textContent = value;
                textDisplay.dataset.value = value;
            }

        } catch (error) {
            if (error.response?.data?.msg)
                showMsg(error.response.data.msg, ERROR);
            else console.error(error);
        }

    }
});
