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

    return Object.values(
        progress
    )
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

function removeElement(
    id
) {
    const existing =
        document.getElementById(
            id
        );

    if (existing) {
        existing.remove();
    }
}

function createRevisionPrompt(
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
          aria-label="Close"
        >
          ×
        </button>

      </div>

      <div class="lexiloop-word">
        ${escapeHtml(word.word)}
      </div>

      <div class="lexiloop-question">
        Do you remember what this means?
      </div>

      <div
        id="lexiloop-answer"
        class="lexiloop-answer"
      >
        <div class="lexiloop-answer-meaning">
          ${escapeHtml(word.meaning)}
        </div>

        <div class="lexiloop-answer-detail">
          Synonym:
          <strong>
            ${escapeHtml(
        word.synonym || "—"
    )}
          </strong>
        </div>

        <div class="lexiloop-answer-detail">
          Antonym:
          <strong>
            ${escapeHtml(
        word.antonym || "—"
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
            dismissRevision
        );

    wrapper
        .querySelector(
            "#lexiloop-dismiss"
        )
        .addEventListener(
            "click",
            dismissRevision
        );

    wrapper
        .querySelector(
            "#lexiloop-reveal"
        )
        .addEventListener(
            "click",
            () => {
                wrapper
                    .querySelector(
                        "#lexiloop-answer"
                    )
                    .classList.add(
                        "visible"
                    );
            }
        );

    chrome.storage.local.set({
        lastContextPromptTime:
            Date.now()
    });
}

async function dismissRevision() {
    await chrome.storage.local.set({
        contextPromptDismissedDate:
            getDateKey()
    });

    removeElement(
        "lexiloop-context-prompt"
    );

    promptShown =
        false;
}

async function maybeShowRevision() {
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

    createRevisionPrompt(
        due[0]
    );
}

async function fetchSelectedWord(
    text
) {
    const normalized =
        text.trim();

    if (!normalized) {
        return null;
    }

    if (
        !/^[a-zA-Z][a-zA-Z' -]{1,60}$/.test(
            normalized
        )
    ) {
        return null;
    }

    try {
        const response =
            await fetch(
                `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(
                    normalized
                )}`
            );

        if (!response.ok) {
            return null;
        }

        const data =
            await response.json();

        if (
            !Array.isArray(data) ||
            !data.length
        ) {
            return null;
        }

        const entry =
            data[0];

        const meaningGroup =
            Array.isArray(
                entry.meanings
            )
                ? entry.meanings[0]
                : null;

        const definition =
            meaningGroup &&
                Array.isArray(
                    meaningGroup.definitions
                )
                ? meaningGroup
                    .definitions[0]
                : null;

        if (
            !definition ||
            !definition.definition
        ) {
            return null;
        }

        const synonyms =
            Array.isArray(
                definition.synonyms
            )
                ? definition.synonyms
                : [];

        const antonyms =
            Array.isArray(
                definition.antonyms
            )
                ? definition.antonyms
                : [];

        const examples =
            Array.isArray(
                meaningGroup.definitions
            )
                ? meaningGroup.definitions
                    .map(
                        (item) =>
                            item.example
                    )
                    .filter(Boolean)
                : [];

        return {
            word:
                entry.word ||
                normalized,

            meaning:
                definition.definition,

            synonym:
                synonyms[0] ||
                "—",

            antonym:
                antonyms[0] ||
                "—",

            example:
                examples[0] ||
                `Try using "${normalized}" in a professional sentence.`
        };
    } catch {
        return null;
    }
}

function createExplanationCard(
    result
) {
    removeElement(
        "lexiloop-selection-card"
    );

    const card =
        document.createElement(
            "div"
        );

    card.id =
        "lexiloop-selection-card";

    card.innerHTML = `
    <div class="lexiloop-selection-inner">

      <div class="lexiloop-selection-top">

        <div>
          <div class="lexiloop-selection-brand">
            LexiLoop
          </div>

          <div class="lexiloop-selection-label">
            QUICK EXPLANATION
          </div>
        </div>

        <button
          class="lexiloop-selection-close"
        >
          ×
        </button>

      </div>

      <div class="lexiloop-selection-word"></div>

      <div class="lexiloop-selection-meaning"></div>

      <div class="lexiloop-selection-detail">
        Synonym:
        <strong class="lexiloop-selection-synonym"></strong>
      </div>

      <div class="lexiloop-selection-detail">
        Antonym:
        <strong class="lexiloop-selection-antonym"></strong>
      </div>

      <div class="lexiloop-selection-example"></div>

    </div>
  `;

    card.querySelector(
        ".lexiloop-selection-word"
    ).textContent =
        result.word;

    card.querySelector(
        ".lexiloop-selection-meaning"
    ).textContent =
        result.meaning;

    card.querySelector(
        ".lexiloop-selection-synonym"
    ).textContent =
        result.synonym;

    card.querySelector(
        ".lexiloop-selection-antonym"
    ).textContent =
        result.antonym;

    card.querySelector(
        ".lexiloop-selection-example"
    ).textContent =
        `Example: ${result.example}`;

    card
        .querySelector(
            ".lexiloop-selection-close"
        )
        .addEventListener(
            "click",
            () => {
                card.remove();
            }
        );

    document.documentElement.appendChild(
        card
    );
}

async function explainSelection(
    text
) {
    removeElement(
        "lexiloop-selection-card"
    );

    const loading =
        document.createElement(
            "div"
        );

    loading.id =
        "lexiloop-selection-card";

    loading.innerHTML = `
    <div class="lexiloop-selection-inner">
      <div class="lexiloop-selection-brand">
        LexiLoop
      </div>

      <div class="lexiloop-selection-label">
        LOOKING UP
      </div>

      <div class="lexiloop-selection-loading">
        ${escapeHtml(text)}
      </div>
    </div>
  `;

    document.documentElement.appendChild(
        loading
    );

    const result =
        await fetchSelectedWord(
            text
        );

    if (!result) {
        loading.innerHTML = `
      <div class="lexiloop-selection-inner">
        <div class="lexiloop-selection-brand">
          LexiLoop
        </div>

        <div class="lexiloop-selection-label">
          NOT FOUND
        </div>

        <div class="lexiloop-selection-loading">
          No dictionary entry was found for
          "${escapeHtml(text)}".
        </div>
      </div>
    `;

        return;
    }

    createExplanationCard(
        result
    );
}

chrome.runtime.onMessage.addListener(
    (
        message
    ) => {
        if (
            message?.type ===
            "EXPLAIN_SELECTION"
        ) {
            explainSelection(
                message.text
            );
        }
    }
);

function initialize() {
    setTimeout(
        maybeShowRevision,
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