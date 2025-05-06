function toggleSidebar() {
    const sidebar = document.getElementById("sidebar");
    sidebar.classList.toggle("translate-x-full");
}

// function toggleFilterSidebar() {
// const sidebar = document.getElementById("filterSidebar");
// sidebar.classList.toggle("translate-x-0");
// sidebar.classList.toggle("-translate-x-full");
// }

function toggleFilterSidebar() {
    const sidebar = document.getElementById("filterSidebar");

    if (sidebar.classList.contains("hidden")) {
        sidebar.classList.remove("-translate-x-full");
        // sidebar.style.display = "block"
        sidebar.classList.remove("md:block");
        sidebar.classList.remove("hidden");
    } else {
        sidebar.classList.add("-translate-x-full");
        // sidebar.style.display = ""
        sidebar.classList.add("hidden");
        sidebar.classList.add("md:block");
    }
}


document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") {
        document.getElementById("sidebar").classList.add("translate-x-full");
        // document.getElementById("filterSidebar").classList.add("-translate-x-full");
        // document.getElementById("filterSidebar").classList.remove("translate-x-0");
    }
});


function confirmLogout() {
    if (confirm("Are you sure you want to logout?")) {
        window.location.href = "index.html";
    }
}

document.querySelectorAll(".sidebar-link").forEach((link) => {
    link.addEventListener("click", function () {
        document.getElementById("sidebar").classList.add("translate-x-full");
    });
});

// document.getElementById("price").addEventListener("input", function () {
//     document.getElementById("price-value").textContent = this.value;
// });


const itemCategoryDOM = document.querySelector("#item_category");
const categories = ["Accessories & Jewelry", "Appliances", "Art & Design Supplies", "Athletic Wear", "Audio & Headphones", "Bags & Backpacks", "Bathroom Essentials", "Bedding & Linens", "Bicycles & Accessories", "Bikes & Scooters", "Board & Card Games", "Books & Novels", "Calculators & Tools", "Cameras & Photography", "Cars", "Cleaning Equipment", "Computer Accessories", "Cookware & Utensils", "Crafting & Building Materials", "Educational Subscriptions & Services", "Event Tickets", "Footwear", "Free Stuff", "Furniture", "Games & Consoles", "Gifts & Novelty Items", "Gym Equipment", "Hair & Grooming Tools", "Health & Wellness Gear", "Home Utilities", "Lab Equipment", "Laptops & Computers", "Lighting & Decor", "Lost & Found", "Makeup & Skincare Tools", "Men's Clothing", "Mobile Phones & Tablets", "Musical Instruments", "Outdoor Sports Gear", "Pet Supplies", "Public Transit Passes & Services", "Repair & Maintenance Supplies", "Reusable Bottles & Lunchboxes", "Seasonal Wear", "Services & Rentals", "Small Kitchen Appliances", "Smart Devices & Wearables", "Stationery & Office Supplies", "Storage & Organization", "Storage Containers", "Storage Devices & Cables", "Streaming & Digital Access", "Subscription Accounts", "Tableware", "Textbooks & Study Material", "Toolkits & Hardware", "Travel Bags & Luggage", "Unisex Clothing", "Vehicle Accessories", "Women's Clothing", "Yoga & Stretching Gear"];

itemCategoryDOM.innerHTML = '<option value="">Select A category</option>';
categories.forEach(c => {
    const option = document.createElement("option");
    option.innerText = c;
    option.value = c;
    option.className = "bg-(--color6)";
    itemCategoryDOM.appendChild(option);
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
            // showMsg("No colleges matched", INFO);
            return;
        }

        dropdown.innerHTML = colleges.map(college => `
        <li class="cursor-pointer px-4 py-2 hover:bg-(--color2) hover:text-(--color3)" data-id="${college.id}">
          ${college.name}
        </li>
      `).join('');

        dropdown.classList.remove('hidden');

    } catch (error) {
        console.error(error);
        // showMsg("Server is Down", ERROR);
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

