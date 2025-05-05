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

const showMsg = getShowMsg(document.querySelector("#infoErrorMsg"));

const defaultCard = document.getElementById("defaultCard");
const session_collection = document.getElementById("session_collection");

async function fillSessions() {

    try {

        const { data } = await apiAuth.get('/api/auth/session/all');

        session_collection.innerHTML = "";
        data.sessions.forEach(session => {
            const card = defaultCard.cloneNode(true);

            if (session.device_name) {
                card.querySelector("#device").innerText = `${session.device_type.toUpperCase()} · ${session.device_name}`;
            } else {
                card.querySelector("#device").innerText = session.device_type.toUpperCase();
            }
            if (session.browser) {
                card.querySelector("#browser").innerText = session.browser;
            } else {
                card.querySelector("#browser").innerText = session.user_agent.split("/")[0];
            }
            if (session.current) {
                card.querySelector("#currentSession").hidden = false;
                card.querySelector("#activity").hidden = true;
            }
            card.querySelector("#created_at").innerText = formatTimestamp(session.created_at);
            card.querySelector("#last_used_at").innerText = formatTimestamp(session.last_used_at);
            if (session.country === "-") {
                card.querySelector("#location").innerText = "LocalHost";
            } else {
                card.querySelector("#location").innerText = `${session.city}, ${session.region}, ${session.country}`
            }

            card.querySelector("#signout_btn").addEventListener("click", async (e) => {
                e.preventDefault();

                showMsg("Loading...", INFOD);

                try {
        
                    const { data } = await apiAuth.delete("/api/auth/session/"+session.id);
                    
                    showMsg(data.msg, SUCCESS);
                    card.remove();

                } catch (error) {
                    if (error.response?.data?.msg)
                        showMsg(error.response.data.msg, ERROR);
                    else console.error(error);
                }

            });

            card.hidden = false;
            session_collection.appendChild(card);

        });

    } catch (error) {
        console.error();
        alert("Something Went Wrong");
    }

}

fillSessions();

document.querySelector("#signout_all_btn").addEventListener("click", async (e) => {
    e.preventDefault();

    showMsg("Loading...", INFOD);

    try {

        const { data } = await apiAuth.delete("/api/auth/session/all");
        
        showMsg(data.msg, SUCCESS);
        setTimeout(() => {
            window.location.href = `./login.html`
        }, 1000);

    } catch (error) {
        if (error.response?.data?.msg)
            showMsg(error.response.data.msg, ERROR);
        else console.error(error);
    }

});
