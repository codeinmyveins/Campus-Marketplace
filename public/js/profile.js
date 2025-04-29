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

const pathParts = window.location.pathname.split('/');
const is_me = !(pathParts.length === 3);
const username = !is_me ? pathParts[pathParts.length - 1] : "";


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
