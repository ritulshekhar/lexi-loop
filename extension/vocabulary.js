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
    "career"
];

const BLOCKED_CANDIDATES = new Set([
    "biz",
    "app",
    "apps",
    "web",
    "tech",
    "info",
    "etc",
    "ok",
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
    "nothing"
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

    if (!/^[a-z]+(?:'[a-z]+)?$/.test(normalized)) {
        return false;
    }

    if (BLOCKED_CANDIDATES.has(normalized)) {
        return false;
    }

    if (COMMON_FUNCTION_WORDS.has(normalized)) {
        return false;
    }

    return true;
}

function scoreCandidate(word) {
    const normalized =
        normalizeCandidate(word);

    let score = 0;

    if (normalized.length >= 6) {
        score += 2;
    }

    if (normalized.length >= 8) {
        score += 1;
    }

    if (
        normalized.includes("able") ||
        normalized.includes("ive") ||
        normalized.includes("ous") ||
        normalized.includes("ful") ||
        normalized.includes("ment") ||
        normalized.includes("tion")
    ) {
        score += 1;
    }

    return score;
}

function normalizeWordData(data) {
    if (
        !Array.isArray(data) ||
        data.length === 0
    ) {
        return null;
    }

    const entry = data[0];

    const meanings = Array.isArray(entry.meanings)
        ? entry.meanings
        : [];

    if (!meanings.length) {
        return null;
    }

    const firstMeaning = meanings[0];

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

    const phonetics = Array.isArray(entry.phonetics)
        ? entry.phonetics
        : [];

    const pronunciation =
        phonetics.find(
            (item) =>
                item &&
                item.text
        )?.text || "";

    const synonyms = definitions
        .flatMap(
            (item) =>
                Array.isArray(item.synonyms)
                    ? item.synonyms
                    : []
        )
        .filter(Boolean);

    const antonyms = definitions
        .flatMap(
            (item) =>
                Array.isArray(item.antonyms)
                    ? item.antonyms
                    : []
        )
        .filter(Boolean);

    const examples = definitions
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

async function saveVocabularyCache(cache) {
    const entries =
        Object.entries(cache)
            .slice(
                -VOCABULARY_CACHE_LIMIT
            );

    await chrome.storage.local.set({
        [VOCABULARY_CACHE_KEY]:
            Object.fromEntries(entries)
    });
}

async function fetchWord(word) {
    const normalizedWord =
        normalizeCandidate(word);

    if (
        !isValidWordCandidate(
            normalizedWord
        )
    ) {
        return null;
    }

    const cache =
        await getVocabularyCache();

    if (
        cache[normalizedWord]
    ) {
        return cache[normalizedWord];
    }

    try {
        const response =
            await fetch(
                `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(
                    normalizedWord
                )}`
            );

        if (!response.ok) {
            return null;
        }

        const data =
            await response.json();

        const normalized =
            normalizeWordData(
                data
            );

        if (!normalized) {
            return null;
        }

        cache[normalizedWord] =
            normalized;

        await saveVocabularyCache(
            cache
        );

        return normalized;
    } catch (error) {
        return null;
    }
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

async function saveDiscoveryCache(words) {
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
        } catch (error) {
            console.warn(
                "Candidate discovery failed:",
                seed
            );
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
                combined.push(word);
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

    const fetched =
        await Promise.all(
            candidatesToFetch.map(
                (candidate) =>
                    fetchWord(candidate)
            )
        );

    fetched.forEach(
        (word) => {
            if (word) {
                combined.push(word);
            }
        }
    );

    getFallbackWords().forEach(
        (word) => {
            combined.push(word);
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
        vocabulary.filter(
            (word) =>
                !progress[word.word]
        );

    if (
        unseen.length === 0
    ) {
        return [];
    }

    if (
        unseen.length <= count
    ) {
        return unseen;
    }

    const dayNumber =
        Math.floor(
            Date.now() / 86400000
        );

    const startIndex =
        (
            dayNumber * count
        ) %
        unseen.length;

    return Array.from(
        {
            length: count
        },
        (_, index) =>
            unseen[
            (
                startIndex +
                index
            ) %
            unseen.length
            ]
    );
}

async function discoverWord(word) {
    return fetchWord(word);
}