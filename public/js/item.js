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

        const { data: { user } } = await apiAuth.get("/api/users", { skipRedirectOn401: true });

        document.getElementById("login-signup-desktop").hidden = true;
        document.getElementById("login-signup-mobile").hidden = true;
        document.getElementById("user-dropdown").hidden = false;

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

const pathParts = window.location.pathname.split('/');
const itemId = pathParts[pathParts.length - 1];

let userId;
let originalItem;
let itemUser;
let currentImageIdx = 0;
const coverImage = document.querySelector("#cover-section img");

function setCoverImg() {
    coverImage.src = originalItem.images[currentImageIdx].url;
    coverImage.alt = originalItem.images[currentImageIdx].alt;
}

async function fillDetails() {

    try {

        const { data } = await axios.get("/api/items/" + itemId);
        // console.log(data.item);
        const item = data.item;
        userId = item.user_id
        originalItem = item;

        document.getElementById("title").textContent = item.title;
        document.getElementById("item_name").textContent = item.item_name;
        document.getElementById("item_category").textContent = item.item_category;
        document.getElementById("type").textContent = item.type;
        document.getElementById("price").textContent = item.price ? `₹ ${item.price}` : "Free";
        document.getElementById("created_at").textContent = formatTimestamp(item.created_at);
        document.getElementById("description").textContent = item.description || "";

        for (let i = 0; i < item.images.length; i++) {
            const imageContainer = document.getElementById("img" + (i + 1).toString());
            const image = imageContainer.querySelector("img");
            image.src = item.images[i].url;
            image.alt = item.images[i].name;
            imageContainer.hidden = false;
            imageContainer.addEventListener("click", (e) => {
                currentImageIdx = i;
                setCoverImg();
            });
        }
        if (item.images.length > 0) {
            coverImage.src = item.images[0].url;
            coverImage.alt = item.images[0].name;
        }

        document.querySelector("#next-img").onclick = (e) => {
            e.preventDefault();
            currentImageIdx = (currentImageIdx + 1) % originalItem.images.length;
            setCoverImg();
        }
        document.querySelector("#prev-img").onclick = (e) => {
            e.preventDefault();
            currentImageIdx = (((currentImageIdx - 1) % originalItem.images.length) + originalItem.images.length) % originalItem.images.length;
            setCoverImg();
        }

        const { data: { user } } = await axios.get(`/api/users/${item.user_id}?id=true`);

        itemUser = user;
        document.getElementById("full_name").textContent = user.full_name;
        document.getElementById("full_name").href = `/user/${user.username}`
        document.getElementById("username").textContent = "@" + user.username;
        if (user.avatar_url) {
            document.getElementById("avatar").src = user.avatar_url;
        }
        document.getElementById("avatar_a_tag").href = `/user/${user.username}`

    } catch (error) {
        console.error(error);
        alert(`Item with id: ${itemId} not found`);
    }

}

fillDetails();

async function contactSeller() {

    try {
        const { data } = await apiAuth.get(`/api/users/${userId}/contact`);
        const message = `Hello ${itemUser.full_name}, I am contacting about your listing: "${originalItem.title}"`;
        const encodedMessage = encodeURIComponent(message);

        const url = `https://api.whatsapp.com/send?phone=${data.user_phone}&text=${encodedMessage}`;

        window.open(url, '_blank');

    } catch (error) {
        console.error(error);
    }
}
