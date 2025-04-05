// Function to toggle the mobile menu
function toggleMenu() {
    document.getElementById("mobileMenu").classList.toggle("hidden");
  }
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
  threshold:0.7,
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