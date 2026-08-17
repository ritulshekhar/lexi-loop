const PROMPT_COOLDOWN =
    30 * 60 * 1000;

const MIN_PAGE_TIME =
    8000;

let pageStartedAt =
    Date.now();

let promptShown =
    false;

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

async function canShowPrompt() {
    const result =
        await chrome.storage.local.get([
            "lastContextPromptTime",
            "contextPromptDismissedDate"
        ]);

    if (
        result.contextPromptDismissedDate ===
        getDateKey()
    ) {
        return false;
    }

    if (
        result.lastContextPromptTime &&
        Date.now() -
        result.lastContextPromptTime <
        PROMPT_COOLDOWN
    ) {
        return false;
    }

    return true;
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

function createPrompt(
    word
) {
    if (
        promptShown
    ) {
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

    wrapper
        .querySelector(
            ".lexiloop-close"
        )
        .addEventListener(
            "click",
            () => {
                dismissPrompt();
            }
        );

    wrapper
        .querySelector(
            "#lexiloop-dismiss"
        )
        .addEventListener(
            "click",
            () => {
                dismissPrompt();
            }
        );

    wrapper
        .querySelector(
            "#lexiloop-reveal"
        )
        .addEventListener(
            "click",
            () => {
                const answer =
                    wrapper.querySelector(
                        "#lexiloop-answer"
                    );

                answer.classList.add(
                    "visible"
                );
            }
        );

    chrome.storage.local.set({
        lastContextPromptTime:
            Date.now()
    });
}

async function dismissPrompt() {
    await chrome.storage.local.set({
        contextPromptDismissedDate:
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

async function maybeShowPrompt() {
    if (
        promptShown
    ) {
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

    if (
        !(await canShowPrompt())
    ) {
        return;
    }

    const progress =
        await getProgress();

    const due =
        getDueWords(
            progress
        );

    if (!due.length) {
        return;
    }

    createPrompt(
        due[0]
    );
}

function initialize() {
    setTimeout(
        maybeShowPrompt,
        MIN_PAGE_TIME
    );
}

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