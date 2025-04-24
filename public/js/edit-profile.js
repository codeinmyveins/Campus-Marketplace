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

const editButtons = document.querySelectorAll(".editable-btn");

editButtons.forEach((button) => {
    button.addEventListener("click", () => {
        const container = button.parentElement;
        const valuePara = container.querySelector("p.font-medium");

        // Already in edit mode
        if (button.getAttribute("data-editing") === "true") {
            const input = container.querySelector("input");
            valuePara.textContent = input.value || "[Hidden]";
            input.remove();
            valuePara.classList.remove("hidden");
            button.innerHTML = getEditIcon();
            button.setAttribute("data-editing", "false");
        } else {
            const input = document.createElement("input");
            input.type = "text";
            input.className = "border p-1 text-sm rounded";
            input.value = valuePara.textContent === "[Hidden]" ? "" : valuePara.textContent;
            valuePara.classList.add("hidden");
            valuePara.insertAdjacentElement("afterend", input);
            button.innerHTML = getSaveIcon();
            button.setAttribute("data-editing", "true");
        }
    });
});

function getEditIcon() {
    return `
<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24"
    stroke="currentColor" stroke-width="2">
<path stroke-linecap="round" stroke-linejoin="round"
        d="M15.232 5.232l3.536 3.536M9 11l6 6M3 21h6l11-11a2.828 2.828 0 00-4-4L5 17v4z" />
</svg>`;
}

function getSaveIcon() {
    return `
<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-green-600" fill="none"
    viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
<path stroke-linecap="round" stroke-linejoin="round"
        d="M5 13l4 4L19 7" />
</svg>`;
}

// Get elements
// Get elements
const editPfpBtn = document.getElementById('editPfpBtn');
const profileImage = document.getElementById('profileImage');
const pfpInput = document.getElementById('pfpInput');

// Flag to track if image is selected
let isImageSelected = false;

// Toggle edit and save functionality
editPfpBtn.addEventListener('click', () => {
    if (!isImageSelected) {
        // Show file input to choose a new profile picture
        pfpInput.click();
    } else {
        // If image is selected, simulate save action (or actually save if you integrate server-side logic)
        // Reset to Edit button after saving
        editPfpBtn.innerHTML = `
<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24"
   stroke="currentColor" stroke-width="2">
<path stroke-linecap="round" stroke-linejoin="round"
      d="M5 13l4 4L19 7" />
</svg>
`;
        editPfpBtn.classList.add('text-(--color3) ');
        editPfpBtn.classList.remove('text-green-600');
        editPfpBtn.innerText = 'Edit';
        isImageSelected = false; // Reset the flag after saving
    }
});

// Handle file selection
pfpInput.addEventListener('change', (event) => {
    const file = event.target.files[0];
    if (file) {
        // Create a new image URL from the selected file
        const reader = new FileReader();
        reader.onload = () => {
            profileImage.src = reader.result; // Update profile picture
            // Set the image selected flag to true
            isImageSelected = true;

            // Change "Edit" button to "Tick" (for saving)
            editPfpBtn.innerHTML = `
<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24"
     stroke="currentColor" stroke-width="2">
  <path stroke-linecap="round" stroke-linejoin="round"
        d="M5 13l4 4L19 7" />
</svg>
`;
            editPfpBtn.classList.add('text-green-600'); // Change color to indicate save
            editPfpBtn.classList.remove('text-blue-600');
            editPfpBtn.innerText = 'Save';
        };
        reader.readAsDataURL(file);
    }
});

const editButton = document.getElementById('editButton');
const birthdayDisplay = document.getElementById('birthdayDisplay');
const birthdayInput = document.getElementById('birthdayInput');

// Toggle between view and edit mode
editButton.addEventListener('click', () => {
    if (birthdayInput.classList.contains('hidden')) {
        // Switch to edit mode
        birthdayDisplay.classList.add('hidden');
        birthdayInput.classList.remove('hidden');
        birthdayInput.focus();

        // Change button to tick
        editButton.innerHTML = `
<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24"
     stroke="currentColor" stroke-width="2">
  <path stroke-linecap="round" stroke-linejoin="round"
        d="M5 13l4 4L19 7" />
</svg>
`;
    } else {
        // Switch back to view mode
        birthdayDisplay.classList.remove('hidden');
        birthdayInput.classList.add('hidden');
        birthdayDisplay.textContent = birthdayInput.value; // Update display text with selected value

        // Change button back to edit
        editButton.innerHTML = `
<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24"
     stroke="currentColor" stroke-width="2">
  <path stroke-linecap="round" stroke-linejoin="round"
        d="M15.232 5.232l3.536 3.536M9 11l6 6M3 21h6l11-11a2.828 2.828 0 00-4-4L5 17v4z" />
</svg>
`;
    }
});