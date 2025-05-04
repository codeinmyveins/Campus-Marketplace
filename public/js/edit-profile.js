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

const showMsg = getShowMsg(document.getElementById("infoErrorMsg"));

const popup = document.getElementById('editPopup');
const label = document.getElementById('popupLabel');
const inputContainer = document.getElementById('popupInput');

let currentInputDiv = null;
let currentInput = null;
let originalContainer = null;

document.querySelectorAll('.edit-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        if (currentInputDiv && originalContainer) {
            document.getElementById('popupCancel').click();
            return;
        }
        const field = btn.closest('.field');
        const labelText = field.querySelector('p.text-sm').textContent;
        const inputDiv = field.querySelector('.input-div');
        currentInput = inputDiv.querySelector(".input-el");
        // const valueDisplay = field.querySelector('.field-value');

        // Move input to popup
        originalContainer = inputDiv.parentElement;
        currentInputDiv = inputDiv;
        inputDiv.classList.remove('hidden');
        inputContainer.appendChild(inputDiv);
        // input.value = valueDisplay.innerText;

        // Set popup label and input value
        label.textContent = labelText;

        // Position and show popup
        // const rect = field.getBoundingClientRect();
        // popup.style.top = `${window.scrollY + rect.bottom + 8}px`;
        // popup.style.left = `${rect.left}px`;
        // popup.style.width = `${rect.width}px`;

        popup.classList.remove('hidden');
        setTimeout(() => {
            popup.classList.add('opacity-100', 'scale-100');
            popup.classList.remove('opacity-0', 'scale-95');
        });
    });
});

document.getElementById('popupCancel').addEventListener('click', () => {
    if (currentInputDiv && originalContainer) {
        originalContainer.appendChild(currentInputDiv);
        // currentInputDiv.appendChild(currentInput);
        currentInputDiv.classList.add('hidden');
        currentInput = null;
        currentInputDiv = null;
        originalContainer = null;
    }
    popup.classList.remove('opacity-100', 'scale-100');
    popup.classList.add('opacity-0', 'scale-95');
    setTimeout(() => popup.classList.add('hidden'), 150);
});

document.getElementById('popupSave').addEventListener('click', () => {
    if (currentInputDiv && originalContainer) {
        const value = currentInput?.value || getSelectedCollegeId();
        originalContainer.querySelector('.field-value').textContent = value;
        // originalContainer.appendChild(currentInputDiv);
        // currentInputDiv.appendChild(currentInput);
        // currentInputDiv.classList.add('hidden');
        // currentInput = null;
        // currentInputDiv = null;
        // originalContainer = null;
    }

    document.getElementById('popupCancel').click();
});

// Close when clicking outside
document.addEventListener('click', (e) => {
    if (!popup.contains(e.target) && !e.target.closest('.edit-btn')) {
        document.getElementById('popupCancel').click();
    }
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

    } catch (error) {
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

const countryCodeDOM = document.getElementById("country");
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
