/**
 * A student's flashcard progress: each card's mark and when it is next due,
 * plus how many cards they reviewed each day (for the streak and daily goal).
 *
 * Kept in this browser for now. Progress that follows the student across
 * devices needs a server-side table — until then a phone and a laptop each
 * keep their own streak.
 *
 * Scheduling is a light spaced repetition: "Review again" brings a card back
 * tomorrow; each "I knew it" in a row pushes it further out — 3, then 7, then
 * 21 days — so known cards stop crowding out the ones still being learnt.
 */

const STORAGE_KEY = 'amc_catalyst_flashcards_v2';
// Marks saved before scheduling existed: { [topicId]: { [cardIndex]: 'known' | 'review' } }.
const LEGACY_STORAGE_KEY = 'amc_catalyst_flashcards_v1';

export const DAILY_GOAL = 20;
export const SECONDS_PER_CARD = 15;

export const MARKS = Object.freeze({ KNOWN: 'known', REVIEW: 'review' });

// Days until a card is due again, by how many times in a row it was known.
const KNOWN_INTERVALS_DAYS = [3, 7, 21];
const REVIEW_INTERVAL_DAYS = 1;

const toDateKey = (date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

/** Today in the student's own timezone, as 'YYYY-MM-DD'. */
export const getToday = () => toDateKey(new Date());

export const addDays = (dateKey, days) => {
  const [y, m, d] = dateKey.split('-').map(Number);
  return toDateKey(new Date(y, m - 1, d + days));
};

const createEmptyProgress = () => ({ cards: {}, activity: {}, goalCelebratedOn: null });

// Known cards come back in 3 days and review cards today, so a student who
// already marked cards gets a first "due" pile instead of starting blank.
const migrateLegacyMarks = (legacyMarks) => {
  const today = getToday();
  const progress = createEmptyProgress();
  for (const [topicId, marks] of Object.entries(legacyMarks)) {
    progress.cards[topicId] = {};
    for (const [cardIndex, mark] of Object.entries(marks)) {
      const isKnown = mark === MARKS.KNOWN;
      progress.cards[topicId][cardIndex] = {
        mark,
        knownStreak: isKnown ? 1 : 0,
        dueOn: isKnown ? addDays(today, KNOWN_INTERVALS_DAYS[0]) : today,
      };
    }
  }
  return progress;
};

export const loadProgress = () => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return { ...createEmptyProgress(), ...JSON.parse(saved) };
    const legacy = localStorage.getItem(LEGACY_STORAGE_KEY);
    if (legacy) return migrateLegacyMarks(JSON.parse(legacy) ?? {});
  } catch {
    // Unreadable or blocked storage: start fresh rather than break the page.
  }
  return createEmptyProgress();
};

export const saveProgress = (progress) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  } catch {
    // Private windows can refuse storage; progress still works for this visit.
  }
};

export const getCardProgress = (progress, topicId, cardIndex) => progress.cards[topicId]?.[cardIndex];

/** The progress after one answer: the card rescheduled and today's count bumped. */
export const recordAnswer = (progress, topicId, cardIndex, isKnown) => {
  const today = getToday();
  const previous = getCardProgress(progress, topicId, cardIndex);
  const knownStreak = isKnown ? (previous?.knownStreak ?? 0) + 1 : 0;
  const intervalDays = isKnown
    ? KNOWN_INTERVALS_DAYS[Math.min(knownStreak, KNOWN_INTERVALS_DAYS.length) - 1]
    : REVIEW_INTERVAL_DAYS;

  return {
    ...progress,
    cards: {
      ...progress.cards,
      [topicId]: {
        ...progress.cards[topicId],
        [cardIndex]: {
          mark: isKnown ? MARKS.KNOWN : MARKS.REVIEW,
          knownStreak,
          dueOn: addDays(today, intervalDays),
        },
      },
    },
    activity: { ...progress.activity, [today]: (progress.activity[today] ?? 0) + 1 },
  };
};

export const clearTopicProgress = (progress, topicId) => {
  const { [topicId]: _cleared, ...cards } = progress.cards;
  return { ...progress, cards };
};

export const getTodayCount = (progress) => progress.activity[getToday()] ?? 0;

/**
 * Days in a row with at least one card reviewed. Today counts once something
 * is done; until then the streak is still alive from yesterday, so it does
 * not read as broken first thing in the morning.
 */
export const getStreak = (progress) => {
  let day = getToday();
  if (!progress.activity[day]) day = addDays(day, -1);
  let streak = 0;
  while (progress.activity[day]) {
    streak += 1;
    day = addDays(day, -1);
  }
  return streak;
};

/**
 * Cards due today or overdue, as { topicId, cardIndex }, most overdue first.
 * isTopicOpen leaves out topics the student can no longer open (a lapsed plan).
 */
export const getDueCards = (progress, isTopicOpen = () => true) => {
  const today = getToday();
  const due = [];
  for (const [topicId, cards] of Object.entries(progress.cards)) {
    if (!isTopicOpen(topicId)) continue;
    for (const [cardIndex, card] of Object.entries(cards)) {
      if (card.dueOn <= today) due.push({ topicId, cardIndex: Number(cardIndex), dueOn: card.dueOn });
    }
  }
  return due.sort((a, b) => a.dueOn.localeCompare(b.dueOn));
};

export const countKnownInTopic = (progress, topicId) => Object.values(progress.cards[topicId] ?? {})
  .filter((card) => card.mark === MARKS.KNOWN).length;

export const getMinutesFor = (cardCount) => Math.max(1, Math.ceil((cardCount * SECONDS_PER_CARD) / 60));
