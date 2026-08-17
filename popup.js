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
    wordProgress: "wordProgress"
};

function getDateKey(date = new Date()) {
    const year =
        date.getFullYear();

    const month =
        String(
            date.getMonth() + 1
        ).padStart(2, "0");

    const day =
        String(
            date.getDate()
        ).padStart(2, "0");

    return `${year}-${month}-${day}`;
}

function getFormattedDate() {
    return new Intl.DateTimeFormat(
        "en-US",
        {
            weekday: "short",
            month: "short",
            day: "numeric",
            year: "numeric"
        }
    ).format(new Date());
}

function addDays(
    dateKey,
    days
) {
    const date =
        new Date(
            `${dateKey}T00:00:00`
        );

    date.setDate(
        date.getDate() + days
    );

    return getDateKey(date);
}

function getDayNumber() {
    const now =
        new Date();

    const startOfYear =
        new Date(
            now.getFullYear(),
            0,
            0
        );

    const diff =
        now -
        startOfYear +
        (
            startOfYear.getTimezoneOffset() -
            now.getTimezoneOffset()
        ) *
        60 *
        1000;

    return Math.floor(
        diff /
        (1000 * 60 * 60 * 24)
    );
}

async function getWordProgress() {
    const result =
        await chrome.storage.local.get([
            STORAGE_KEYS.wordProgress
        ]);

    return (
        result[
        STORAGE_KEYS.wordProgress
        ] || {}
    );
}

async function saveWordProgress(
    progress
) {
    await chrome.storage.local.set({
        [STORAGE_KEYS.wordProgress]:
            progress
    });
}

function createDefaultProgress(
    word
) {
    return {
        word: word.word,

        status: "new",

        masteryScore: 0,

        intervalIndex: 0,

        dueDate: null,

        totalReviews: 0,

        correctReviews: 0,

        lastReviewed: null
    };
}

function selectNewWords(
    progress
) {
    const totalWords =
        WORDS.length;

    const dayNumber =
        getDayNumber();

    const startIndex =
        (dayNumber * 3) %
        totalWords;

    const selected = [];

    for (
        let offset = 0;
        offset < totalWords;
        offset++
    ) {
        const index =
            (
                startIndex +
                offset
            ) %
            totalWords;

        const word =
            WORDS[index];

        if (
            !progress[word.word]
        ) {
            selected.push(word);
        }

        if (
            selected.length === 3
        ) {
            break;
        }
    }

    return selected;
}

async function getDailyData(
    progress
) {
    const today =
        getDateKey();

    const result =
        await chrome.storage.local.get([
            STORAGE_KEYS.dailyData
        ]);

    const storedData =
        result[
        STORAGE_KEYS.dailyData
        ];

    if (
        storedData &&
        storedData.date === today
    ) {
        return storedData;
    }

    const newWords =
        selectNewWords(
            progress
        );

    const dailyData = {
        date: today,

        words:
            newWords.map(
                (word) => ({
                    word: word.word,
                    learned: false
                })
            )
    };

    await chrome.storage.local.set({
        [STORAGE_KEYS.dailyData]:
            dailyData
    });

    return dailyData;
}

function getMasteryLabel(
    score
) {
    if (score >= 85) {
        return "Mastered";
    }

    if (score >= 60) {
        return "Familiar";
    }

    if (score > 0) {
        return "Learning";
    }

    return "New";
}

function getNextIntervalIndex(
    progress,
    result
) {
    let index =
        progress.intervalIndex;

    if (result === "hard") {
        return Math.max(
            0,
            index - 1
        );
    }

    if (result === "good") {
        return Math.min(
            REVISION_INTERVALS.length - 1,
            index + 1
        );
    }

    return Math.min(
        REVISION_INTERVALS.length - 1,
        index + 2
    );
}

function updateMasteryScore(
    progress,
    result
) {
    let score =
        progress.masteryScore || 0;

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

function createWordCard(
    word,
    savedWord,
    index,
    dailyData
) {
    const card =
        document.createElement(
            "article"
        );

    card.className =
        `word-card${savedWord.learned
            ? " learned"
            : ""
        }`;

    const header =
        document.createElement(
            "div"
        );

    header.className =
        "word-header";

    const titleBlock =
        document.createElement(
            "div"
        );

    const title =
        document.createElement(
            "h2"
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
        word.pronunciation;

    const partOfSpeech =
        document.createElement(
            "span"
        );

    partOfSpeech.className =
        "part-of-speech";

    partOfSpeech.textContent =
        word.partOfSpeech;

    titleBlock.appendChild(
        title
    );

    titleBlock.appendChild(
        pronunciation
    );

    titleBlock.appendChild(
        partOfSpeech
    );

    header.appendChild(
        titleBlock
    );

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

    const synonym =
        document.createElement(
            "div"
        );

    synonym.className =
        "relation";

    synonym.innerHTML = `
    <span class="relation-label">
      Synonym
    </span>

    <span class="relation-value"></span>
  `;

    synonym.querySelector(
        ".relation-value"
    ).textContent =
        word.synonym;

    const antonym =
        document.createElement(
            "div"
        );

    antonym.className =
        "relation";

    antonym.innerHTML = `
    <span class="relation-label">
      Antonym
    </span>

    <span class="relation-value"></span>
  `;

    antonym.querySelector(
        ".relation-value"
    ).textContent =
        word.antonym;

    relations.appendChild(
        synonym
    );

    relations.appendChild(
        antonym
    );

    const examplesTitle =
        document.createElement(
            "div"
        );

    examplesTitle.className =
        "examples-title";

    examplesTitle.textContent =
        "Examples";

    const examplesList =
        document.createElement(
            "ol"
        );

    examplesList.className =
        "examples";

    word.examples.forEach(
        (example) => {
            const item =
                document.createElement(
                    "li"
                );

            item.textContent =
                example;

            examplesList.appendChild(
                item
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
        savedWord.learned
            ? "Learned ✓"
            : "Mark as Learned";

    if (
        savedWord.learned
    ) {
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

                if (
                    !progress[word.word]
                ) {
                    progress[word.word] =
                        createDefaultProgress(
                            word
                        );
                }

                progress[word.word]
                    .status =
                    "learning";

                progress[word.word]
                    .masteryScore =
                    Math.max(
                        10,
                        progress[
                            word.word
                        ].masteryScore || 0
                    );

                progress[word.word]
                    .intervalIndex = 0;

                progress[word.word]
                    .dueDate =
                    addDays(
                        getDateKey(),
                        1
                    );

                progress[word.word]
                    .lastReviewed =
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

                await render();
            }
        );
    }

    card.appendChild(
        header
    );

    card.appendChild(
        meaning
    );

    card.appendChild(
        relations
    );

    card.appendChild(
        examplesTitle
    );

    card.appendChild(
        examplesList
    );

    card.appendChild(
        button
    );

    return card;
}

function createRevisionCard(
    word,
    progress,
    onCompleted
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

    const title =
        document.createElement(
            "h3"
        );

    title.className =
        "revision-word";

    title.textContent =
        word.word;

    const meta =
        document.createElement(
            "div"
        );

    meta.className =
        "revision-meta";

    const status =
        document.createElement(
            "span"
        );

    status.className =
        "revision-status";

    status.textContent =
        getMasteryLabel(
            progress.masteryScore || 0
        );

    const mastery =
        document.createElement(
            "span"
        );

    mastery.className =
        "mastery-score";

    mastery.textContent =
        `${progress.masteryScore || 0}%`;

    meta.appendChild(
        status
    );

    meta.appendChild(
        mastery
    );

    header.appendChild(
        title
    );

    header.appendChild(
        meta
    );

    const masteryTrack =
        document.createElement(
            "div"
        );

    masteryTrack.className =
        "mastery-track";

    const masteryFill =
        document.createElement(
            "div"
        );

    masteryFill.className =
        "mastery-fill";

    masteryFill.style.width =
        `${progress.masteryScore || 0}%`;

    masteryTrack.appendChild(
        masteryFill
    );

    const prompt =
        document.createElement(
            "p"
        );

    prompt.className =
        "revision-prompt";

    prompt.textContent =
        `What does "${word.word}" mean?`;

    const showAnswerButton =
        document.createElement(
            "button"
        );

    showAnswerButton.className =
        "show-answer-button";

    showAnswerButton.textContent =
        "Show Answer";

    const answerBox =
        document.createElement(
            "div"
        );

    answerBox.className =
        "answer-box";

    answerBox.innerHTML = `
    <p class="answer-meaning"></p>

    <div class="answer-detail">
      Synonym:
      <strong class="answer-synonym"></strong>
    </div>

    <div class="answer-detail">
      Antonym:
      <strong class="answer-antonym"></strong>
    </div>
  `;

    answerBox.querySelector(
        ".answer-meaning"
    ).textContent =
        word.meaning;

    answerBox.querySelector(
        ".answer-synonym"
    ).textContent =
        word.synonym;

    answerBox.querySelector(
        ".answer-antonym"
    ).textContent =
        word.antonym;

    const actions =
        document.createElement(
            "div"
        );

    actions.className =
        "revision-actions";

    const hardButton =
        document.createElement(
            "button"
        );

    hardButton.className =
        "revision-button";

    hardButton.textContent =
        "😕 Hard";

    const goodButton =
        document.createElement(
            "button"
        );

    goodButton.className =
        "revision-button";

    goodButton.textContent =
        "🙂 Good";

    const easyButton =
        document.createElement(
            "button"
        );

    easyButton.className =
        "revision-button";

    easyButton.textContent =
        "😎 Easy";

    actions.appendChild(
        hardButton
    );

    actions.appendChild(
        goodButton
    );

    actions.appendChild(
        easyButton
    );

    showAnswerButton.addEventListener(
        "click",
        () => {
            answerBox.classList.add(
                "visible"
            );

            actions.classList.add(
                "visible"
            );

            showAnswerButton.style.display =
                "none";
        }
    );

    async function completeReview(
        result
    ) {
        const updatedProgress =
            await getWordProgress();

        const item =
            updatedProgress[
            word.word
            ];

        if (!item) {
            return;
        }

        item.totalReviews += 1;

        item.lastReviewed =
            getDateKey();

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

        if (
            result === "hard"
        ) {
            item.dueDate =
                addDays(
                    getDateKey(),
                    1
                );
        } else {
            item.dueDate =
                addDays(
                    getDateKey(),
                    REVISION_INTERVALS[
                    item.intervalIndex
                    ]
                );
        }

        item.status =
            getMasteryLabel(
                item.masteryScore
            ).toLowerCase();

        if (
            result === "hard"
        ) {
            item.status =
                "learning";
        }

        await saveWordProgress(
            updatedProgress
        );

        await onCompleted();
    }

    hardButton.addEventListener(
        "click",
        () => {
            completeReview(
                "hard"
            );
        }
    );

    goodButton.addEventListener(
        "click",
        () => {
            completeReview(
                "good"
            );
        }
    );

    easyButton.addEventListener(
        "click",
        () => {
            completeReview(
                "easy"
            );
        }
    );

    card.appendChild(
        header
    );

    card.appendChild(
        masteryTrack
    );

    card.appendChild(
        prompt
    );

    card.appendChild(
        showAnswerButton
    );

    card.appendChild(
        answerBox
    );

    card.appendChild(
        actions
    );

    return card;
}

async function getDueWords(
    progress
) {
    const today =
        getDateKey();

    return WORDS
        .filter(
            (word) => {
                const item =
                    progress[word.word];

                return (
                    item &&
                    item.dueDate &&
                    item.dueDate <= today
                );
            }
        )
        .sort(
            (a, b) => {
                const aScore =
                    progress[a.word]
                        .masteryScore || 0;

                const bScore =
                    progress[b.word]
                        .masteryScore || 0;

                return (
                    aScore -
                    bScore
                );
            }
        );
}

function calculateAverageMastery(
    progress
) {
    const values =
        Object.values(
            progress
        )
            .map(
                (item) =>
                    item.masteryScore || 0
            );

    if (
        values.length === 0
    ) {
        return null;
    }

    const total =
        values.reduce(
            (sum, value) =>
                sum + value,
            0
        );

    return Math.round(
        total / values.length
    );
}

async function renderRevisions(
    progress
) {
    const section =
        document.getElementById(
            "revision-section"
        );

    const container =
        document.getElementById(
            "revision-container"
        );

    const count =
        document.getElementById(
            "revision-count"
        );

    const dueWords =
        await getDueWords(
            progress
        );

    container.innerHTML =
        "";

    count.textContent =
        dueWords.length;

    if (
        dueWords.length === 0
    ) {
        section.classList.add(
            "hidden"
        );

        return 0;
    }

    section.classList.remove(
        "hidden"
    );

    dueWords.forEach(
        (word) => {
            const card =
                createRevisionCard(
                    word,
                    progress[word.word],
                    async () => {
                        await render();
                    }
                );

            container.appendChild(
                card
            );
        }
    );

    return dueWords.length;
}

function updateProgress(
    dailyData,
    revisionCount,
    progress
) {
    const learnedCount =
        dailyData.words.filter(
            (item) =>
                item.learned
        ).length;

    const progressText =
        document.getElementById(
            "progress-text"
        );

    const progressBar =
        document.getElementById(
            "progress-bar"
        );

    const completionMessage =
        document.getElementById(
            "completion-message"
        );

    const newCount =
        document.getElementById(
            "new-count"
        );

    const dueCount =
        document.getElementById(
            "due-count"
        );

    const masteryScore =
        document.getElementById(
            "mastery-score"
        );

    const average =
        calculateAverageMastery(
            progress
        );

    newCount.textContent =
        `${learnedCount}/3`;

    dueCount.textContent =
        revisionCount;

    masteryScore.textContent =
        average === null
            ? "—"
            : `${average}%`;

    progressText.textContent =
        `${learnedCount}/3 new words`;

    progressBar.style.width =
        `${(learnedCount / 3) * 100}%`;

    completionMessage.classList.toggle(
        "hidden",
        learnedCount !== 3
    );
}

async function render() {
    const progress =
        await getWordProgress();

    const dailyData =
        await getDailyData(
            progress
        );

    const wordsContainer =
        document.getElementById(
            "words-container"
        );

    wordsContainer.innerHTML =
        "";

    dailyData.words.forEach(
        (savedWord, index) => {
            const word =
                WORDS.find(
                    (item) =>
                        item.word ===
                        savedWord.word
                );

            if (!word) {
                return;
            }

            const card =
                createWordCard(
                    word,
                    savedWord,
                    index,
                    dailyData
                );

            wordsContainer.appendChild(
                card
            );
        }
    );

    const dueCount =
        await renderRevisions(
            progress
        );

    updateProgress(
        dailyData,
        dueCount,
        progress
    );
}

function initializeDate() {
    document.getElementById(
        "date"
    ).textContent =
        getFormattedDate();
}

async function initialize() {
    try {
        initializeDate();

        await render();
    } catch (error) {
        console.error(
            "Failed to initialize LexiLoop:",
            error
        );

        document.getElementById(
            "words-container"
        ).innerHTML = `
      <div class="word-card">
        <strong>
          Something went wrong.
        </strong>

        <p class="meaning">
          Please close and reopen
          the extension.
        </p>
      </div>
    `;
    }
}

document.addEventListener(
    "DOMContentLoaded",
    initialize
);