# LexiLoop

LexiLoop is a minimal Chrome extension designed to help users build practical English vocabulary through daily learning and spaced repetition.

## V0.2 Features

V0.2 introduces the first real learning system.

### Daily vocabulary

- Three new words per day
- Meaning
- Pronunciation
- Part of speech
- Synonym
- Antonym
- Four example sentences
- Mark words as learned

### Revision system

Words become due for revision after being learned.

The default revision intervals are:

- 1 day
- 3 days
- 7 days
- 14 days
- 30 days

### Recall-based revision

Instead of immediately showing the answer, LexiLoop asks:

> What does this word mean?

The user must first recall the meaning.

The answer can then be revealed.

### Revision difficulty

After seeing the answer, the user can select:

- Hard
- Good
- Easy

These choices influence the next revision interval.

### Word status

Words can move through:

- New
- Learning
- Familiar
- Mastered

### Persistent progress

Learning and revision data are stored using Chrome Storage.

Closing the popup does not delete progress.

## Project Structure

```text
LexiLoop/
├── manifest.json
├── background.js
├── popup.html
├── popup.css
├── popup.js
├── words.js
└── README.md