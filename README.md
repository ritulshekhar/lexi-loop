# LexiLoop

LexiLoop is a Chrome extension designed to help users build practical English vocabulary through daily learning, spaced repetition, adaptive revision, and contextual browser reminders.

## V0.4 Features

V0.4 introduces personalized learning.

### Daily vocabulary

- Three new words per day
- Meaning
- Pronunciation
- Part of speech
- Synonym
- Antonym
- Four example sentences

### Adaptive mastery score

Every learned word receives a mastery score from:

0 to 100

The score changes according to revision performance.

- Hard: score decreases
- Good: score increases moderately
- Easy: score increases faster

### Adaptive revision intervals

Revision intervals now adapt according to performance.

Possible intervals include:

- 1 day
- 3 days
- 7 days
- 14 days
- 30 days
- 45 days

Hard words return sooner.

Words that are consistently easy move further apart.

### Personalized revision priority

When multiple words are due, LexiLoop prioritizes words with lower mastery scores.

This means words the user struggles with are shown before words they already know well.

### Mastery levels

Words move through:

- New
- Learning
- Familiar
- Mastered

### Average mastery

The popup displays the user's average mastery score across learned vocabulary.

### Contextual browser reminders

V0.3 browser reminders continue to work.

The contextual revision system now prioritizes the user's weakest due words.

## Learning model

The basic adaptive flow is:

```text
New
 ↓
Learned
 ↓
Revision
 ↓
Performance recorded
 ↓
Mastery score updated
 ↓
Next interval adjusted
 ↓
Repeated revision
 ↓
Familiar
 ↓
Mastered