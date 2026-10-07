const noteText = document.getElementById("note-text");
const charCount = document.getElementById("char-count");
const wordCount = document.getElementById("word-count");
const clearBtn = document.getElementById("clear-btn");
const themeToggle = document.getElementById("theme-toggle");

function updateCounts() {
    const text = noteText.value;
    const characters = text.length;

    const words = text.trim() === ""
        ? 0
        : text.trim().split(/\s+/).length;

    charCount.textContent = `${characters} / 200 characters`;
    wordCount.textContent = `${words} words`;

    charCount.classList.remove("warning", "over");

    if (characters > 200) {
        charCount.classList.add("over");
    } else if (characters > 180) {
        charCount.classList.add("warning");
    }
}

noteText.addEventListener("input", () => {
    updateCounts();
    localStorage.setItem("quickNoteDraft", noteText.value);
});

clearBtn.addEventListener("click", () => {
    noteText.value = "";
    updateCounts();
    localStorage.removeItem("quickNoteDraft");
});

themeToggle.addEventListener("click", () => {
    document.body.classList.toggle("dark");

    const isDark = document.body.classList.contains("dark");

    themeToggle.textContent = isDark ? "Light mode" : "Dark mode";

    localStorage.setItem("quickNoteTheme", isDark ? "dark" : "light");
});

noteText.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
        noteText.value = "";
        updateCounts();
        localStorage.removeItem("quickNoteDraft");
    }
});

window.addEventListener("load", () => {
    const savedDraft = localStorage.getItem("quickNoteDraft");
    const savedTheme = localStorage.getItem("quickNoteTheme");

    if (savedDraft) {
        noteText.value = savedDraft;
    }

    if (savedTheme === "dark") {
        document.body.classList.add("dark");
        themeToggle.textContent = "Light mode";
    }

    updateCounts();
});