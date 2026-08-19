const STORAGE_KEYS = {
    wordProgress: "wordProgress",
    activityHistory: "activityHistory"
};

function getDateKey(
    date = new Date()
) {
    const year =
        date.getFullYear();

    const month =
        String(
            date.getMonth() + 1
        ).padStart(
            2,
            "0"
        );

    const day =
        String(
            date.getDate()
        ).padStart(
            2,
            "0"
        );

    return `${year}-${month}-${day}`;
}

function getFormattedDate() {
    return new Intl.DateTimeFormat(
        "en-US",
        {
            weekday: "long",
            month: "long",
            day: "numeric",
            year: "numeric"
        }
    ).format(
        new Date()
    );
}

async function getProgress() {
    const result =
        await chrome.storage.local.get([
            STORAGE_KEYS.wordProgress
        ]);

    return (
        result.wordProgress ||
        {}
    );
}

async function getActivityHistory() {
    const result =
        await chrome.storage.local.get([
            STORAGE_KEYS.activityHistory
        ]);

    return (
        result.activityHistory ||
        []
    );
}

function calculateAverageMastery(
    entries
) {
    if (!entries.length) {
        return null;
    }

    const total =
        entries.reduce(
            (sum, item) =>
                sum +
                (item.masteryScore || 0),
            0
        );

    return Math.round(
        total /
        entries.length
    );
}

function calculateAccuracy(
    entries
) {
    const totalReviews =
        entries.reduce(
            (sum, item) =>
                sum +
                (item.totalReviews || 0),
            0
        );

    const correctReviews =
        entries.reduce(
            (sum, item) =>
                sum +
                (item.correctReviews || 0),
            0
        );

    if (
        totalReviews === 0
    ) {
        return null;
    }

    return Math.round(
        (
            correctReviews /
            totalReviews
        ) * 100
    );
}

function calculateStreak(
    history
) {
    if (!history.length) {
        return 0;
    }

    const dates =
        new Set(
            history
        );

    let cursor =
        new Date();

    let streak = 0;

    while (
        dates.has(
            getDateKey(
                cursor
            )
        )
    ) {
        streak += 1;

        cursor.setDate(
            cursor.getDate() - 1
        );
    }

    return streak;
}

function renderList(
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

    if (
        items.length === 0
    ) {
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
                "word-row";

            const name =
                document.createElement(
                    "span"
                );

            name.className =
                "word-name";

            name.textContent =
                item.word;

            const right =
                document.createElement(
                    "div"
                );

            right.className =
                "word-right";

            const bar =
                document.createElement(
                    "div"
                );

            bar.className =
                "word-bar";

            const fill =
                document.createElement(
                    "div"
                );

            fill.className =
                "word-bar-fill";

            fill.style.width =
                `${item.score}%`;

            bar.appendChild(
                fill
            );

            const score =
                document.createElement(
                    "span"
                );

            score.className =
                "word-score";

            score.textContent =
                `${item.score}%`;

            right.appendChild(
                bar
            );

            right.appendChild(
                score
            );

            row.appendChild(
                name
            );

            row.appendChild(
                right
            );

            container.appendChild(
                row
            );
        }
    );
}

function formatDate(
    dateKey
) {
    if (!dateKey) {
        return "—";
    }

    const today =
        getDateKey();

    if (
        dateKey === today
    ) {
        return "Today";
    }

    const yesterday =
        new Date();

    yesterday.setDate(
        yesterday.getDate() - 1
    );

    if (
        dateKey ===
        getDateKey(
            yesterday
        )
    ) {
        return "Yesterday";
    }

    return new Intl.DateTimeFormat(
        "en-US",
        {
            month: "short",
            day: "numeric",
            year: "numeric"
        }
    ).format(
        new Date(
            `${dateKey}T00:00:00`
        )
    );
}

function renderRecent(
    entries
) {
    const container =
        document.getElementById(
            "recent-container"
        );

    container.innerHTML =
        "";

    const recent =
        entries
            .filter(
                (item) =>
                    item.lastReviewed
            )
            .sort(
                (a, b) =>
                    new Date(
                        `${b.lastReviewed}T00:00:00`
                    ) -
                    new Date(
                        `${a.lastReviewed}T00:00:00`
                    )
            )
            .slice(
                0,
                10
            );

    if (
        recent.length === 0
    ) {
        const empty =
            document.createElement(
                "div"
            );

        empty.className =
            "empty-state";

        empty.textContent =
            "Your recent revisions will appear here.";

        container.appendChild(
            empty
        );

        return;
    }

    recent.forEach(
        (item) => {
            const row =
                document.createElement(
                    "div"
                );

            row.className =
                "recent-row";

            const word =
                document.createElement(
                    "span"
                );

            word.className =
                "recent-word";

            word.textContent =
                item.word;

            const date =
                document.createElement(
                    "span"
                );

            date.className =
                "recent-date";

            date.textContent =
                formatDate(
                    item.lastReviewed
                );

            row.appendChild(
                word
            );

            row.appendChild(
                date
            );

            container.appendChild(
                row
            );
        }
    );
}

async function render() {
    const progress =
        await getProgress();

    const history =
        await getActivityHistory();

    const entries =
        Object.values(
            progress
        );

    const totalWords =
        entries.length;

    const masteredWords =
        entries.filter(
            (item) =>
                (item.masteryScore || 0) >= 85
        ).length;

    const totalReviews =
        entries.reduce(
            (sum, item) =>
                sum +
                (item.totalReviews || 0),
            0
        );

    const average =
        calculateAverageMastery(
            entries
        );

    const accuracy =
        calculateAccuracy(
            entries
        );

    const streak =
        calculateStreak(
            history
        );

    document.getElementById(
        "date"
    ).textContent =
        getFormattedDate();

    document.getElementById(
        "average-mastery"
    ).textContent =
        average === null
            ? "—"
            : `${average}%`;

    document.getElementById(
        "total-words"
    ).textContent =
        totalWords;

    document.getElementById(
        "mastered-words"
    ).textContent =
        masteredWords;

    document.getElementById(
        "total-reviews"
    ).textContent =
        totalReviews;

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

    const mastered =
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
        mastered;

    const denominator =
        Math.max(
            1,
            totalWords
        );

    document.getElementById(
        "learning-fill"
    ).style.width =
        `${(
            learning /
            denominator
        ) * 100}%`;

    document.getElementById(
        "familiar-fill"
    ).style.width =
        `${(
            familiar /
            denominator
        ) * 100}%`;

    document.getElementById(
        "mastered-fill"
    ).style.width =
        `${(
            mastered /
            denominator
        ) * 100}%`;

    const scored =
        entries.map(
            (item) => ({
                word:
                    item.word,

                score:
                    item.masteryScore || 0
            })
        );

    renderList(
        "weakest-container",
        [...scored]
            .sort(
                (a, b) =>
                    a.score -
                    b.score
            )
            .slice(
                0,
                7
            ),
        "Your weakest words will appear here as you build your vocabulary."
    );

    renderList(
        "strongest-container",
        [...scored]
            .sort(
                (a, b) =>
                    b.score -
                    a.score
            )
            .slice(
                0,
                7
            ),
        "Your strongest words will appear here as you build mastery."
    );

    renderRecent(
        entries
    );
}

document.addEventListener(
    "DOMContentLoaded",
    async () => {
        await render();
    }
);