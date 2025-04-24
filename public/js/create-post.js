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

let selectedImages = [];
let zoomScale = 0.5;

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

function showStep1() {
    document.getElementById("step2").classList.add("hidden");
    document.getElementById("step1").classList.remove("hidden");
}

function showStep2() {
    document.getElementById("step1").classList.add("hidden");
    document.getElementById("step2").classList.remove("hidden");
}

function handleImageSelection(event) {
    const files = Array.from(event.target.files);
    const maxFiles = 5;

    if (files.length + selectedImages.length > maxFiles) {
        alert("You can only upload a maximum of 5 images.");
        return;
    }

    files.forEach(file => {
        const reader = new FileReader();
        reader.onload = e => {
            selectedImages.push({
            file,
            url: e.target.result,
            isCover: selectedImages.length === 0
            });
            renderImagePreviews();
        };
        reader.readAsDataURL(file);
    });

    event.target.value = ''; // Reset file input
}

function renderImagePreviews() {
    const container = document.getElementById("previewContainer");
    container.innerHTML = "";

    selectedImages.forEach((img, index) => {
    const wrapper = document.createElement("div");
    wrapper.className = "relative w-48 h-48 border rounded overflow-hidden";
    wrapper.draggable = true;
    wrapper.ondragstart = e => e.dataTransfer.setData("index", index);
    wrapper.ondrop = e => {
        const fromIndex = e.dataTransfer.getData("index");
        const toIndex = index;
        const moved = selectedImages.splice(fromIndex, 1)[0];
        selectedImages.splice(toIndex, 0, moved);
        renderImagePreviews();
    };
    wrapper.ondragover = e => e.preventDefault();

    wrapper.innerHTML = `
        <img src="${img.url}" class="w-full h-full object-cover cursor-pointer transition-transform transform hover:scale-105" onclick="showFullScreenImage('${img.url}')" />
        <button type="button" 
        class="absolute bottom-1 left-1 text-xs bg-white/80 px-1 rounded cursor-pointer hover:border-1 hover:border-(--color3)"
        onclick="event.stopPropagation(); setAsCover(${index})">
        ${img.isCover ? 'Cover ✔' : 'Set as Cover'}
        </button>
        <button type="button"
        class="absolute top-1 right-1 text-xs bg-red-500 text-white px-1 rounded-full w-5 h-5 flex justify-center cursor-pointer hover:bg-red-700"
        onclick="removeImage(${index})">✕</button>
    `;

    container.appendChild(wrapper);
    });

    updateCoverImageIndex();
}

function setAsCover(index) {
    selectedImages.forEach(img => img.isCover = false);
    const coverImage = selectedImages.splice(index, 1)[0];
    coverImage.isCover = true;
    selectedImages.unshift(coverImage);
    renderImagePreviews();
}

function removeImage(index) {
    selectedImages.splice(index, 1);
    if (!selectedImages.some(img => img.isCover) && selectedImages[0]) {
        selectedImages[0].isCover = true;
    }
    renderImagePreviews();
}

function updateCoverImageIndex() {
    const coverIndex = selectedImages.findIndex(img => img.isCover);
    document.getElementById("coverImageIndex").value = coverIndex;
}

function showFullScreenImage(url) {
    const modal = document.getElementById("imageModal");
    const modalImage = document.getElementById("modalImage");
    zoomScale = 0.5;
    modalImage.src = url;
    modalImage.style.transform = `scale(${zoomScale})`;
    modal.classList.remove("hidden");
    modalImage.addEventListener("wheel", handleZoom);
}

function closeImageModal() {
    const modal = document.getElementById("imageModal");
    const modalImage = document.getElementById("modalImage");
    modal.classList.add("hidden");
    modalImage.removeEventListener("wheel", handleZoom);
}

function handleZoom(event) {
    event.preventDefault();
    zoomScale += event.deltaY * -0.001;
    zoomScale = Math.min(Math.max(zoomScale, 0.2), 5);
    const modalImage = document.getElementById("modalImage");
    modalImage.style.transform = `scale(${zoomScale})`;
}

function handleCapturedImage(dataUrl) {
    const maxFiles = 5;
    if (selectedImages.length >= maxFiles) {
        alert("You can only upload a maximum of 5 images.");
        return;
    }

    selectedImages.push({
        file: null,
        url: dataUrl,
        isCover: selectedImages.length === 0
    });

    renderImagePreviews();
}
function previewCapturedImage(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function (e) {
            const dataUrl = e.target.result;
            handleCapturedImage(dataUrl); // Use your existing handleCapturedImage function
        };
        reader.readAsDataURL(file);
    }
}

const itemCategoryDOM = document.querySelector("#item_category");
const categories = ["Accessories & Jewelry", "Appliances", "Art & Design Supplies", "Athletic Wear", "Audio & Headphones", "Bags & Backpacks", "Bathroom Essentials", "Bedding & Linens", "Bicycles & Accessories", "Bikes & Scooters", "Board & Card Games", "Books & Novels", "Calculators & Tools", "Cameras & Photography", "Cleaning Equipment", "Computer Accessories", "Cookware & Utensils", "Crafting & Building Materials", "Educational Subscriptions & Services", "Event Tickets", "Footwear", "Free Stuff", "Furniture", "Games & Consoles", "Gifts & Novelty Items", "Gym Equipment", "Hair & Grooming Tools", "Health & Wellness Gear", "Home Utilities", "Lab Equipment", "Laptops & Computers", "Lighting & Decor", "Lost & Found", "Makeup & Skincare Tools", "Men's Clothing", "Mobile Phones & Tablets", "Musical Instruments", "Outdoor Sports Gear", "Pet Supplies", "Public Transit Passes & Services", "Repair & Maintenance Supplies", "Reusable Bottles & Lunchboxes", "Seasonal Wear", "Services & Rentals", "Small Kitchen Appliances", "Smart Devices & Wearables", "Stationery & Office Supplies", "Storage & Organization", "Storage Containers", "Storage Devices & Cables", "Streaming & Digital Access", "Subscription Accounts", "Tableware", "Textbooks & Study Material", "Toolkits & Hardware", "Travel Bags & Luggage", "Unisex Clothing", "Vehicle Accessories", "Women's Clothing", "Yoga & Stretching Gear"];

itemCategoryDOM.innerHTML = '<option>Select A category</option>';
categories.forEach(c => {
    const option = document.createElement("option");
    option.innerText = c;
    option.value = c;
    itemCategoryDOM.appendChild(option);
});
