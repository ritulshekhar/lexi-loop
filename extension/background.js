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
        next.setDate(next.getDate() + 1);
    }

    return next.getTime();
}

async function ensureDailyAlarm() {
    const alarm =
        await chrome.alarms.get(DAILY_ALARM);

    if (!alarm) {
        await chrome.alarms.create(
            DAILY_ALARM,
            {
                when: getNextNineAM(),
                periodInMinutes: 24 * 60
            }
        );
    }
}

async function getDueWordCount() {
    const result =
        await chrome.storage.local.get([
            "wordProgress"
        ]);

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

async function sendDailyNotification() {
    const today =
        getLocalDateKey();

    const result =
        await chrome.storage.local.get([
            "lastNotificationDate",
            "lastStartupNotificationTime"
        ]);

    if (
        result.lastNotificationDate === today
    ) {
        return;
    }

    if (
        result.lastStartupNotificationTime &&
        Date.now() -
        result.lastStartupNotificationTime <
        DAILY_NOTIFICATION_COOLDOWN
    ) {
        return;
    }

    const dueCount =
        await getDueWordCount();

    let message =
        "Your personalized vocabulary session is ready.";

    if (dueCount > 0) {
        message +=
            ` ${dueCount} word${dueCount === 1 ? "" : "s"} also need${dueCount === 1 ? "s" : ""} revision.`;
    }

    try {
        await chrome.notifications.create(
            `lexiloop-${Date.now()}`,
            {
                type: "basic",
                title: "LexiLoop",
                message,
                iconUrl:
                    "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAQAAAC1+jfqAAAAJ0lEQVR42mNkwAUA4z8TAxMDAwMDAwPjPwMDAwMDwT8QMAAIMAAE3hD2qAAAAAElFTkSuQmCC"
            }
        );

        await chrome.storage.local.set({
            lastNotificationDate: today,
            lastStartupNotificationTime: Date.now()
        });
    } catch (error) {
        console.error(
            "LexiLoop notification error:",
            error
        );
    }
}

chrome.runtime.onInstalled.addListener(
    async () => {
        await ensureDailyAlarm();
    }
);

chrome.runtime.onStartup.addListener(
    async () => {
        await ensureDailyAlarm();
        await sendDailyNotification();
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