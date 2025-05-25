// Function to toggle the mobile menu
function toggleMenu() {
    const mobileMenu = document.getElementById("mobileMenu")
    mobileMenu.classList.toggle("-translate-y-full");
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

const sidebar = document.getElementById("sidebar");

function toggleSidebar() {
    sidebar.classList.toggle("translate-x-full");
}

document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") {
        sidebar.classList.add("translate-x-full");
    }
});

async function confirmLogout() {
    if (!confirm("Are you sure you want to logout?")) return;

    try {
        await apiAuth.delete("/api/auth/logout");
        window.location.href = "index.html";
    } catch (error) {
        console.error(error);
    }
}

async function getUserDropdown() {

    try {

        const { data: { user } } = await apiAuth.get("/api/users");

        document.getElementById("user-dropdown-full_name").textContent = user.full_name;
        document.getElementById("user-dropdown-username").textContent = user.username;

        // console.log(user);
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

let selectedImages = [];
let zoomScale = 0.5;

const defaultImageDiv = document.querySelector("#imgDiv");

async function handleImageSelection(event) {
    const files = Array.from(event.target.files);
    const maxFiles = 5;

    if (files.length + selectedImages.length > maxFiles) {
        alert("You can only upload a maximum of 5 images.");
        return;
    }

    files.forEach(file => {
        selectedImages.push({
            file,
            url: URL.createObjectURL(file),
            original: false,
            name: file.name,
            isCover: selectedImages.length === 0
        });
    });

    renderImagePreviews(); // Call once after all images are processed

    try {

        showMsgImg("Loading...", INFOD);
        const formData = new FormData();
        files.forEach(file => {
            formData.append("item_images", file);
        });

        const { data } = await apiAuth.post(`/api/items/${itemId}/images`,
            formData,
            {
                headers: {
                    "Content-Type": "multipart/form-data"
                }
            }
        );

        selectedImages.slice(selectedImages.length - files.length - 1).forEach((f, idx) => {
            f.id = data.recentImgIndexes[idx];
        });

        showMsgImg(data.msg, SUCCESS);

    } catch (error) {

        selectedImages.splice(selectedImages.length - files.length, files.length);
        renderImagePreviews();

        if (error.response?.data?.msg)
            showMsgImg(error.response.data.msg, ERROR);
        else console.error(error);
    }

    event.target.value = ''; // Reset file input
}

async function putReorderImage() {

    try {

        showMsgImg("Loading...", INFOD);

        const new_img_order = selectedImages.map(img => img.id);

        const { data } = await apiAuth.put(`/api/items/${itemId}/images/reorder`,
            {
                new_img_order
            }
        );

        showMsgImg(data.msg, SUCCESS);

    } catch (error) {

        if (error.response?.data?.msg)
            showMsgImg(error.response.data.msg, ERROR);
        else console.error(error);
    }

}

const imgHintDOM = document.querySelector("#imgHint");
const noImgDOM = document.querySelector("#noImg");

function renderImagePreviews() {
    const container = document.getElementById("previewContainer");
    container.innerHTML = "";

    if (selectedImages.length === 0) {
        imgHintDOM.classList.add("hidden");
        noImgDOM.classList.remove("hidden");
    } else {
        imgHintDOM.classList.remove("hidden");
        noImgDOM.classList.add("hidden");
    }

    selectedImages.forEach((img, index) => {
        const wrapper = defaultImageDiv.cloneNode(true);

        wrapper.ondragstart = e => e.dataTransfer.setData("index", index);
        wrapper.ondrop = e => {
            const fromIndex = e.dataTransfer.getData("index");
            const toIndex = index;
            const moved = selectedImages.splice(fromIndex, 1)[0];
            selectedImages.splice(toIndex, 0, moved);
            selectedImages.forEach((ii, idx) => ii.isCover = idx === 0);
            putReorderImage();
            renderImagePreviews();
        };
        wrapper.ondragover = e => e.preventDefault();

        const imgDOM = wrapper.querySelector("img");
        imgDOM.src = img.url;
        imgDOM.alt = img.name;
        imgDOM.onclick = (e) => { showFullScreenImage(img.url) };
        const coverBtn = wrapper.querySelector("#coverBtn");
        coverBtn.onclick = (e) => { e.stopPropagation(); setAsCover(index) };
        coverBtn.innerText = img.isCover ? "Cover ✔" : "Set as Cover";
        wrapper.querySelector("#delBtn").onclick = (e) => { removeImage(index) };
        const upBtn = wrapper.querySelector("#upBtn");
        const downBtn = wrapper.querySelector("#downBtn");
        upBtn.addEventListener("click", (e) => {
            e.preventDefault();
            swap(selectedImages, index, index - 1);
            selectedImages.forEach((img, i) => img.isCover = i === 0);
            renderImagePreviews();
            putReorderImage();
        });
        downBtn.addEventListener("click", (e) => {
            e.preventDefault();
            swap(selectedImages, index, index + 1);
            selectedImages.forEach((img, i) => img.isCover = i === 0);
            renderImagePreviews();
            putReorderImage();
        });
        if (index === 0)
            upBtn.disabled = true;
        if (index === selectedImages.length - 1)
            downBtn.disabled = true;

        wrapper.classList.remove("hidden");
        container.appendChild(wrapper);
    });
}

function swap(array, index1, index2) {
    const temp = array[index1];
    array[index1] = array[index2];
    array[index2] = temp;
}

function setAsCover(index) {
    selectedImages.forEach(img => img.isCover = false);
    const coverImage = selectedImages.splice(index, 1)[0];
    coverImage.isCover = true;
    selectedImages.unshift(coverImage);
    putReorderImage();
    renderImagePreviews();
}

async function removeImage(index) {
    removed_img = selectedImages[index];
    selectedImages.splice(index, 1);
    if (!selectedImages.some(img => img.isCover) && selectedImages[0]) {
        selectedImages[0].isCover = true;
    }
    renderImagePreviews();

    showMsgImg("Loading...", INFOD);

    try {
        const { data } = await apiAuth.delete(`/api/items/${itemId}/images/${removed_img.id}`);

        showMsgImg(data.msg, SUCCESS);

    } catch (error) {
        if (error.response?.data?.msg)
            showMsgImg(error.response.data.msg, ERROR);
        else console.error(error);
    }
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

const toggle = document.getElementById('statusToggle');
const text = document.getElementById('statusText');

function updateStatusText() {
    if (toggle.checked) {
        text.textContent = 'Open';
        text.classList.remove('text-red-600');
        text.classList.add('text-teal-600');
    } else {
        text.textContent = 'Closed';
        text.classList.remove('text-teal-600');
        text.classList.add('text-red-600');
    }
}

// Listen for toggle
toggle.addEventListener('change', updateStatusText);
// Initialize on load
updateStatusText();

async function confirmDelete() {
    if (!confirm("Are you sure you want to delete this item?")) {
        return;
    }

    showMsg("Loading...", INFOD);

    try {
        const { data } = await apiAuth.delete(`/api/items/${itemId}`);

        window.location.search = "./dashboard.html";

        showMsg(data.msg, SUCCESS);

    } catch (error) {
        if (error.response?.data?.msg)
            showMsg(error.response.data.msg, ERROR);
        else console.error(error);
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

const pathParts = window.location.pathname.split('/');
const itemId = pathParts[pathParts.length - 1];

const updateItemBtn = document.querySelector("#updateItemBtn");
let changedCount = 0;
let originalItem;

function checkChange(el) {
    const dot = document.querySelector(`#${el.name}Field`).querySelector("#changeDot");
    const was_hidden = dot.hidden;
    const currentValue = el.type === "checkbox" ? !el.checked : el.value;
    const isSame = currentValue == originalItem[el.name];
    dot.hidden = isSame;
    el.dataset.changed = !isSame;
    if (was_hidden && !dot.hidden)
        changedCount++;
    else if (!was_hidden && dot.hidden)
        changedCount--;
    updateItemBtn.disabled = changedCount === 0;
}

const form = document.querySelector("#editForm");

async function fillPostDetails() {

    try {
        const { data: { item } } = await axios.get(`/api/items/${itemId}`);
        item.price = Number(item.price);
        originalItem = item;
        form.item_name.value = item.item_name;
        form.item_category.value = item.item_category;
        form.title.value = item.title;
        form.description.value = item.description;
        form.price.value = item.price || 0;
        document.querySelector("#type").innerText = item.type;
        form.closed.checked = !item.closed;
        updateStatusText();

        if (item.type !== "sell" && item.type !== "lend")
            document.querySelector("#priceField").classList.add("hidden");

        selectedImages = [];
        item.images.forEach(file => {
            selectedImages.push({
                url: file.url,
                id: file.id,
                name: file.name,
                original: true,
                isCover: selectedImages.length === 0
            });
        });

        renderImagePreviews();

    } catch (error) {
        console.error(error);
        alert(`Item with ID: ${itemId} not Found`);
    }

}

const showMsg = getShowMsg(form.querySelector("#mainInfoErrorMsg #infoErrorMsg"));

form.addEventListener("submit", async (e) => {
    e.preventDefault();

    showMsg("Loading...", INFOD);

    const item_name = form.item_name.dataset?.changed ? form.item_name.value : undefined;
    const item_category = form.item_category.dataset?.changed ? form.item_category.value : undefined;
    const title = form.title.dataset?.changed ? form.title.value : undefined;
    const description = form.description.dataset?.changed ? form.description.value : undefined;
    const price = form.price.dataset?.changed ? form.price.value : undefined;
    const closed = form.closed.dataset?.changed ? !form.closed.checked : undefined;

    const body = {
        item_name,
        item_category,
        title,
        description,
        price,
        closed
    };

    try {
        const { data } = await apiAuth.patch(`/api/items/${itemId}`, body);

        data.patched.forEach(k => {
            originalItem[k] = body[k];
            checkChange(form[k]);
        });

        showMsg(data.msg, SUCCESS);
    } catch (error) {
        if (error.response?.data?.msg)
            showMsg(error.response.data.msg, ERROR);
        else console.error(error);
    }

});

fillPostDetails();

const showMsgImg = getShowMsg(document.querySelector("#imgSection #infoErrorMsg"));

window.onbeforeunload = function (event) {
    if (changedCount === 0) return;

    event.preventDefault();
    event.returnValue = "";
    event.returnValue = "Are you sure you want to leave this page? Any unsaved changes may be lost.";
    return "Are you sure you want to leave this page? Any unsaved changes may be lost.";
}
