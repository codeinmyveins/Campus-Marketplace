const pathParts = window.location.pathname.split('/');
const username = pathParts[pathParts.length - 1];

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
    const { data: { user } } = await axios.get("/api/users/" + username);
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
