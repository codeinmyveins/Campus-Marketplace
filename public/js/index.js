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

// scroll animation for the hero section
const observer = new IntersectionObserver(
    (entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                entry.target.classList.remove("opacity-0", "translate-y-10");
                entry.target.classList.add("opacity-100", "translate-y-0");
                observer.unobserve(entry.target); // optional: animate once
            }
        });
    },
    {
        threshold: 0.7, // trigger when 20% is visible
    }
);

observer.observe(document.getElementById("left-content"));
observer.observe(document.getElementById("right-image"));

// scroll animation for about section
const observer2 = new IntersectionObserver(
    (entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                entry.target.classList.remove("opacity-0", "translate-y-10");
                entry.target.classList.add("opacity-100", "translate-y-0");
                observer2.unobserve(entry.target); // animate only once
            }
        });
    },
    {
        threshold: 0.7,
    }
);
// scroll animation for the fade animation elements in all sections
observer2.observe(document.getElementById("left-content")); // Hero Left
observer2.observe(document.getElementById("right-image"));   // Hero Right
observer2.observe(document.getElementById("about-img"));     // About Image
observer2.observe(document.getElementById("about-text"));    // About Text

const fadeElements = document.querySelectorAll(".scroll-fade");

const showOnScroll = () => {
    fadeElements.forEach((el) => {
        const rect = el.getBoundingClientRect();
        if (rect.top <= window.innerHeight - 100) {
            el.classList.add("visible");
        }
    });
};

window.addEventListener("scroll", showOnScroll);
window.addEventListener("load", showOnScroll);

// CTA animation

const animatedItems = document.querySelectorAll(".join-animate");

function animateOnScroll() {
    animatedItems.forEach((el) => {
        const rect = el.getBoundingClientRect();
        if (rect.top <= window.innerHeight - 100) {
            el.classList.add("visible");
        }
    });
}

window.addEventListener("scroll", animateOnScroll);
window.addEventListener("load", animateOnScroll);

const searchForm = document.getElementById("searchForm");
searchForm.addEventListener("submit", (e) => {
    e.preventDefault();
    window.location.href = `./market.html?search=${searchForm.search.value.trim()}`;
});
