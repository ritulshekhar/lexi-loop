const VOCABULARY_CACHE_KEY = "vocabularyCache";
const DISCOVERY_CACHE_KEY = "discoveryCache";

const VOCABULARY_CACHE_LIMIT = 500;
const DISCOVERY_CACHE_LIMIT = 150;

const FALLBACK_WORDS = [
    "concise",
    "feasible",
    "clarify",
    "leverage",
    "articulate",
    "proactive",
    "comprehensive",
    "tentative",
    "ambiguous",
    "substantial",
    "facilitate",
    "streamline",
    "reiterate",
    "discrepancy",
    "pragmatic",
    "versatile",
    "compelling",
    "consensus",
    "initiative",
    "perspective",
    "prioritize",
    "accommodate",
    "anticipate",
    "constraint",
    "resolve",
    "align",
    "stakeholder",
    "actionable",
    "proficient",
    "meticulous",
    "circle back",
    "touch base",
    "on the same page",
    "move forward"
];

const DISCOVERY_SEEDS = [
    "business",
    "meeting",
    "professional",
    "workplace",
    "client",
    "communication",
    "technology",
    "presentation",
    "project",
    "leadership",
    "strategy",
    "management",
    "collaboration",
    "negotiation",
    "career",
    "marketing",
    "finance",
    "planning",
    "performance",
    "organization"
];

const PROFESSIONAL_WORDS = new Set([
    "accountable",
    "adaptable",
    "analytical",
    "articulate",
    "assertive",
    "collaborative",
    "concise",
    "constructive",
    "consistent",
    "credible",
    "decisive",
    "diplomatic",
    "efficient",
    "feasible",
    "flexible",
    "impactful",
    "innovative",
    "logical",
    "measurable",
    "meticulous",
    "objective",
    "pragmatic",
    "proactive",
    "productive",
    "relevant",
    "strategic",
    "substantial",
    "tentative",
    "transparent",
    "versatile",
    "actionable",
    "ambiguous",
    "anticipate",
    "accommodate",
    "clarify",
    "coordinate",
    "delegate",
    "facilitate",
    "implement",
    "prioritize",
    "resolve",
    "streamline",
    "reiterate",
    "negotiate",
    "align",
    "evaluate",
    "optimize",
    "propose",
    "recommend",
    "address",
    "identify",
    "highlight",
    "demonstrate",
    "elaborate",
    "discuss",
    "confirm",
    "escalate",
    "collaborate",
    "communicate",
    "contribute",
    "stakeholder"
]);

const PROFESSIONAL_PATTERNS = [
    "able",
    "ance",
    "ence",
    "ment",
    "tion",
    "sion",
    "tive",
    "ive",
    "ity",
    "ical",
    "al",
    "ary",
    "ory",
    "ous",
    "ful"
];

const BLOCKED_CANDIDATES = new Set([
    "biz",
    "app",
    "apps",
    "web",
    "tech",
    "info",
    "etc",
    "okay",
    "yeah",
    "yep",
    "nope",
    "gonna",
    "wanna",
    "gotta",
    "kinda",
    "sorta",
    "thing",
    "things",
    "stuff",
    "someone",
    "something",
    "anything",
    "everything",
    "nothing",
    "whatever"
]);

const COMMON_FUNCTION_WORDS = new Set([
    "about",
    "after",
    "again",
    "against",
    "almost",
    "already",
    "also",
    "always",
    "another",
    "around",
    "because",
    "before",
    "being",
    "below",
    "between",
    "both",
    "could",
    "during",
    "each",
    "either",
    "enough",
    "every",
    "from",
    "further",
    "having",
    "here",
    "into",
    "itself",
    "just",
    "might",
    "more",
    "most",
    "much",
    "never",
    "often",
    "only",
    "other",
    "over",
    "same",
    "should",
    "since",
    "some",
    "such",
    "than",
    "their",
    "there",
    "these",
    "those",
    "through",
    "under",
    "until",
    "very",
    "where",
    "which",
    "while",
    "with",
    "would",
    "your"
]);

function normalizeCandidate(word) {
    return String(word || "")
        .trim()
        .toLowerCase();
}

function isValidWordCandidate(word) {
    const normalized =
        normalizeCandidate(word);

    if (!normalized) {
        return false;
    }

    if (normalized.length < 5) {
        return false;
    }

    if (normalized.length > 18) {
        return false;
    }

    if (
        !/^[a-z]+(?:'[a-z]+)?$/.test(
            normalized
        )
    ) {
        return false;
    }

    if (
        BLOCKED_CANDIDATES.has(
            normalized
        )
    ) {
        return false;
    }

    if (
        COMMON_FUNCTION_WORDS.has(
            normalized
        )
    ) {
        return false;
    }

    return true;
}

function scoreCandidate(word) {
    const normalized =
        normalizeCandidate(word);

    let score = 0;

    if (
        PROFESSIONAL_WORDS.has(
            normalized
        )
    ) {
        score += 12;
    }

    if (normalized.length >= 6) {
        score += 2;
    }

    if (normalized.length >= 8) {
        score += 2;
    }

    if (
        normalized.length >= 11
    ) {
        score += 1;
    }

    PROFESSIONAL_PATTERNS.forEach(
        (pattern) => {
            if (
                normalized.endsWith(
                    pattern
                )
            ) {
                score += 1;
            }
        }
    );

    if (
        normalized.includes("work") ||
        normalized.includes("client") ||
        normalized.includes("team") ||
        normalized.includes("project") ||
        normalized.includes("manage") ||
        normalized.includes("communicat") ||
        normalized.includes("strateg")
    ) {
        score += 3;
    }

    return score;
}

function normalizeDictionaryData(data) {
    if (
        !Array.isArray(data) ||
        data.length === 0
    ) {
        return null;
    }

    const entry = data[0];

    const meanings = Array.isArray(
        entry.meanings
    )
        ? entry.meanings
        : [];

    if (!meanings.length) {
        return null;
    }

    const firstMeaning =
        meanings[0];

    const definitions = Array.isArray(
        firstMeaning.definitions
    )
        ? firstMeaning.definitions
        : [];

    if (!definitions.length) {
        return null;
    }

    const firstDefinition =
        definitions[0];

    if (
        !firstDefinition.definition
    ) {
        return null;
    }

    const phonetics = Array.isArray(
        entry.phonetics
    )
        ? entry.phonetics
        : [];

    const pronunciation =
        phonetics.find(
            (item) =>
                item &&
                item.text
        )?.text || "";

    const synonyms =
        definitions
            .flatMap(
                (item) =>
                    Array.isArray(item.synonyms)
                        ? item.synonyms
                        : []
            )
            .filter(Boolean);

    const antonyms =
        definitions
            .flatMap(
                (item) =>
                    Array.isArray(item.antonyms)
                        ? item.antonyms
                        : []
            )
            .filter(Boolean);

    const examples =
        definitions
            .map(
                (item) =>
                    item.example
            )
            .filter(Boolean);

    return {
        word: entry.word,

        pronunciation,

        partOfSpeech:
            firstMeaning.partOfSpeech ||
            "word",

        meaning:
            firstDefinition.definition,

        synonym:
            synonyms[0] || "—",

        antonym:
            antonyms[0] || "—",

        examples:
            examples.length > 0
                ? examples.slice(0, 4)
                : [
                    `We used "${entry.word}" during the discussion.`,
                    `She explained the point clearly to the team.`,
                    `The word appeared in a professional conversation.`,
                    `This is useful vocabulary for workplace communication.`
                ],

        source: "dictionary"
    };
}

function normalizeWiktionaryData(
    data,
    requestedWord
) {
    if (
        !data ||
        typeof data !== "object"
    ) {
        return null;
    }

    const entries = Array.isArray(data)
        ? data
        : Array.isArray(data?.data)
            ? data.data
            : [];

    if (!entries.length) {
        return null;
    }

    const entry =
        entries[0];

    const requested =
        normalizeCandidate(
            requestedWord
        );

    let partOfSpeech =
        "word";

    let meaning = "";

    let pronunciation = "";

    let example = "";

    if (
        entry &&
        typeof entry === "object"
    ) {
        partOfSpeech =
            entry.partOfSpeech ||
            entry.pos ||
            entry.part_of_speech ||
            "word";

        pronunciation =
            entry.pronunciation ||
            entry.ipa ||
            entry.pron ||
            "";

        if (
            Array.isArray(
                entry.definitions
            )
        ) {
            const definition =
                entry.definitions.find(
                    (item) =>
                        item &&
                        (
                            item.definition ||
                            item.text
                        )
                );

            if (definition) {
                meaning =
                    definition.definition ||
                    definition.text ||
                    "";

                example =
                    definition.example ||
                    "";
            }
        }

        if (
            !meaning &&
            typeof entry.definition ===
            "string"
        ) {
            meaning =
                entry.definition;
        }

        if (
            !meaning &&
            typeof entry.text ===
            "string"
        ) {
            meaning =
                entry.text;
        }
    }

    if (!meaning) {
        return null;
    }

    return {
        word:
            entry.word ||
            requested,

        pronunciation,

        partOfSpeech,

        meaning,

        synonym:
            "—",

        antonym:
            "—",

        examples:
            example
                ? [
                    example,
                    `The word "${requested}" can be useful in professional communication.`,
                    `Try using "${requested}" in a sentence of your own.`,
                    `You may encounter "${requested}" in meetings or written communication.`
                ]
                : [
                    `The word "${requested}" can be useful in professional communication.`,
                    `You may encounter "${requested}" in meetings or written communication.`,
                    `Try using "${requested}" in a sentence of your own.`,
                    `Review "${requested}" during your next revision.`
                ],

        source: "wiktionary"
    };
}

async function getVocabularyCache() {
    const result =
        await chrome.storage.local.get([
            VOCABULARY_CACHE_KEY
        ]);

    return (
        result[VOCABULARY_CACHE_KEY] ||
        {}
    );
}

async function saveVocabularyCache(
    cache
) {
    const entries =
        Object.entries(cache)
            .slice(
                -VOCABULARY_CACHE_LIMIT
            );

    await chrome.storage.local.set({
        [VOCABULARY_CACHE_KEY]:
            Object.fromEntries(
                entries
            )
    });
}

async function fetchDictionaryWord(
    word
) {
    const normalized =
        normalizeCandidate(word);

    if (
        !isValidWordCandidate(
            normalized
        )
    ) {
        return null;
    }

    const cache =
        await getVocabularyCache();

    if (
        cache[normalized] &&
        cache[normalized].source ===
        "dictionary"
    ) {
        return cache[normalized];
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

        return normalizeDictionaryData(
            data
        );
    } catch {
        return null;
    }
}

async function fetchWiktionaryWord(
    word
) {
    const normalized =
        normalizeCandidate(word);

    if (
        !isValidWordCandidate(
            normalized
        )
    ) {
        return null;
    }

    try {
        const response =
            await fetch(
                `https://en.wiktionary.org/api/rest_v1/page/definition/${encodeURIComponent(
                    normalized
                )}`
            );

        if (!response.ok) {
            return null;
        }

        const data =
            await response.json();

        return normalizeWiktionaryData(
            data,
            normalized
        );
    } catch {
        return null;
    }
}

async function fetchWord(word) {
    const normalized =
        normalizeCandidate(word);

    if (
        !isValidWordCandidate(
            normalized
        )
    ) {
        return null;
    }

    const cache =
        await getVocabularyCache();

    if (
        cache[normalized]
    ) {
        return cache[normalized];
    }

    let result =
        await fetchDictionaryWord(
            normalized
        );

    if (!result) {
        result =
            await fetchWiktionaryWord(
                normalized
            );
    }

    if (!result) {
        return null;
    }

    cache[normalized] =
        result;

    await saveVocabularyCache(
        cache
    );

    return result;
}

async function getDiscoveryCache() {
    const result =
        await chrome.storage.local.get([
            DISCOVERY_CACHE_KEY
        ]);

    return (
        result[DISCOVERY_CACHE_KEY] ||
        []
    );
}

async function saveDiscoveryCache(
    words
) {
    const uniqueWords = [
        ...new Set(
            words
                .map(
                    normalizeCandidate
                )
                .filter(
                    isValidWordCandidate
                )
        )
    ];

    await chrome.storage.local.set({
        [DISCOVERY_CACHE_KEY]:
            uniqueWords.slice(
                0,
                DISCOVERY_CACHE_LIMIT
            )
    });
}

async function discoverCandidateWords() {
    const existing =
        await getDiscoveryCache();

    const validExisting =
        existing.filter(
            isValidWordCandidate
        );

    if (
        validExisting.length >= 50
    ) {
        return validExisting;
    }

    const discovered = [
        ...validExisting
    ];

    for (
        const seed of DISCOVERY_SEEDS
    ) {
        try {
            const response =
                await fetch(
                    `https://api.datamuse.com/words?ml=${encodeURIComponent(
                        seed
                    )}&max=25`
                );

            if (!response.ok) {
                continue;
            }

            const data =
                await response.json();

            data.forEach(
                (item) => {
                    if (
                        item &&
                        isValidWordCandidate(
                            item.word
                        )
                    ) {
                        discovered.push(
                            item.word
                        );
                    }
                }
            );

            if (
                discovered.length >=
                DISCOVERY_CACHE_LIMIT
            ) {
                break;
            }
        } catch {
            continue;
        }
    }

    const ranked =
        [
            ...new Set(
                discovered
                    .map(
                        normalizeCandidate
                    )
                    .filter(
                        isValidWordCandidate
                    )
            )
        ]
            .map(
                (word) => ({
                    word,
                    score:
                        scoreCandidate(word)
                })
            )
            .sort(
                (a, b) =>
                    b.score -
                    a.score
            )
            .map(
                (item) =>
                    item.word
            );

    await saveDiscoveryCache(
        ranked
    );

    return ranked;
}

function getFallbackWords() {
    return FALLBACK_WORDS
        .map(
            (word) =>
                WORDS.find(
                    (item) =>
                        item.word ===
                        word
                )
        )
        .filter(Boolean);
}

async function buildDynamicVocabulary(
    progress
) {
    const cache =
        await getVocabularyCache();

    const candidates =
        await discoverCandidateWords();

    const combined = [];

    Object.values(cache).forEach(
        (word) => {
            if (
                word &&
                word.word
            ) {
                combined.push(
                    word
                );
            }
        }
    );

    const candidatesToFetch =
        candidates
            .filter(
                (candidate) =>
                    !cache[
                    normalizeCandidate(
                        candidate
                    )
                    ]
            )
            .slice(
                0,
                20
            );

    const results =
        await Promise.all(
            candidatesToFetch.map(
                (candidate) =>
                    fetchWord(
                        candidate
                    )
            )
        );

    results.forEach(
        (word) => {
            if (word) {
                combined.push(
                    word
                );
            }
        }
    );

    getFallbackWords().forEach(
        (word) => {
            combined.push(
                word
            );
        }
    );

    const unique =
        new Map();

    combined.forEach(
        (word) => {
            if (
                word &&
                word.word
            ) {
                unique.set(
                    normalizeCandidate(
                        word.word
                    ),
                    word
                );
            }
        }
    );

    return [
        ...unique.values()
    ];
}

async function getWordsForToday(
    progress,
    count = 3
) {
    const vocabulary =
        await buildDynamicVocabulary(
            progress
        );

    const unseen =
        vocabulary
            .filter(
                (word) =>
                    !progress[
                    word.word
                    ]
            )
            .sort(
                (a, b) =>
                    scoreCandidate(
                        b.word
                    ) -
                    scoreCandidate(
                        a.word
                    )
            );

    if (!unseen.length) {
        return [];
    }

    if (
        unseen.length <= count
    ) {
        return unseen;
    }

    const dayNumber =
        Math.floor(
            Date.now() /
            86400000
        );

    const batchSize =
        Math.min(
            12,
            unseen.length
        );

    const batchStart =
        (
            dayNumber * count
        ) %
        batchSize;

    return Array.from(
        {
            length: count
        },
        (_, index) =>
            unseen[
            (
                batchStart +
                index
            ) %
            batchSize
            ]
    );
}

async function discoverWord(
    word
) {
    return fetchWord(
        word
    );
}