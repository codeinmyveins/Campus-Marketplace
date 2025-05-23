// Function to toggle the mobile menu
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

function checkType() {
    const selected = document.querySelector('input[name="type"]:checked')?.value;
    const priceField = document.getElementById("priceField");

    if (selected === "lend" || selected === "sell") {
        priceField.classList.remove("hidden");
        priceField.required = true;
    } else {
        priceField.classList.add("hidden");
        priceField.required = false;
        priceField.value = "";
    }
}

const itemCategoryDOM = document.querySelector("#item_category");
const categories = ["Accessories & Jewelry", "Appliances", "Art & Design Supplies", "Athletic Wear", "Audio & Headphones", "Bags & Backpacks", "Bathroom Essentials", "Bedding & Linens", "Bicycles & Accessories", "Bikes & Scooters", "Board & Card Games", "Books & Novels", "Calculators & Tools", "Cameras & Photography", "Cars", "Cleaning Equipment", "Computer Accessories", "Cookware & Utensils", "Crafting & Building Materials", "Educational Subscriptions & Services", "Event Tickets", "Footwear", "Free Stuff", "Furniture", "Games & Consoles", "Gifts & Novelty Items", "Gym Equipment", "Hair & Grooming Tools", "Health & Wellness Gear", "Home Utilities", "Lab Equipment", "Laptops & Computers", "Lighting & Decor", "Lost & Found", "Makeup & Skincare Tools", "Men's Clothing", "Mobile Phones & Tablets", "Musical Instruments", "Outdoor Sports Gear", "Pet Supplies", "Public Transit Passes & Services", "Repair & Maintenance Supplies", "Reusable Bottles & Lunchboxes", "Seasonal Wear", "Services & Rentals", "Small Kitchen Appliances", "Smart Devices & Wearables", "Stationery & Office Supplies", "Storage & Organization", "Storage Containers", "Storage Devices & Cables", "Streaming & Digital Access", "Subscription Accounts", "Tableware", "Textbooks & Study Material", "Toolkits & Hardware", "Travel Bags & Luggage", "Unisex Clothing", "Vehicle Accessories", "Women's Clothing", "Yoga & Stretching Gear"];

itemCategoryDOM.innerHTML = '<option>Select A category</option>';
categories.forEach(c => {
    const option = document.createElement("option");
    option.innerText = c;
    option.value = c;
    itemCategoryDOM.appendChild(option);
});

const showMsg = getShowMsg(document.getElementById("infoErrorMsg"));

const form = document.getElementById("createPostForm");
form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const item_name = form.item_name.value.trim();
    const item_category = form.item_category.value.trim();
    const title = form.title.value.trim();
    const description = form.description.value.trim();
    const type = form.type.value.trim();
    const price = form.price.value.trim() || null;

    showMsg("Loading...", INFOD);

    try {
        
        const { data } = await apiAuth.post("/api/items", {
            item_name, item_category, title,
            description, type, price
        });

        showMsg(data.msg, SUCCESS);
        setTimeout(() => {
            window.location.href = `edit-item/${data.item.id}`
        }, 1000);

    } catch (error) {
        if (error.response?.data?.msg)
            showMsg(error.response.data.msg, ERROR);
        else console.error(error);
    }

});
