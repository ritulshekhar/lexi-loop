const VOCABULARY_CACHE_KEY = "vocabularyCache";
const DISCOVERY_CACHE_KEY = "discoveryCache";
const VOCABULARY_SETTINGS_KEY = "vocabularySettings";

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
    "confirm",
    "escalate",
    "collaborate",
    "communicate",
    "contribute",
    "stakeholder"
]);

const US_TERMS = new Set([
    "prioritize",
    "organization",
    "organize",
    "optimize",
    "analyze",
    "behavior",
    "center",
    "color",
    "customize",
    "emphasize",
    "favor",
    "fulfill",
    "license",
    "localize",
    "maximize",
    "minimize",
    "modeling",
    "program",
    "realize",
    "specialize",
    "standardize",
    "strategize",
    "utilize"
]);

const UK_TERMS = new Set([
    "prioritise",
    "organisation",
    "organise",
    "optimise",
    "analyse",
    "behaviour",
    "centre",
    "colour",
    "customise",
    "emphasise",
    "favour",
    "fulfil",
    "licence",
    "localise",
    "maximise",
    "minimise",
    "modelling",
    "programme",
    "realise",
    "specialise",
    "standardise",
    "strategise",
    "utilise"
]);

const UK_US_EQUIVALENTS = {
    prioritise: "prioritize",
    organisation: "organization",
    organise: "organize",
    optimise: "optimize",
    analyse: "analyze",
    behaviour: "behavior",
    centre: "center",
    colour: "color",
    customise: "customize",
    emphasise: "emphasize",
    favour: "favor",
    fulfil: "fulfill",
    licence: "license",
    localise: "localize",
    maximise: "maximize",
    minimise: "minimize",
    modelling: "modeling",
    programme: "program",
    realise: "realize",
    specialise: "specialize",
    standardise: "standardize",
    strategise: "strategize",
    utilise: "utilize"
};

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

function getDefaultSettings() {
    return {
        variant: "global"
    };
}

async function getVocabularySettings() {
    const result =
        await chrome.storage.local.get([
            VOCABULARY_SETTINGS_KEY
        ]);

    return {
        ...getDefaultSettings(),
        ...(result[VOCABULARY_SETTINGS_KEY] || {})
    };
}

async function saveVocabularySettings(
    settings
) {
    await chrome.storage.local.set({
        [VOCABULARY_SETTINGS_KEY]: {
            ...getDefaultSettings(),
            ...settings
        }
    });
}

function getVariantForWord(word) {
    const normalized =
        normalizeCandidate(word);

    if (US_TERMS.has(normalized)) {
        return "us";
    }

    if (UK_TERMS.has(normalized)) {
        return "uk";
    }

    return "global";
}

function isVariantCompatible(
    word,
    variant
) {
    const normalized =
        normalizeCandidate(word);

    if (variant === "global") {
        return true;
    }

    const detected =
        getVariantForWord(normalized);

    if (detected === "global") {
        return true;
    }

    return detected === variant;
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
        BLOCKED_CANDIDATES.has(normalized)
    ) {
        return false;
    }

    if (
        COMMON_FUNCTION_WORDS.has(normalized)
    ) {
        return false;
    }

    return true;
}

function scoreCandidate(
    word,
    variant = "global"
) {
    const normalized =
        normalizeCandidate(word);

    let score = 0;

    if (
        PROFESSIONAL_WORDS.has(normalized)
    ) {
        score += 12;
    }

    if (normalized.length >= 6) {
        score += 2;
    }

    if (normalized.length >= 8) {
        score += 2;
    }

    if (normalized.length >= 11) {
        score += 1;
    }

    if (
        variant === "us" &&
        US_TERMS.has(normalized)
    ) {
        score += 10;
    }

    if (
        variant === "uk" &&
        UK_TERMS.has(normalized)
    ) {
        score += 10;
    }

    if (
        variant === "us" &&
        UK_TERMS.has(normalized)
    ) {
        score -= 8;
    }

    if (
        variant === "uk" &&
        US_TERMS.has(normalized)
    ) {
        score -= 8;
    }

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

    const meanings = Array.isArray(entry.meanings)
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

    if (!firstDefinition.definition) {
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
        synonym: "—",
        antonym: "—",
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
        Object.entries(cache).slice(
            -VOCABULARY_CACHE_LIMIT
        );

    await chrome.storage.local.set({
        [VOCABULARY_CACHE_KEY]:
            Object.fromEntries(entries)
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
                    word
                })
            );

    await saveDiscoveryCache(
        ranked.map(
            (item) =>
                item.word
        )
    );

    return ranked.map(
        (item) =>
            item.word
    );
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

    const settings =
        await getVocabularySettings();

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
            .sort(
                (a, b) =>
                    scoreCandidate(
                        b,
                        settings.variant
                    ) -
                    scoreCandidate(
                        a,
                        settings.variant
                    )
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
    const settings =
        await getVocabularySettings();

    const vocabulary =
        await buildDynamicVocabulary(
            progress
        );

    const candidates =
        vocabulary
            .filter(
                (word) => {
                    if (progress[word.word]) {
                        return false;
                    }

                    if (
                        !word.word ||
                        !word.meaning
                    ) {
                        return false;
                    }

                    if (
                        !isVariantCompatible(
                            word.word,
                            settings.variant
                        )
                    ) {
                        return false;
                    }

                    return true;
                }
            )
            .sort(
                (a, b) =>
                    scoreCandidate(
                        b.word,
                        settings.variant
                    ) -
                    scoreCandidate(
                        a.word,
                        settings.variant
                    )
            );

    if (!candidates.length) {
        return [];
    }

    const pool =
        candidates.slice(
            0,
            Math.min(
                18,
                candidates.length
            )
        );

    if (pool.length <= count) {
        return pool;
    }

    const dayNumber =
        Math.floor(
            Date.now() / 86400000
        );

    const rotation =
        dayNumber % pool.length;

    const rotated = [
        ...pool.slice(rotation),
        ...pool.slice(0, rotation)
    ];

    const easy =
        rotated[0];

    const medium =
        rotated[
        Math.min(
            4,
            rotated.length - 1
        )
        ];

    const challenging =
        rotated[
        Math.min(
            9,
            rotated.length - 1
        )
        ];

    const selected = [
        easy,
        medium,
        challenging
    ];

    const unique = [];

    selected.forEach(
        (word) => {
            if (
                word &&
                !unique.some(
                    (item) =>
                        item.word ===
                        word.word
                )
            ) {
                unique.push(word);
            }
        }
    );

    return unique.slice(
        0,
        count
    );
}

async function discoverWord(
    word
) {
    return fetchWord(
        word
    );
}