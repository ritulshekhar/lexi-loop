const VOCABULARY_CACHE_KEY = "vocabularyCache";
const VOCABULARY_CACHE_LIMIT = 500;

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

function normalizeWordData(
    data
) {
    if (
        !Array.isArray(data) ||
        !data.length
    ) {
        return null;
    }

    const entry = data[0];

    const meanings =
        Array.isArray(entry.meanings)
            ? entry.meanings
            : [];

    const firstMeaning =
        meanings[0];

    if (!firstMeaning) {
        return null;
    }

    const definitions =
        Array.isArray(
            firstMeaning.definitions
        )
            ? firstMeaning.definitions
            : [];

    const definition =
        definitions[0];

    if (!definition) {
        return null;
    }

    const phonetics =
        Array.isArray(entry.phonetics)
            ? entry.phonetics
            : [];

    const phonetic =
        phonetics.find(
            (item) =>
                item.text
        )?.text || "";

    const synonyms =
        definitions
            .flatMap(
                (item) =>
                    Array.isArray(
                        item.synonyms
                    )
                        ? item.synonyms
                        : []
            )
            .filter(Boolean);

    const antonyms =
        definitions
            .flatMap(
                (item) =>
                    Array.isArray(
                        item.antonyms
                    )
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
        word:
            entry.word,

        pronunciation:
            phonetic,

        partOfSpeech:
            firstMeaning.partOfSpeech ||
            "word",

        meaning:
            definition.definition,

        synonym:
            synonyms[0] || "—",

        antonym:
            antonyms[0] || "—",

        examples:
            examples.length
                ? examples.slice(0, 4)
                : [
                    `We used "${entry.word}" during the discussion.`,
                    `She explained the meaning clearly to the team.`,
                    `The word appeared in the client conversation.`,
                    `This is a useful word for professional communication.`
                ],

        source:
            "dictionary"
    };
}

async function getVocabularyCache() {
    const result =
        await chrome.storage.local.get(
            [VOCABULARY_CACHE_KEY]
        );

    return (
        result[
        VOCABULARY_CACHE_KEY
        ] || {}
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

async function fetchWord(
    word
) {
    const cache =
        await getVocabularyCache();

    const cached =
        cache[
        word.toLowerCase()
        ];

    if (cached) {
        return cached;
    }

    try {
        const response =
            await fetch(
                `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`
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

        cache[
            word.toLowerCase()
        ] = normalized;

        await saveVocabularyCache(
            cache
        );

        return normalized;
    } catch (error) {
        console.warn(
            "Vocabulary lookup failed:",
            error
        );

        return null;
    }
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

async function getAvailableVocabulary() {
    const cache =
        await getVocabularyCache();

    const cachedWords =
        Object.values(cache);

    const fallback =
        getFallbackWords();

    const combined =
        [
            ...cachedWords,
            ...fallback
        ];

    const unique =
        new Map();

    combined.forEach(
        (item) => {
            if (
                item &&
                item.word
            ) {
                unique.set(
                    item.word.toLowerCase(),
                    item
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
        await getAvailableVocabulary();

    const unseen =
        vocabulary.filter(
            (word) =>
                !progress[word.word]
        );

    if (
        unseen.length >= count
    ) {
        const day =
            Math.floor(
                Date.now() /
                86400000
            );

        const start =
            (day * count) %
            unseen.length;

        return Array.from(
            { length: count },
            (_, index) =>
                unseen[
                (start + index) %
                unseen.length
                ]
        );
    }

    const fallback =
        getFallbackWords()
            .filter(
                (word) =>
                    !progress[word.word]
            );

    return fallback.slice(
        0,
        count
    );
}

async function discoverWord(
    word
) {
    return fetchWord(
        word.trim()
    );
}