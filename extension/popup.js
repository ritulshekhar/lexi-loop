const REVISION_INTERVALS = [
    1,
    3,
    7,
    14,
    30,
    45
];

const BACKEND_URL =
    "http://localhost:8000";

const STORAGE_KEYS = {
    dailyData: "dailyData",
    wordProgress: "wordProgress",
    activityHistory: "activityHistory",
    aiDailyLesson: "aiDailyLesson",
    aiSettings: "aiSettings"
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
    const now = new Date();

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
        result.wordProgress || {}
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

    if (
        !history.includes(today)
    ) {
        history.push(today);
    }

    history.sort();

    await chrome.storage.local.set({
        [STORAGE_KEYS.activityHistory]:
            history
    });
}

function calculateStreak(
    history
) {
    if (!history.length) {
        return 0;
    }

    const dates =
        new Set(history);

    let cursor =
        new Date();

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

function createDefaultProgress(
    wordData
) {
    return {
        word: wordData.word,
        pronunciation:
            wordData.pronunciation || "",
        partOfSpeech:
            wordData.partOfSpeech || "",
        meaning:
            wordData.meaning || "",
        synonym:
            wordData.synonym || "",
        antonym:
            wordData.antonym || "",
        examples:
            Array.isArray(wordData.examples)
                ? wordData.examples
                : [],

        source:
            wordData.source || "local",

        status: "new",

        masteryScore: 0,

        intervalIndex: 0,

        dueDate: null,

        totalReviews: 0,

        correctReviews: 0,

        lastReviewed: null
    };
}

function getWordDataByName(
    word,
    progress
) {
    const localWord =
        WORDS.find(
            (item) =>
                item.word === word
        );

    if (localWord) {
        return localWord;
    }

    if (progress[word]) {
        return progress[word];
    }

    return null;
}

function selectLocalNewWords(
    progress
) {
    const available =
        WORDS.filter(
            (word) =>
                !progress[word.word]
        );

    if (
        available.length <= 3
    ) {
        return available;
    }

    const start =
        (getDayNumber() * 3) %
        available.length;

    return [
        available[start],
        available[
        (start + 1) %
        available.length
        ],
        available[
        (start + 2) %
        available.length
        ]
    ];
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

    const stored =
        result.dailyData;

    if (
        stored &&
        stored.date === today
    ) {
        return stored;
    }

    const localWords =
        selectLocalNewWords(
            progress
        );

    const dailyData = {
        date: today,

        words:
            localWords.map(
                (word) => ({
                    ...word,
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
        Math.min(
            100,
            score
        )
    );
}

function getNextIntervalIndex(
    progress,
    result
) {
    const current =
        progress.intervalIndex || 0;

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
        word.pronunciation || "";

    const partOfSpeech =
        document.createElement(
            "span"
        );

    partOfSpeech.className =
        "part-of-speech";

    partOfSpeech.textContent =
        word.partOfSpeech || "";

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

    relations
        .querySelectorAll(
            ".relation-value"
        )[0]
        .textContent =
        word.synonym || "—";

    relations
        .querySelectorAll(
            ".relation-value"
        )[1]
        .textContent =
        word.antonym || "—";

    const examplesTitle =
        document.createElement(
            "div"
        );

    examplesTitle.className =
        "examples-title";

    examplesTitle.textContent =
        "Examples";

    const list =
        document.createElement(
            "ol"
        );

    list.className =
        "examples";

    (word.examples || [])
        .slice(0, 4)
        .forEach(
            (example) => {
                const li =
                    document.createElement(
                        "li"
                    );

                li.textContent =
                    example;

                list.appendChild(li);
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
                        progress[word.word]
                            .masteryScore || 0
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

                await recordActivity();

                await renderAll();
            }
        );
    }

    card.appendChild(title);
    card.appendChild(
        pronunciation
    );
    card.appendChild(
        partOfSpeech
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
        list
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

    const score =
        document.createElement(
            "span"
        );

    score.className =
        "mastery-score";

    score.textContent =
        `${progress.masteryScore || 0}%`;

    meta.appendChild(status);
    meta.appendChild(score);

    header.appendChild(title);
    header.appendChild(meta);

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
        `${progress.masteryScore || 0}%`;

    track.appendChild(fill);

    const prompt =
        document.createElement(
            "p"
        );

    prompt.className =
        "revision-prompt";

    prompt.textContent =
        `What does "${word.word}" mean?`;

    const showAnswer =
        document.createElement(
            "button"
        );

    showAnswer.className =
        "show-answer-button";

    showAnswer.textContent =
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
      <strong class="answer-synonym"></strong>
    </div>

    <div class="answer-detail">
      Antonym:
      <strong class="answer-antonym"></strong>
    </div>
  `;

    answer.querySelector(
        ".answer-meaning"
    ).textContent =
        word.meaning;

    answer.querySelector(
        ".answer-synonym"
    ).textContent =
        word.synonym || "—";

    answer.querySelector(
        ".answer-antonym"
    ).textContent =
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

                    await onCompleted();
                }
            );

            actions.appendChild(
                button
            );
        }
    );

    showAnswer.addEventListener(
        "click",
        () => {
            answer.classList.add(
                "visible"
            );

            actions.classList.add(
                "visible"
            );

            showAnswer.style.display =
                "none";
        }
    );

    card.appendChild(header);
    card.appendChild(track);
    card.appendChild(prompt);
    card.appendChild(showAnswer);
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

    if (
        !progress[word.word]
    ) {
        progress[word.word] =
            createDefaultProgress(
                word
            );
    }

    const item =
        progress[word.word];

    item.totalReviews =
        (item.totalReviews || 0) +
        1;

    if (result !== "hard") {
        item.correctReviews =
            (item.correctReviews || 0) +
            1;
    }

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

    await saveWordProgress(
        progress
    );

    await recordActivity();
}

async function getDueWords(
    progress
) {
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

function calculateAverageMastery(
    progress
) {
    const values =
        Object.values(progress)
            .map(
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

function calculateAccuracy(
    progress
) {
    let total = 0;
    let correct = 0;

    Object.values(progress)
        .forEach(
            (item) => {
                total +=
                    item.totalReviews || 0;

                correct +=
                    item.correctReviews || 0;
            }
        );

    if (!total) {
        return null;
    }

    return Math.round(
        (correct / total) * 100
    );
}

function renderAnalyticsList(
    containerId,
    items,
    emptyText
) {
    const container =
        document.getElementById(
            containerId
        );

    container.innerHTML =
        "";

    if (!items.length) {
        const empty =
            document.createElement(
                "div"
            );

        empty.className =
            "empty-state";

        empty.textContent =
            emptyText;

        container.appendChild(
            empty
        );

        return;
    }

    items.forEach(
        (item) => {
            const row =
                document.createElement(
                    "div"
                );

            row.className =
                "analytics-item";

            const word =
                document.createElement(
                    "span"
                );

            word.className =
                "analytics-word";

            word.textContent =
                item.word;

            const right =
                document.createElement(
                    "div"
                );

            right.className =
                "analytics-right";

            const bar =
                document.createElement(
                    "div"
                );

            bar.className =
                "analytics-bar";

            const fill =
                document.createElement(
                    "div"
                );

            fill.className =
                "analytics-bar-fill";

            fill.style.width =
                `${item.score}%`;

            bar.appendChild(fill);

            const score =
                document.createElement(
                    "span"
                );

            score.className =
                "analytics-score";

            score.textContent =
                `${item.score}%`;

            right.appendChild(bar);
            right.appendChild(score);

            row.appendChild(word);
            row.appendChild(right);

            container.appendChild(row);
        }
    );
}

async function renderDashboard(
    progress
) {
    const entries =
        Object.values(progress);

    const total =
        entries.length;

    const mastered =
        entries.filter(
            (item) =>
                (item.masteryScore || 0) >=
                85
        ).length;

    const reviews =
        entries.reduce(
            (sum, item) =>
                sum +
                (item.totalReviews || 0),
            0
        );

    const accuracy =
        calculateAccuracy(
            progress
        );

    const history =
        await getActivityHistory();

    const streak =
        calculateStreak(history);

    const average =
        calculateAverageMastery(
            progress
        );

    document.getElementById(
        "total-words"
    ).textContent =
        total;

    document.getElementById(
        "mastered-words"
    ).textContent =
        mastered;

    document.getElementById(
        "total-reviews"
    ).textContent =
        reviews;

    document.getElementById(
        "accuracy"
    ).textContent =
        accuracy === null
            ? "—"
            : `${accuracy}%`;

    document.getElementById(
        "streak"
    ).textContent =
        streak;

    document.getElementById(
        "active-days"
    ).textContent =
        history.length;

    document.getElementById(
        "mastery-score"
    ).textContent =
        average === null
            ? "—"
            : `${average}%`;

    const learning =
        entries.filter(
            (item) =>
                (item.masteryScore || 0) < 60
        ).length;

    const familiar =
        entries.filter(
            (item) =>
                (item.masteryScore || 0) >= 60 &&
                (item.masteryScore || 0) < 85
        ).length;

    const masteredCount =
        entries.filter(
            (item) =>
                (item.masteryScore || 0) >= 85
        ).length;

    document.getElementById(
        "learning-count"
    ).textContent =
        learning;

    document.getElementById(
        "familiar-count"
    ).textContent =
        familiar;

    document.getElementById(
        "mastered-count"
    ).textContent =
        masteredCount;

    const denominator =
        Math.max(1, total);

    document.getElementById(
        "learning-fill"
    ).style.width =
        `${(learning / denominator) * 100}%`;

    document.getElementById(
        "familiar-fill"
    ).style.width =
        `${(familiar / denominator) * 100}%`;

    document.getElementById(
        "mastered-fill"
    ).style.width =
        `${(masteredCount / denominator) * 100}%`;

    const scores =
        entries.map(
            (item) => ({
                word: item.word,
                score:
                    item.masteryScore || 0
            })
        );

    renderAnalyticsList(
        "weakest-container",
        [...scores]
            .sort(
                (a, b) =>
                    a.score - b.score
            )
            .slice(0, 5),
        "Your weakest words will appear here."
    );

    renderAnalyticsList(
        "strongest-container",
        [...scores]
            .sort(
                (a, b) =>
                    b.score - a.score
            )
            .slice(0, 5),
        "Your strongest words will appear here."
    );
}

function renderDailyWords(
    dailyData,
    progress
) {
    const container =
        document.getElementById(
            "words-container"
        );

    container.innerHTML =
        "";

    dailyData.words.forEach(
        (item, index) => {
            const word =
                getWordDataByName(
                    item.word,
                    progress
                );

            if (!word) {
                return;
            }

            container.appendChild(
                createWordCard(
                    word,
                    item,
                    index,
                    dailyData
                )
            );
        }
    );
}

async function renderToday() {
    const progress =
        await getWordProgress();

    const dailyData =
        await getDailyData(
            progress
        );

    renderDailyWords(
        dailyData,
        progress
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

    const revisionCount =
        document.getElementById(
            "revision-count"
        );

    revisionContainer.innerHTML =
        "";

    revisionCount.textContent =
        dueWords.length;

    if (!dueWords.length) {
        revisionSection.classList.add(
            "hidden"
        );
    } else {
        revisionSection.classList.remove(
            "hidden"
        );

        dueWords.forEach(
            (item) => {
                const card =
                    createRevisionCard(
                        item,
                        progress[item.word],
                        async () => {
                            await renderAll();
                        }
                    );

                revisionContainer.appendChild(
                    card
                );
            }
        );
    }

    const learned =
        dailyData.words.filter(
            (item) => item.learned
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
        `${learned}/3 new words`;

    document.getElementById(
        "progress-bar"
    ).style.width =
        `${(learned / 3) * 100}%`;

    document.getElementById(
        "completion-message"
    ).classList.toggle(
        "hidden",
        learned !== 3
    );
}

async function getAISettings() {
    const result =
        await chrome.storage.local.get([
            STORAGE_KEYS.aiSettings
        ]);

    return (
        result.aiSettings || {
            variant: "global",
            focus: "mixed",
            difficulty: "intermediate"
        }
    );
}

async function saveAISettings() {
    const settings = {
        variant:
            document.getElementById(
                "variant-select"
            ).value,

        focus:
            document.getElementById(
                "focus-select"
            ).value,

        difficulty:
            document.getElementById(
                "difficulty-select"
            ).value
    };

    await chrome.storage.local.set({
        [STORAGE_KEYS.aiSettings]:
            settings
    });

    return settings;
}

function renderAILesson(
    lesson
) {
    const container =
        document.getElementById(
            "ai-lesson"
        );

    container.innerHTML =
        "";

    if (
        !lesson ||
        !Array.isArray(
            lesson.words
        )
    ) {
        return;
    }

    lesson.words
        .slice(0, 3)
        .forEach(
            (word) => {
                const card =
                    document.createElement(
                        "div"
                    );

                card.className =
                    "ai-word-card";

                const title =
                    document.createElement(
                        "div"
                    );

                title.className =
                    "ai-word";

                title.textContent =
                    word.word;

                const definition =
                    document.createElement(
                        "div"
                    );

                definition.className =
                    "ai-definition";

                definition.textContent =
                    word.meaning;

                const details =
                    document.createElement(
                        "div"
                    );

                details.className =
                    "ai-line";

                details.textContent =
                    `Synonym: ${word.synonym || "—"} • Antonym: ${word.antonym || "—"}`;

                const business =
                    document.createElement(
                        "div"
                    );

                business.className =
                    "ai-example";

                business.textContent =
                    `Workplace example: ${word.workplaceExample}`;

                card.appendChild(title);
                card.appendChild(
                    definition
                );
                card.appendChild(
                    details
                );
                card.appendChild(
                    business
                );

                container.appendChild(
                    card
                );
            }
        );

    container.classList.remove(
        "hidden"
    );
}

async function generateAILesson() {
    const button =
        document.getElementById(
            "generate-lesson"
        );

    const status =
        document.getElementById(
            "lesson-status"
        );

    button.disabled =
        true;

    status.classList.remove(
        "hidden"
    );

    status.textContent =
        "Generating your personalized lesson...";

    try {
        const settings =
            await saveAISettings();

        const progress =
            await getWordProgress();

        const weakWords =
            Object.values(progress)
                .sort(
                    (a, b) =>
                        (a.masteryScore || 0) -
                        (b.masteryScore || 0)
                )
                .slice(0, 8)
                .map(
                    (item) =>
                        item.word
                );

        const response =
            await fetch(
                `${BACKEND_URL}/api/daily-lesson`,
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({
                        variant:
                            settings.variant,

                        focus:
                            settings.focus,

                        difficulty:
                            settings.difficulty,

                        weakWords
                    })
                }
            );

        if (!response.ok) {
            throw new Error(
                `Backend returned ${response.status}`
            );
        }

        const lesson =
            await response.json();

        await chrome.storage.local.set({
            [STORAGE_KEYS.aiDailyLesson]:
            {
                date:
                    getDateKey(),

                lesson
            }
        });

        renderAILesson(
            lesson
        );

        status.textContent =
            "Your AI lesson is ready.";
    } catch (error) {
        console.error(
            "AI lesson error:",
            error
        );

        status.textContent =
            "AI is unavailable right now. Your local vocabulary system is still working.";
    } finally {
        button.disabled =
            false;
    }
}

async function explainPhrase() {
    const input =
        document.getElementById(
            "phrase-input"
        );

    const resultBox =
        document.getElementById(
            "phrase-result"
        );

    const phrase =
        input.value.trim();

    if (!phrase) {
        return;
    }

    resultBox.classList.remove(
        "hidden"
    );

    resultBox.innerHTML =
        "Explaining...";

    try {
        const settings =
            await getAISettings();

        const response =
            await fetch(
                `${BACKEND_URL}/api/explain`,
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({
                        phrase,

                        variant:
                            settings.variant,

                        context:
                            "professional workplace or client meeting"
                    })
                }
            );

        if (!response.ok) {
            throw new Error(
                `Backend returned ${response.status}`
            );
        }

        const data =
            await response.json();

        resultBox.innerHTML = `
      <div class="phrase-result-title">
        ${escapeHtml(
            data.phrase
        )}
      </div>

      <div class="phrase-result-meaning">
        ${escapeHtml(
            data.meaning
        )}
      </div>

      <div class="phrase-result-example">
        Example:
        ${escapeHtml(
            data.example
        )}
      </div>
    `;
    } catch (error) {
        console.error(
            "Phrase explanation error:",
            error
        );

        resultBox.textContent =
            "AI explanation is unavailable. Make sure the backend is running.";
    }
}

function escapeHtml(
    value
) {
    const div =
        document.createElement(
            "div"
        );

    div.textContent =
        value || "";

    return div.innerHTML;
}

function initializeTabs() {
    document
        .querySelectorAll(
            ".tab"
        )
        .forEach(
            (button) => {
                button.addEventListener(
                    "click",
                    () => {
                        document
                            .querySelectorAll(
                                ".tab"
                            )
                            .forEach(
                                (item) =>
                                    item.classList.remove(
                                        "active"
                                    )
                            );

                        document
                            .querySelectorAll(
                                ".tab-content"
                            )
                            .forEach(
                                (section) =>
                                    section.classList.remove(
                                        "active"
                                    )
                            );

                        button.classList.add(
                            "active"
                        );

                        document
                            .getElementById(
                                `${button.dataset.tab}-tab`
                            )
                            .classList.add(
                                "active"
                            );
                    }
                );
            }
        );
}

async function initializeAISettings() {
    const settings =
        await getAISettings();

    document.getElementById(
        "variant-select"
    ).value =
        settings.variant;

    document.getElementById(
        "focus-select"
    ).value =
        settings.focus;

    document.getElementById(
        "difficulty-select"
    ).value =
        settings.difficulty;
}

function initializeDate() {
    document.getElementById(
        "date"
    ).textContent =
        getFormattedDate();
}

async function renderAll() {
    await renderToday();

    await renderDashboard(
        await getWordProgress()
    );
}

async function initialize() {
    try {
        initializeDate();
        initializeTabs();

        await initializeAISettings();

        document
            .getElementById(
                "generate-lesson"
            )
            .addEventListener(
                "click",
                generateAILesson
            );

        document
            .getElementById(
                "explain-phrase"
            )
            .addEventListener(
                "click",
                explainPhrase
            );

        await renderAll();
    } catch (error) {
        console.error(
            "LexiLoop initialization error:",
            error
        );
    }
}

document.addEventListener(
    "DOMContentLoaded",
    initialize
);