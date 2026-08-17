const ALARM_NAME = "lexiloop-daily-notification";

function getLocalDateKey() {
    const now = new Date();

    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
}

function getNextAlarmTime() {
    const now = new Date();
    const next = new Date();

    next.setHours(9, 0, 0, 0);

    if (next <= now) {
        next.setDate(next.getDate() + 1);
    }

    return next.getTime();
}

async function ensureDailyAlarm() {
    const alarm = await chrome.alarms.get(ALARM_NAME);

    if (!alarm) {
        await chrome.alarms.create(ALARM_NAME, {
            when: getNextAlarmTime(),
            periodInMinutes: 24 * 60
        });
    }
}

async function sendDailyNotification() {
    const today = getLocalDateKey();
    const data = await chrome.storage.local.get(["lastNotificationDate"]);

    if (data.lastNotificationDate === today) {
        return;
    }

    await chrome.notifications.create(`lexiloop-${today}`, {
        type: "basic",
        title: "LexiLoop — Today's Words",
        message: "Your 3 vocabulary words are ready.",
        iconUrl: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAQAAAC1+jfqAAAAJ0lEQVR42mNkwAUA4z8TAxMDAwMDAwPjPwMDAwMDwT8QMAAIMAAE3hD2qAAAAAElFTkSuQmCC"
    });

    await chrome.storage.local.set({
        lastNotificationDate: today
    });
}

chrome.runtime.onInstalled.addListener(async () => {
    await ensureDailyAlarm();
});

chrome.runtime.onStartup.addListener(async () => {
    await ensureDailyAlarm();
});

chrome.alarms.onAlarm.addListener(async (alarm) => {
    if (alarm.name !== ALARM_NAME) {
        return;
    }

    await sendDailyNotification();
});

chrome.notifications.onClicked.addListener(async () => {
    try {
        await chrome.action.openPopup();
    } catch (error) {
        console.warn("Could not open extension popup:", error);
    }
});