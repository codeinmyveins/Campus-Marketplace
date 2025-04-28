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
  