const VOCABULARY_CACHE_KEY = "vocabularyCache";
const DISCOVERY_CACHE_KEY = "discoveryCache";

const VOCABULARY_CACHE_LIMIT = 500;
const DISCOVERY_CACHE_LIMIT = 120;

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
    "leadership"
];

function normalizeWordData(data) {
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
        Object.entries(cache).slice(
            -VOCABULARY_CACHE_LIMIT
        );

    await chrome.storage.local.set({
        [VOCABULARY_CACHE_KEY]:
            Object.fromEntries(entries)
    });
}

async function fetchWord(word) {
    const normalizedWord =
        String(word)
            .trim()
            .toLowerCase();

    if (!normalizedWord) {
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
        console.warn(
            "Dictionary lookup failed:",
            normalizedWord,
            error
        );

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

async function saveDiscoveryCache(
    words
) {
    const uniqueWords = [
        ...new Set(
            words
                .map(
                    (word) =>
                        String(word)
                            .trim()
                            .toLowerCase()
                )
                .filter(Boolean)
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

    if (
        existing.length >= 30
    ) {
        return existing;
    }

    const discovered = [
        ...existing
    ];

    for (
        const seed of DISCOVERY_SEEDS
    ) {
        try {
            const response =
                await fetch(
                    `https://api.datamuse.com/words?ml=${encodeURIComponent(
                        seed
                    )}&max=15`
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
                        item.word
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
                seed,
                error
            );
        }
    }

    await saveDiscoveryCache(
        discovered
    );

    return [
        ...new Set(
            discovered
        )
    ];
}

function getFallbackWords() {
    return FALLBACK_WORDS
        .map(
            (word) =>
                WORDS.find(
                    (item) =>
                        item.word === word
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

    Object.values(
        cache
    ).forEach(
        (word) => {
            if (word) {
                combined.push(word);
            }
        }
    );

    let fetchedCount = 0;

    for (
        const candidate of candidates
    ) {
        const normalized =
            String(candidate)
                .trim()
                .toLowerCase();

        if (
            !normalized ||
            cache[normalized]
        ) {
            continue;
        }

        const word =
            await fetchWord(
                normalized
            );

        if (word) {
            combined.push(word);
            fetchedCount += 1;
        }

        if (
            fetchedCount >= 15
        ) {
            break;
        }
    }

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
                    word.word
                        .toLowerCase(),
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
        (dayNumber * count) %
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