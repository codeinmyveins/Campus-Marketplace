// Utility function to show Success, Info or Error message

const SUCCESS = "success";
const INFO = "info";
const INFOD = "info-dark";
const ERROR = "error";

function getShowMsg(infoErrorMsg) {
    if (!infoErrorMsg || !(infoErrorMsg instanceof HTMLElement)) {
        throw new Error("Invalid element passed to getShowMsg");
    }

    let timeoutId = null;

    return (message, type = ERROR, timeout = 7000) => {

        if (timeoutId) {
            clearTimeout(timeoutId);
            timeoutId = null;
        }

        infoErrorMsg.classList.remove("hidden", "text-green-500", "text-red-500", "text-teal-50", "text-teal-950");

        if (type === SUCCESS) {
            infoErrorMsg.classList.add("text-green-500");
        } else if (type === INFO) {
            infoErrorMsg.classList.add("text-teal-50");
        } else if (type === INFOD) {
            infoErrorMsg.classList.add("text-teal-950");
        } else if (type === ERROR) {
            infoErrorMsg.classList.add("text-red-500");
        }
        else throw new Error(`Invalid type: "${type}", can only be "success", "error", "info"`);
        infoErrorMsg.textContent = message;

        // Auto-clears msg
        if (!timeout) return;
        timeoutId = setTimeout(() => {
            infoErrorMsg.classList.add("hidden");
            timeoutId = null;
        }, timeout);
    }
}
