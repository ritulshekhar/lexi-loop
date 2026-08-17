const STORAGE_KEYS = {
    dailyData: "dailyData"
};

function getDateKey() {
    const now = new Date();

    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
}

function getFormattedDate() {
    return new Intl.DateTimeFormat("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
        year: "numeric"
    }).format(new Date());
}

function getDayNumber() {
    const now = new Date();

    const startOfYear = new Date(now.getFullYear(), 0, 0);
    const diff =
        now -
        startOfYear +
        (startOfYear.getTimezoneOffset() - now.getTimezoneOffset()) *
        60 *
        1000;

    return Math.floor(diff / (1000 * 60 * 60 * 24));
}

function getTodayWords() {
    const totalWords = WORDS.length;
    const dayNumber = getDayNumber();

    const startIndex = (dayNumber * 3) % totalWords;

    const selected = [
        WORDS[startIndex % totalWords],
        WORDS[(startIndex + 1) % totalWords],
        WORDS[(startIndex + 2) % totalWords]
    ];

    return selected;
}

async function getDailyData() {
    const today = getDateKey();
    const result = await chrome.storage.local.get([STORAGE_KEYS.dailyData]);

    const storedData = result[STORAGE_KEYS.dailyData];

    if (!storedData || storedData.date !== today) {
        const newData = {
            date: today,
            words: getTodayWords().map((word) => ({
                word: word.word,
                learned: false
            }))
        };

        await chrome.storage.local.set({
            [STORAGE_KEYS.dailyData]: newData
        });

        return newData;
    }

    return storedData;
}

async function saveDailyData(data) {
    await chrome.storage.local.set({
        [STORAGE_KEYS.dailyData]: data
    });
}

function createWordCard(word, learned, index) {
    const card = document.createElement("article");
    card.className = `word-card${learned ? " learned" : ""}`;

    const header = document.createElement("div");
    header.className = "word-header";

    const titleBlock = document.createElement("div");

    const title = document.createElement("h2");
    title.className = "word-title";
    title.textContent = word.word;

    const pronunciation = document.createElement("div");
    pronunciation.className = "pronunciation";
    pronunciation.textContent = word.pronunciation;

    const partOfSpeech = document.createElement("span");
    partOfSpeech.className = "part-of-speech";
    partOfSpeech.textContent = word.partOfSpeech;

    titleBlock.appendChild(title);
    titleBlock.appendChild(pronunciation);
    titleBlock.appendChild(partOfSpeech);

    header.appendChild(titleBlock);

    const meaning = document.createElement("p");
    meaning.className = "meaning";
    meaning.textContent = word.meaning;

    const relations = document.createElement("div");
    relations.className = "word-relations";

    const synonym = document.createElement("div");
    synonym.className = "relation";
    synonym.innerHTML = `
    <span class="relation-label">Synonym</span>
    <span class="relation-value"></span>
  `;
    synonym.querySelector(".relation-value").textContent = word.synonym;

    const antonym = document.createElement("div");
    antonym.className = "relation";
    antonym.innerHTML = `
    <span class="relation-label">Antonym</span>
    <span class="relation-value"></span>
  `;
    antonym.querySelector(".relation-value").textContent = word.antonym;

    relations.appendChild(synonym);
    relations.appendChild(antonym);

    const examplesTitle = document.createElement("div");
    examplesTitle.className = "examples-title";
    examplesTitle.textContent = "Examples";

    const examplesList = document.createElement("ol");
    examplesList.className = "examples";

    word.examples.forEach((example) => {
        const item = document.createElement("li");
        item.textContent = example;
        examplesList.appendChild(item);
    });

    const button = document.createElement("button");
    button.className = "learn-button";
    button.textContent = learned ? "Learned ✓" : "Mark as Learned";

    if (learned) {
        button.classList.add("learned");
        button.disabled = true;
    } else {
        button.addEventListener("click", async () => {
            const data = await getDailyData();

            if (data.words[index]) {
                data.words[index].learned = true;
                await saveDailyData(data);
                await render();
            }
        });
    }

    card.appendChild(header);
    card.appendChild(meaning);
    card.appendChild(relations);
    card.appendChild(examplesTitle);
    card.appendChild(examplesList);
    card.appendChild(button);

    return card;
}

function updateProgress(dailyData) {
    const learnedCount = dailyData.words.filter(
        (item) => item.learned
    ).length;

    const progressText = document.getElementById("progress-text");
    const progressBar = document.getElementById("progress-bar");
    const completionMessage = document.getElementById("completion-message");

    progressText.textContent = `${learnedCount}/3 learned`;
    progressBar.style.width = `${(learnedCount / 3) * 100}%`;

    completionMessage.classList.toggle("hidden", learnedCount !== 3);
}

async function render() {
    const dailyData = await getDailyData();

    const wordsContainer = document.getElementById("words-container");
    wordsContainer.innerHTML = "";

    dailyData.words.forEach((savedWord, index) => {
        const word = WORDS.find((item) => item.word === savedWord.word);

        if (!word) {
            return;
        }

        const card = createWordCard(
            word,
            savedWord.learned,
            index
        );

        wordsContainer.appendChild(card);
    });

    updateProgress(dailyData);
}

function initializeDate() {
    document.getElementById("date").textContent = getFormattedDate();
}

async function initialize() {
    try {
        initializeDate();
        await render();
    } catch (error) {
        console.error("Failed to initialize LexiLoop:", error);

        const container = document.getElementById("words-container");

        container.innerHTML = `
      <div class="word-card">
        <strong>Something went wrong.</strong>
        <p class="meaning">
          Please close and reopen the extension.
        </p>
      </div>
    `;
    }
}

document.addEventListener("DOMContentLoaded", initialize);