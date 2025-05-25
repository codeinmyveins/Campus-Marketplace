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
            if (!menu.classList.contains("-translate-y-full")) {
                menu.classList.add("-translate-y-full");
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
        window.location.href = "/";
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
const is_me = !(pathParts.length === 3);
const username = !is_me ? pathParts[pathParts.length - 1] : "";

document.getElementById("edit-btn").hidden = !is_me;


async function getCountryNameFromCode(code) {
    try {
        const response = await axios.get(`https://restcountries.com/v3.1/alpha/${code}`);
        const country = response.data[0];
        return country.name.common;
    } catch (error) {
        console.error('Error fetching country:', error.message);
    }
}

async function fillUserDetails() {
    const pfpDOM = document.getElementById("pfp");
    const fullnameDOM = document.getElementById("fullname");
    const usernameDOM = document.getElementById("username");
    const bioDOM = document.getElementById("bio");
    const countryDOM = document.getElementById("country");
    const collegeDOM = document.getElementById("college");

    try {
        const { data: { user } } = await (is_me ? apiAuth : axios).get("/api/users/" + username);
        if (user.avatar_url)
            pfpDOM.src = user.avatar_url;
        fullnameDOM.textContent = user.full_name;
        countryDOM.textContent = `From ${await getCountryNameFromCode(user.country_code) || user.country_code}`;
        if (user.bio)
            bioDOM.textContent = user.bio;
        collegeDOM.textContent = `Studying at ${user.college_name}`;
        usernameDOM.textContent = user.username;

    } catch (error) {
        console.error(error);
    }

}

fillUserDetails();
