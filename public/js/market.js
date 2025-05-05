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
    sidebar.classList.toggle("-translate-x-full");
}


document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") {
        document.getElementById("sidebar").classList.add("translate-x-full");
        document.getElementById("filterSidebar").classList.add("-translate-x-full");
        document.getElementById("filterSidebar").classList.remove("translate-x-0");
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

document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") {
        document.getElementById("sidebar").classList.add("translate-x-full");
    }
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
    itemCategoryDOM.appendChild(option);
});
