# LexiLoop

LexiLoop is a Chrome extension designed to help users build practical English vocabulary through daily learning, spaced repetition, adaptive revision, contextual browser reminders, and learning analytics.

## V0.5 Features

V0.5 introduces the progress dashboard.

### Daily vocabulary

- Three new words per day
- Meaning
- Pronunciation
- Part of speech
- Synonym
- Antonym
- Four example sentences

### Adaptive learning

Every learned word receives a mastery score from 0 to 100.

Revision performance changes:

- Mastery score
- Learning status
- Next revision interval
- Revision priority

### Progress dashboard

The extension now tracks:

- Total words learned
- Total mastered words
- Total revisions
- Revision accuracy
- Current learning streak
- Number of active learning days
- Average mastery

### Mastery distribution

Vocabulary is grouped into:

- Learning
- Familiar
- Mastered

### Weakest words

LexiLoop displays the user's lowest-scoring vocabulary so the user can focus on words that need more attention.

### Strongest words

The dashboard also displays the user's highest-scoring vocabulary.

### Recent vocabulary

Recently studied words are displayed with their latest activity date.

## Learning streak

A day is considered active when the user learns a new word or completes a revision.

The streak counts consecutive active calendar days.

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