function toggleSidebar() {
    const sidebar = document.getElementById("sidebar");
    sidebar.classList.toggle("translate-x-full");
}

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
    }
});

async function getUserDropdown() {

    try {

        const { data: { user } } = await apiAuth.get("/api/users", { skipRedirectOn401: true });

        document.getElementById("login-signup").hidden = true;
        document.getElementById("user-dropdown").hidden = false;

        document.getElementById("user-dropdown-full_name").textContent = user.full_name;
        document.getElementById("user-dropdown-username").textContent = user.username;

        if (user.avatar_url) {
            document.getElementById("user-dropdown-avatar1").src = user.avatar_url;
            document.getElementById("user-dropdown-avatar2").src = user.avatar_url;
        }

    } catch (error) {
        console.error(error);
        document.getElementById("user-dropdown").hidden = true;
    }

}

getUserDropdown();


async function confirmLogout() {
    if (!confirm("Are you sure you want to logout?")) return;

    try {
        await apiAuth.delete("/api/auth/logout");
        window.location.href = "index.html";
    } catch (error) {
        console.error(error);
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

const collegeInput = document.getElementById("college_name");
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
            // showMsg("No colleges matched", INFO);
            return;
        }

        dropdown.innerHTML = colleges.map(college => `
        <li class="cursor-pointer px-4 py-2 hover:bg-(--color2) hover:text-(--color3)" data-id="${college.id}">
          ${college.name}
        </li>
      `).join("");

        dropdown.classList.remove("hidden");

    } catch (error) {
        console.error(error);
        // showMsg("Server is Down", ERROR);
    }

});

dropdown.addEventListener("click", e => {
    const li = e.target.closest("li");
    if (!li) return;
    collegeInput.value = li.textContent.trim();
    updateURLFromFilters();
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


// filters
const inputMap = {
    search: document.getElementById("search"),
    item_category: document.getElementById("item_category"),
    price_min: document.getElementById("price_min"),
    price_max: document.getElementById("price_max"),
    college_name: document.getElementById("college_name"),
    sort: document.getElementById("sort"),
};

const checkboxGroupName = "type";

// --- A. Set Inputs From URL ---
function applyFiltersFromURL() {
    const params = new URLSearchParams(window.location.search);

    for (const [key, input] of Object.entries(inputMap)) {
        const val = params.get(key);
        if (val !== null) input.value = val;
    }

    const types = (params.get(checkboxGroupName) || "").split(",").filter(Boolean);
    document.querySelectorAll(`input[name="${checkboxGroupName}"]`).forEach(cb => {
        cb.checked = types.includes(cb.value);
    });

    fetchItems();
}

// --- B. Update URL From Inputs ---
function updateURLFromFilters() {
    const params = new URLSearchParams();

    for (const [key, input] of Object.entries(inputMap)) {
        if (input.value) params.set(key, input.value);
    }

    const selectedTypes = [...document.querySelectorAll(`input[name="${checkboxGroupName}"]:checked`)]
        .map(cb => cb.value);
    if (selectedTypes.length) {
        params.set(checkboxGroupName, selectedTypes.join(","));
    }

    const newUrl = `${window.location.pathname}?${params.toString()}`;
    history.replaceState(null, "", newUrl); // Update URL without reloading
    fetchItems();
}

document.getElementById("searchForm").addEventListener("submit", (e) => {
    e.preventDefault();
    updateURLFromFilters();
});

// --- C. Hook Input Changes ---
function attachFilterListeners() {
    for (const input of Object.values(inputMap)) {
        if (input.id === "college_name" || input.id === "search") continue;
        input.addEventListener("change", updateURLFromFilters);
    }

    document.querySelectorAll(`input[name="${checkboxGroupName}"]`).forEach(cb => {
        cb.addEventListener("change", updateURLFromFilters);
    });
}


// --- D. Sync on load ---
applyFiltersFromURL();
attachFilterListeners();

function clearFilters(filtersOnly = false) {
    // Clear input values
    for (const input of Object.values(inputMap)) {
        if (filtersOnly && input.id === "search") continue;
        input.value = "";
    }

    // Uncheck all checkboxes in the type group
    document.querySelectorAll(`input[name="${checkboxGroupName}"]`).forEach(cb => {
        cb.checked = false;
    });

    updateURLFromFilters();
    // // Remove query params from the URL
    // const baseUrl = window.location.pathname;
    // history.replaceState(null, "", baseUrl);
}

const itemList = document.getElementById("product-list");
const defaultCard = document.getElementById("defaultCard");

async function fetchItems() {

    // itemList.innerHTML = "Loading...";
    try {

        const { data: { itemCount, items } } = await axios.get(`/api/items/${window.location.search}`);

        itemList.innerHTML = "";
        items.forEach(item => {

            const card = defaultCard.cloneNode(true);
            card.dataset.id = item.id;
            card.querySelector("#card-title").textContent = item.title;
            card.querySelector("#card-item_name").textContent = item.item_name;
            card.querySelector("#card-item_category").textContent = item.item_category;
            card.querySelector("#card-type").textContent = item.type;
            card.querySelector("#card-price").textContent = item.price ? `₹ ${item.price}` : "Free";
            card.querySelector("#card-created_at").textContent = formatTimestamp(item.created_at);
            if (item.cover_img) {
                const coverImg = card.querySelector("#card-cover");
                coverImg.src = item.cover_img.url;
                coverImg.alt = item.cover_img.name;
            }
            card.querySelector("#view-btn").href = `/item/${item.id}`;

            card.hidden = false;
            itemList.appendChild(card);

        });

    } catch (error) {
        console.error(error);
    }

}
