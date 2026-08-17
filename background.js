const DAILY_ALARM = "lexiloop-daily-check";
const DAILY_NOTIFICATION_COOLDOWN = 24 * 60 * 60 * 1000;

function getLocalDateKey(date = new Date()) {
    const year = date.getFullYear();

    const month = String(
        date.getMonth() + 1
    ).padStart(2, "0");

    const day = String(
        date.getDate()
    ).padStart(2, "0");

    return `${year}-${month}-${day}`;
}

function getNextNineAM() {
    const now = new Date();
    const next = new Date();

    next.setHours(9, 0, 0, 0);

    if (next <= now) {
        next.setDate(
            next.getDate() + 1
        );
    }

    return next.getTime();
}

async function ensureDailyAlarm() {
    const existingAlarm =
        await chrome.alarms.get(
            DAILY_ALARM
        );

    if (!existingAlarm) {
        await chrome.alarms.create(
            DAILY_ALARM,
            {
                when: getNextNineAM(),
                periodInMinutes:
                    24 * 60
            }
        );
    }
}

async function getDueWordCount() {
    const result =
        await chrome.storage.local.get(
            ["wordProgress"]
        );

    const progress =
        result.wordProgress || {};

    const today =
        getLocalDateKey();

    return Object.values(progress)
        .filter(
            (item) =>
                item &&
                item.dueDate &&
                item.dueDate <= today
        )
        .length;
}

async function getDailyNotificationState() {
    return chrome.storage.local.get([
        "lastNotificationDate",
        "lastStartupNotificationTime"
    ]);
}

async function canSendDailyNotification() {
    const state =
        await getDailyNotificationState();

    const today =
        getLocalDateKey();

    if (
        state.lastNotificationDate ===
        today
    ) {
        return false;
    }

    if (
        state.lastStartupNotificationTime &&
        Date.now() -
        state.lastStartupNotificationTime <
        DAILY_NOTIFICATION_COOLDOWN
    ) {
        return false;
    }

    return true;
}

async function sendDailyNotification() {
    const allowed =
        await canSendDailyNotification();

    if (!allowed) {
        return;
    }

    const dueCount =
        await getDueWordCount();

    let message =
        "Your 3 new vocabulary words are ready.";

    if (dueCount === 1) {
        message +=
            " You also have 1 word due for revision.";
    }

    if (dueCount > 1) {
        message +=
            ` You also have ${dueCount} words due for revision.`;
    }

    try {
        await chrome.notifications.create(
            `lexiloop-daily-${Date.now()}`,
            {
                type: "basic",
                title: "LexiLoop",
                message,
                iconUrl:
                    "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAQAAAC1+jfqAAAAJ0lEQVR42mNkwAUA4z8TAxMDAwMDAwPjPwMDAwMDwT8QMAAIMAAE3hD2qAAAAAElFTkSuQmCC"
            }
        );

        await chrome.storage.local.set({
            lastNotificationDate:
                getLocalDateKey(),

            lastStartupNotificationTime:
                Date.now()
        });
    } catch (error) {
        console.error(
            "Failed to send notification:",
            error
        );
    }
}

async function handleBrowserStart() {
    await ensureDailyAlarm();
    await sendDailyNotification();
}

chrome.runtime.onInstalled.addListener(
    async () => {
        await ensureDailyAlarm();
    }
);

chrome.runtime.onStartup.addListener(
    async () => {
        await handleBrowserStart();
    }
);

chrome.alarms.onAlarm.addListener(
    async (alarm) => {
        if (
            alarm.name !== DAILY_ALARM
        ) {
            return;
        }

        await sendDailyNotification();
    }
);

chrome.runtime.onMessage.addListener(
    (message, sender, sendResponse) => {
        if (
            message?.type ===
            "GET_DUE_COUNT"
        ) {
            getDueWordCount()
                .then((count) => {
                    sendResponse({
                        success: true,
                        count
                    });
                })
                .catch((error) => {
                    console.error(error);

                    sendResponse({
                        success: false,
                        count: 0
                    });
                });

            return true;
        }
    }
);