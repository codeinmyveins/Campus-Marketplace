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

const defaultCard = document.querySelector("#defaultCard");
const cardList = document.querySelector("#card_list");
const defaultOpenBadge = document.querySelector("#open_badge_hidden");
const defaultClosedBadge = document.querySelector("#closed_badge_hidden");

var userId;

async function fillDetails() {


    try {

        const { data } = await apiAuth.get("/api/users");

        userId = data.user.id;

    } catch (error) {
        console.error(error);
    }

    try {
        const { data } = await axios.get(`/api/items?user_id=${userId}&sort=-modified_at&closed=all`);

        if (data.itemCount > 0) {
            document.querySelector("#itemInfo").classList.add("hidden");
        }

        cardList.innerHTML = "";

        data.items.forEach(item => {

            const card = defaultCard.cloneNode(true);
            card.removeAttribute("id");
            card.querySelector("#title").innerText = item.title;
            card.querySelector("#item_name").innerText = item.item_name;
            card.querySelector("#item_category").innerText = item.item_category;
            card.querySelector("#price").innerText = item.price == 0 ? "Free" : item.price;
            card.querySelector("#type").innerText = item.type;
            card.querySelector("#editBtn").href = `/edit-item/${item.id}`;
            card.querySelector("#created_at").innerText = formatTimestamp(item.created_at);
            card.querySelector("#modified_at").innerText = formatTimestamp(item.modified_at);
            if (item.cover_img){
                const coverImg = card.querySelector("#coverImg");
                coverImg.src = item.cover_img.url;
                coverImg.alt = item.cover_img.name;
            }

            const badge = item.closed ? defaultClosedBadge.cloneNode(true): defaultOpenBadge.cloneNode(true);
            badge.hidden = false;

            card.querySelector("#badge_container").append(badge);

            card.hidden = false;
            card.classList.remove("hidden");
            cardList.appendChild(card);

        });

    } catch (error) {
        alert("Somethng went wrong");
        console.error(error);
    }

}

fillDetails();
