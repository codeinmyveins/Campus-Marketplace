function toggleSidebar() {
const sidebar = document.getElementById("sidebar");
sidebar.classList.toggle("translate-x-full");
}

function toggleFilterSidebar() {
const sidebar = document.getElementById("filterSidebar");
sidebar.classList.toggle("translate-x-0");
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

document.getElementById("price").addEventListener("input", function () {
document.getElementById("price-value").textContent = this.value;
});
