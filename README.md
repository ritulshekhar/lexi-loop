# LexiLoop

LexiLoop is a Chrome extension designed to help users build practical English vocabulary through daily learning, spaced repetition, and contextual browser reminders.

## V0.3 Features

V0.3 introduces Chrome-wide interaction.

### Daily vocabulary

- Three new words every day
- Meaning
- Pronunciation
- Part of speech
- Synonym
- Antonym
- Four example sentences

### Spaced repetition

Words are scheduled for revision using:

- 1 day
- 3 days
- 7 days
- 14 days
- 30 days

The interval changes depending on revision performance.

### Browser notifications

LexiLoop can notify the user when:

- A new daily vocabulary session is available
- Words are due for revision

The notification system avoids repeatedly notifying the user during the same day.

### Contextual browser revision

When a learned word becomes due, LexiLoop can display a small revision card while browsing normal websites.

The revision card asks:

> Do you remember what this means?

The user can:

- Show the answer
- Open LexiLoop
- Dismiss the reminder

### Reminder protection

The browser reminder is intentionally limited.

It does not appear continuously.

The current cooldown is 30 minutes.

The user can also dismiss contextual reminders for the rest of the current day.

## Project Structure

```text
LexiLoop/
├── manifest.json
├── background.js
├── popup.html
├── popup.css
├── popup.js
├── content.js
├── content.css
├── words.js
└── README.md