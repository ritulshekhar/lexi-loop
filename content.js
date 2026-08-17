const CONTENT_STORAGE_KEYS = {
    lastPromptTime:
        "lastContextPromptTime",

    dismissedDate:
        "contextPromptDismissedDate"
};

const PROMPT_COOLDOWN =
    30 * 60 * 1000;

const MIN_PAGE_TIME =
    8000;

let pageStartedAt =
    Date.now();

let promptShown =
    false;

function getDateKey(
    date = new Date()
) {
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

async function getProgress() {
    const result =
        await chrome.storage.local.get([
            "wordProgress"
        ]);

    return (
        result.wordProgress || {}
    );
}

function getDueWords(
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
                        ?.masteryScore || 0;

                const bScore =
                    progress[b.word]
                        ?.masteryScore || 0;

                return (
                    aScore -
                    bScore
                );
            }
        );
}

async function canShowPrompt() {
    const result =
        await chrome.storage.local.get([
            CONTENT_STORAGE_KEYS.lastPromptTime,
            CONTENT_STORAGE_KEYS.dismissedDate
        ]);

    const lastPromptTime =
        result[
        CONTENT_STORAGE_KEYS.lastPromptTime
        ];

    const dismissedDate =
        result[
        CONTENT_STORAGE_KEYS.dismissedDate
        ];

    const today =
        getDateKey();

    if (
        dismissedDate === today
    ) {
        return false;
    }

    if (
        lastPromptTime &&
        Date.now() -
        lastPromptTime <
        PROMPT_COOLDOWN
    ) {
        return false;
    }

    return true;
}

function createPrompt(
    word
) {
    if (promptShown) {
        return;
    }

    promptShown = true;

    const wrapper =
        document.createElement(
            "div"
        );

    wrapper.id =
        "lexiloop-context-prompt";

    wrapper.innerHTML = `
    <div class="lexiloop-prompt-inner">

      <div class="lexiloop-prompt-top">

        <div>

          <div class="lexiloop-prompt-brand">
            LexiLoop
          </div>

          <div class="lexiloop-prompt-label">
            QUICK REVISION
          </div>

        </div>

        <button
          class="lexiloop-close"
          aria-label="Dismiss"
        >
          ×
        </button>

      </div>

      <div class="lexiloop-word">
        ${escapeHtml(
        word.word
    )}
      </div>

      <div class="lexiloop-question">
        Do you remember what this means?
      </div>

      <div
        id="lexiloop-answer"
        class="lexiloop-answer"
      >

        <div class="lexiloop-answer-meaning">
          ${escapeHtml(
        word.meaning
    )}
        </div>

        <div class="lexiloop-answer-detail">
          Synonym:
          <strong>
            ${escapeHtml(
        word.synonym
    )}
          </strong>
        </div>

        <div class="lexiloop-answer-detail">
          Antonym:
          <strong>
            ${escapeHtml(
        word.antonym
    )}
          </strong>
        </div>

      </div>

      <div class="lexiloop-actions">

        <button
          id="lexiloop-reveal"
          class="lexiloop-button primary"
        >
          Show Answer
        </button>

        <button
          id="lexiloop-dismiss"
          class="lexiloop-button secondary"
        >
          Maybe Later
        </button>

      </div>

    </div>
  `;

    document.documentElement.appendChild(
        wrapper
    );

    const closeButton =
        wrapper.querySelector(
            ".lexiloop-close"
        );

    const revealButton =
        wrapper.querySelector(
            "#lexiloop-reveal"
        );

    const dismissButton =
        wrapper.querySelector(
            "#lexiloop-dismiss"
        );

    const answer =
        wrapper.querySelector(
            "#lexiloop-answer"
        );

    closeButton.addEventListener(
        "click",
        async () => {
            await dismissPrompt();
        }
    );

    revealButton.addEventListener(
        "click",
        () => {
            answer.classList.add(
                "visible"
            );

            revealButton.textContent =
                "Answer Revealed";

            revealButton.disabled =
                true;
        }
    );

    dismissButton.addEventListener(
        "click",
        async () => {
            await dismissPrompt();
        }
    );

    chrome.storage.local.set({
        [CONTENT_STORAGE_KEYS.lastPromptTime]:
            Date.now()
    });
}

async function dismissPrompt() {
    await chrome.storage.local.set({
        [CONTENT_STORAGE_KEYS.dismissedDate]:
            getDateKey()
    });

    removePrompt();
}

function removePrompt() {
    const existing =
        document.getElementById(
            "lexiloop-context-prompt"
        );

    if (existing) {
        existing.remove();
    }

    promptShown =
        false;
}

function escapeHtml(
    value
) {
    const div =
        document.createElement(
            "div"
        );

    div.textContent =
        value;

    return div.innerHTML;
}

async function maybeShowPrompt() {
    if (promptShown) {
        return;
    }

    if (
        Date.now() -
        pageStartedAt <
        MIN_PAGE_TIME
    ) {
        return;
    }

    if (
        !document.body ||
        document.visibilityState !==
        "visible"
    ) {
        return;
    }

    const canShow =
        await canShowPrompt();

    if (!canShow) {
        return;
    }

    const progress =
        await getProgress();

    const dueWords =
        getDueWords(
            progress
        );

    if (
        dueWords.length === 0
    ) {
        return;
    }

    createPrompt(
        dueWords[0]
    );
}

async function initialize() {
    if (!document.body) {
        return;
    }

    setTimeout(
        maybeShowPrompt,
        MIN_PAGE_TIME
    );
}

document.addEventListener(
    "visibilitychange",
    () => {
        if (
            document.visibilityState ===
            "visible"
        ) {
            maybeShowPrompt();
        }
    }
);

if (
    document.readyState ===
    "loading"
) {
    document.addEventListener(
        "DOMContentLoaded",
        initialize
    );
} else {
    initialize();
}