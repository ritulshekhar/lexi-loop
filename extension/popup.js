const REVISION_INTERVALS = [
    1,
    3,
    7,
    14,
    30,
    45
];

const STORAGE_KEYS = {
    dailyData: "dailyData",
    wordProgress: "wordProgress",
    activityHistory: "activityHistory"
};

function getDateKey(date = new Date()) {
    const year = date.getFullYear();

    const month = String(
        date.getMonth() + 1
    ).padStart(2, "0");

    const day = String(
        date.getDate()
    ).padStart(2, "0");

    return `${year}-${month}-${day}`;
}

function getFormattedDate() {
    return new Intl.DateTimeFormat("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric"
    }).format(new Date());
}

function addDays(dateKey, days) {
    const date = new Date(
        `${dateKey}T00:00:00`
    );

    date.setDate(
        date.getDate() + days
    );

    return getDateKey(date);
}

async function getWordProgress() {
    const result =
        await chrome.storage.local.get([
            STORAGE_KEYS.wordProgress
        ]);

    return (
        result.wordProgress || {}
    );
}

async function saveWordProgress(progress) {
    await chrome.storage.local.set({
        [STORAGE_KEYS.wordProgress]:
            progress
    });
}

async function getActivityHistory() {
    const result =
        await chrome.storage.local.get([
            STORAGE_KEYS.activityHistory
        ]);

    return (
        result.activityHistory || []
    );
}

async function recordActivity() {
    const history =
        await getActivityHistory();

    const today =
        getDateKey();

    if (!history.includes(today)) {
        history.push(today);
    }

    await chrome.storage.local.set({
        [STORAGE_KEYS.activityHistory]:
            history
    });
}

function calculateStreak(history) {
    if (!history.length) {
        return 0;
    }

    const dates = new Set(history);

    let cursor = new Date();
    let streak = 0;

    while (
        dates.has(
            getDateKey(cursor)
        )
    ) {
        streak += 1;

        cursor.setDate(
            cursor.getDate() - 1
        );
    }

    return streak;
}

function createDefaultProgress(word) {
    return {
        word: word.word,

        pronunciation:
            word.pronunciation || "",

        partOfSpeech:
            word.partOfSpeech || "",

        meaning:
            word.meaning || "",

        synonym:
            word.synonym || "—",

        antonym:
            word.antonym || "—",

        examples:
            word.examples || [],

        masteryScore: 0,

        intervalIndex: 0,

        dueDate: null,

        totalReviews: 0,

        correctReviews: 0,

        status: "new",

        lastReviewed: null
    };
}

function getMasteryLabel(score) {
    if (score >= 85) {
        return "Mastered";
    }

    if (score >= 60) {
        return "Familiar";
    }

    return "Learning";
}

function updateMasteryScore(item, result) {
    let score =
        item.masteryScore || 0;

    if (result === "hard") {
        score -= 15;
    }

    if (result === "good") {
        score += 10;
    }

    if (result === "easy") {
        score += 20;
    }

    return Math.max(
        0,
        Math.min(100, score)
    );
}

function getNextIntervalIndex(item, result) {
    const current =
        item.intervalIndex || 0;

    if (result === "hard") {
        return Math.max(
            0,
            current - 1
        );
    }

    if (result === "good") {
        return Math.min(
            REVISION_INTERVALS.length - 1,
            current + 1
        );
    }

    return Math.min(
        REVISION_INTERVALS.length - 1,
        current + 2
    );
}

async function getDailyData() {
    const progress =
        await getWordProgress();

    const result =
        await chrome.storage.local.get([
            STORAGE_KEYS.dailyData
        ]);

    const storedData =
        result.dailyData;

    const today =
        getDateKey();

    if (
        storedData &&
        storedData.date === today
    ) {
        return storedData;
    }

    const words =
        await getWordsForToday(
            progress,
            3
        );

    const dailyData = {
        date: today,

        words: words.map(
            (word) => ({
                ...word,
                learned: Boolean(
                    progress[word.word]
                )
            })
        )
    };

    await chrome.storage.local.set({
        [STORAGE_KEYS.dailyData]:
            dailyData
    });

    return dailyData;
}

function createWordCard(
    word,
    saved,
    index,
    dailyData
) {
    const card =
        document.createElement(
            "article"
        );

    card.className =
        "word-card";

    const title =
        document.createElement(
            "h3"
        );

    title.className =
        "word-title";

    title.textContent =
        word.word;

    const pronunciation =
        document.createElement(
            "div"
        );

    pronunciation.className =
        "pronunciation";

    pronunciation.textContent =
        word.pronunciation || "";

    const part =
        document.createElement(
            "span"
        );

    part.className =
        "part-of-speech";

    part.textContent =
        word.partOfSpeech ||
        "word";

    const meaning =
        document.createElement(
            "p"
        );

    meaning.className =
        "meaning";

    meaning.textContent =
        word.meaning;

    const relations =
        document.createElement(
            "div"
        );

    relations.className =
        "word-relations";

    relations.innerHTML = `
    <div class="relation">
      <span class="relation-label">
        Synonym
      </span>
      <span class="relation-value"></span>
    </div>

    <div class="relation">
      <span class="relation-label">
        Antonym
      </span>
      <span class="relation-value"></span>
    </div>
  `;

    const relationValues =
        relations.querySelectorAll(
            ".relation-value"
        );

    relationValues[0].textContent =
        word.synonym || "—";

    relationValues[1].textContent =
        word.antonym || "—";

    const examplesTitle =
        document.createElement(
            "div"
        );

    examplesTitle.className =
        "examples-title";

    examplesTitle.textContent =
        "Examples";

    const examples =
        document.createElement(
            "ol"
        );

    examples.className =
        "examples";

    (
        word.examples || []
    )
        .slice(0, 4)
        .forEach(
            (example) => {
                const li =
                    document.createElement(
                        "li"
                    );

                li.textContent =
                    example;

                examples.appendChild(
                    li
                );
            }
        );

    const button =
        document.createElement(
            "button"
        );

    button.className =
        "learn-button";

    button.textContent =
        saved.learned
            ? "Learned ✓"
            : "Mark as Learned";

    if (saved.learned) {
        button.classList.add(
            "learned"
        );

        button.disabled = true;
    } else {
        button.addEventListener(
            "click",
            async () => {
                const progress =
                    await getWordProgress();

                if (!progress[word.word]) {
                    progress[word.word] =
                        createDefaultProgress(
                            word
                        );
                }

                const item =
                    progress[word.word];

                item.status =
                    "learning";

                item.masteryScore =
                    Math.max(
                        10,
                        item.masteryScore || 0
                    );

                item.intervalIndex = 0;

                item.dueDate =
                    addDays(
                        getDateKey(),
                        1
                    );

                item.lastReviewed =
                    getDateKey();

                dailyData.words[index]
                    .learned = true;

                await saveWordProgress(
                    progress
                );

                await chrome.storage.local.set({
                    [STORAGE_KEYS.dailyData]:
                        dailyData
                });

                await recordActivity();

                await render();
            }
        );
    }

    card.appendChild(title);
    card.appendChild(pronunciation);
    card.appendChild(part);
    card.appendChild(meaning);
    card.appendChild(relations);
    card.appendChild(examplesTitle);
    card.appendChild(examples);
    card.appendChild(button);

    return card;
}

function createRevisionCard(
    word,
    item
) {
    const card =
        document.createElement(
            "article"
        );

    card.className =
        "revision-card";

    const header =
        document.createElement(
            "div"
        );

    header.className =
        "revision-header";

    header.innerHTML = `
    <h3 class="revision-word"></h3>

    <div class="revision-meta">
      <span class="revision-status"></span>
      <span class="mastery-score"></span>
    </div>
  `;

    header.querySelector(
        ".revision-word"
    ).textContent =
        word.word;

    header.querySelector(
        ".revision-status"
    ).textContent =
        getMasteryLabel(
            item.masteryScore || 0
        );

    header.querySelector(
        ".mastery-score"
    ).textContent =
        `${item.masteryScore || 0}%`;

    const track =
        document.createElement(
            "div"
        );

    track.className =
        "mastery-track";

    const fill =
        document.createElement(
            "div"
        );

    fill.className =
        "mastery-fill";

    fill.style.width =
        `${item.masteryScore || 0}%`;

    track.appendChild(fill);

    const prompt =
        document.createElement(
            "p"
        );

    prompt.className =
        "revision-prompt";

    prompt.textContent =
        `What does "${word.word}" mean?`;

    const show =
        document.createElement(
            "button"
        );

    show.className =
        "show-answer-button";

    show.textContent =
        "Show Answer";

    const answer =
        document.createElement(
            "div"
        );

    answer.className =
        "answer-box";

    answer.innerHTML = `
    <p class="answer-meaning"></p>

    <div class="answer-detail">
      Synonym:
      <strong></strong>
    </div>

    <div class="answer-detail">
      Antonym:
      <strong></strong>
    </div>
  `;

    answer.querySelector(
        ".answer-meaning"
    ).textContent =
        word.meaning;

    answer.querySelectorAll(
        "strong"
    )[0].textContent =
        word.synonym || "—";

    answer.querySelectorAll(
        "strong"
    )[1].textContent =
        word.antonym || "—";

    const actions =
        document.createElement(
            "div"
        );

    actions.className =
        "revision-actions";

    [
        ["hard", "😕 Hard"],
        ["good", "🙂 Good"],
        ["easy", "😎 Easy"]
    ].forEach(
        ([type, label]) => {
            const button =
                document.createElement(
                    "button"
                );

            button.className =
                "revision-button";

            button.textContent =
                label;

            button.addEventListener(
                "click",
                async () => {
                    await handleReview(
                        word,
                        type
                    );

                    await render();
                }
            );

            actions.appendChild(
                button
            );
        }
    );

    show.addEventListener(
        "click",
        () => {
            answer.classList.add(
                "visible"
            );

            actions.classList.add(
                "visible"
            );

            show.style.display =
                "none";
        }
    );

    card.appendChild(header);
    card.appendChild(track);
    card.appendChild(prompt);
    card.appendChild(show);
    card.appendChild(answer);
    card.appendChild(actions);

    return card;
}

async function handleReview(
    word,
    result
) {
    const progress =
        await getWordProgress();

    if (!progress[word.word]) {
        progress[word.word] =
            createDefaultProgress(
                word
            );
    }

    const item =
        progress[word.word];

    item.totalReviews =
        (item.totalReviews || 0) + 1;

    if (result !== "hard") {
        item.correctReviews =
            (item.correctReviews || 0) + 1;
    }

    item.masteryScore =
        updateMasteryScore(
            item,
            result
        );

    item.intervalIndex =
        getNextIntervalIndex(
            item,
            result
        );

    item.dueDate =
        addDays(
            getDateKey(),
            result === "hard"
                ? 1
                : REVISION_INTERVALS[
                item.intervalIndex
                ]
        );

    item.status =
        result === "hard"
            ? "learning"
            : getMasteryLabel(
                item.masteryScore
            ).toLowerCase();

    item.lastReviewed =
        getDateKey();

    await saveWordProgress(
        progress
    );

    await recordActivity();
}

async function getDueWords(progress) {
    const today =
        getDateKey();

    return Object.values(progress)
        .filter(
            (item) =>
                item.dueDate &&
                item.dueDate <= today
        )
        .sort(
            (a, b) =>
                (a.masteryScore || 0) -
                (b.masteryScore || 0)
        );
}

function getWordData(item) {
    const localWord =
        WORDS.find(
            (word) =>
                word.word === item.word
        );

    if (localWord) {
        return localWord;
    }

    return item;
}

function calculateAverageMastery(
    progress
) {
    const values =
        Object.values(progress).map(
            (item) =>
                item.masteryScore || 0
        );

    if (!values.length) {
        return null;
    }

    return Math.round(
        values.reduce(
            (sum, value) =>
                sum + value,
            0
        ) / values.length
    );
}

async function render() {
    const progress =
        await getWordProgress();

    const dailyData =
        await getDailyData();

    const wordsContainer =
        document.getElementById(
            "words-container"
        );

    wordsContainer.innerHTML =
        "";

    dailyData.words.forEach(
        (word, index) => {
            wordsContainer.appendChild(
                createWordCard(
                    word,
                    word,
                    index,
                    dailyData
                )
            );
        }
    );

    const dueWords =
        await getDueWords(
            progress
        );

    const revisionSection =
        document.getElementById(
            "revision-section"
        );

    const revisionContainer =
        document.getElementById(
            "revision-container"
        );

    revisionContainer.innerHTML =
        "";

    document.getElementById(
        "revision-count"
    ).textContent =
        dueWords.length;

    if (!dueWords.length) {
        revisionSection.classList.add(
            "hidden"
        );
    } else {
        revisionSection.classList.remove(
            "hidden"
        );

        dueWords
            .slice(0, 3)
            .forEach(
                (item) => {
                    const word =
                        getWordData(item);

                    revisionContainer.appendChild(
                        createRevisionCard(
                            word,
                            item
                        )
                    );
                }
            );
    }

    const learned =
        dailyData.words.filter(
            (item) =>
                item.learned
        ).length;

    document.getElementById(
        "new-count"
    ).textContent =
        `${learned}/3`;

    document.getElementById(
        "due-count"
    ).textContent =
        dueWords.length;

    document.getElementById(
        "progress-text"
    ).textContent =
        `${learned}/3`;

    document.getElementById(
        "completion-message"
    ).classList.toggle(
        "hidden",
        learned !== 3
    );

    const mastery =
        calculateAverageMastery(
            progress
        );

    document.getElementById(
        "mastery-score"
    ).textContent =
        mastery === null
            ? "—"
            : `${mastery}%`;

    const history =
        await getActivityHistory();

    document.getElementById(
        "streak"
    ).textContent =
        calculateStreak(
            history
        );
}

function initialize() {
    document.getElementById(
        "date"
    ).textContent =
        getFormattedDate();

    document.getElementById(
        "open-dashboard"
    ).addEventListener(
        "click",
        () => {
            chrome.tabs.create({
                url:
                    chrome.runtime.getURL(
                        "dashboard.html"
                    )
            });
        }
    );
}

document.addEventListener(
    "DOMContentLoaded",
    async () => {
        initialize();

        try {
            await render();
        } catch (error) {
            console.error(
                "LexiLoop failed to load:",
                error
            );

            document.getElementById(
                "words-container"
            ).innerHTML = `
        <div class="word-card">
          <p class="meaning">
            Something went wrong while
            loading today's vocabulary.
          </p>
        </div>
      `;
        }
    }
);