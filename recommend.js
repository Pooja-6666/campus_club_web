const prisma = require("./prismaClient");

// ==============================
// TUNABLE WEIGHTS
// ==============================
const WEIGHTS = {
  content: 0.35,
  collaborative: 0.3,
  popularity: 0.2,
  freshness: 0.15, // item cold-start boost
};

const INTEREST_WEIGHT = 3;
const BOOKMARK_WEIGHT = 5;
const VIEW_WEIGHT = 1;
const RSVP_WEIGHT = 8;
const POSITIVE_FEEDBACK_WEIGHT = 6; // only applied when rating >= 4
const INTERACTION_HALFLIFE_DAYS = 30;
const EVENT_TIMELINESS_HALFLIFE = 14;
const NEW_EVENT_WINDOW_DAYS = 3;      // "new" = posted within this window
const MAX_PER_CLUB_IN_TOP_N = 3;      // diversity cap

// ==============================
// HELPERS
// ==============================
function daysAgo(date) {
  return (Date.now() - new Date(date).getTime()) / (1000 * 60 * 60 * 24);
}

function decay(days, halfLife) {
  return Math.pow(0.5, Math.max(days, 0) / halfLife);
}

function normalize(map) {
  const max = Math.max(...map.values(), 1e-9);
  const out = new Map();
  map.forEach((v, k) => out.set(k, v / max));
  return out;
}

function eventEndsAt(event) {
  return event.endDate ? new Date(event.endDate) : new Date(event.date);
}

// ==============================
// 1. STUDENT PROFILE
// ==============================
async function buildStudentProfile(studentId) {
  const student = await prisma.student.findUnique({
    where: { student_id: studentId },
    include: {
      bookmarks: { include: { event: true } },
      views: { include: { event: true } },
      rsvps: { include: { event: true } },
      feedback: { include: { event: true } },
      notInterested: true,
    },
  });

  const profile = {};
  const addSignal = (key, weight) => {
    profile[key] = (profile[key] || 0) + weight;
  };


  const excludedEventIds = new Set();
  const excludedCategories = new Set();
  const excludedTags = new Set();

  // ==============================
  // 1. EXPLICIT STUDENT INTERESTS
  // ==============================

  (student.interests || []).forEach((interest) => {
    const key = interest.trim().toLowerCase();

    if (key) {
      addSignal(`tag:${key}`, INTEREST_WEIGHT);
    }
  });

  // ==============================
  // 2. LEARN FROM EVENT INTERACTIONS
  // ==============================

  const applyEventSignal = (event, baseWeight, timestamp) => {
    if (!event) return;

    const w =
      baseWeight *
      decay(daysAgo(timestamp), INTERACTION_HALFLIFE_DAYS);

    // Category preference
    if (event.category) {
      addSignal(
        `cat:${event.category.trim().toLowerCase()}`,
        w
      );
    }

    // Tag preferences
    (event.tags || []).forEach((tag) => {
      const key = tag.trim().toLowerCase();

      if (key) {
        addSignal(`tag:${key}`, w);
      }
    });

    // Club preference
    if (event.club_id) {
      addSignal(`club:${event.club_id}`, w);
    }
  };

  // ==============================
  // 3. BOOKMARK SIGNAL
  // ==============================

  student.bookmarks.forEach((bookmark) => {
    applyEventSignal(
      bookmark.event,
      BOOKMARK_WEIGHT,
      bookmark.createdAt
    );
  });

  // ==============================
  // 4. VIEW SIGNAL
  // ==============================

  student.views.forEach((view) => {
    applyEventSignal(
      view.event,
      VIEW_WEIGHT,
      view.createdAt
    );
  });

  // ==============================
  // 5. RSVP SIGNAL
  // ==============================

  student.rsvps
    .filter(
      (rsvp) =>
        rsvp.status &&
        rsvp.status.toUpperCase() !== "CANCELLED"
    )
    .forEach((rsvp) => {
      applyEventSignal(
        rsvp.event,
        RSVP_WEIGHT,
        rsvp.createdAt
      );
    });

  // ==============================
  // 6. FEEDBACK SIGNAL
  // ==============================

  student.feedback.forEach((feedback) => {
    let feedbackWeight = 0;

    if (feedback.rating >= 5) {
      feedbackWeight = 6;
    } else if (feedback.rating === 4) {
      feedbackWeight = 4;
    } else if (feedback.rating === 3) {
      feedbackWeight = 0;
    } else if (feedback.rating === 2) {
      feedbackWeight = -3;
    } else if (feedback.rating <= 1) {
      feedbackWeight = -6;
    }

    if (feedbackWeight !== 0) {
      applyEventSignal(
        feedback.event,
        feedbackWeight,
        feedback.createdAt
      );
    }
  });

  // ==============================
  // 7. NOT INTERESTED
  // ==============================

  student.notInterested.forEach((item) => {

    // Exact event exclusion
    if (item.event_id) {
      excludedEventIds.add(item.event_id);
    }

    // Category exclusion
    if (item.category) {
      excludedCategories.add(
        item.category.trim().toLowerCase()
      );
    }

    // Tag exclusion
    if (item.tag) {
      excludedTags.add(
        item.tag.trim().toLowerCase()
      );
    }
  });

  // ==============================
  // 8. EVENTS ALREADY ENGAGED WITH
  // ==============================

  const bookmarkedEventIds = new Set(
    student.bookmarks.map(
      (bookmark) => bookmark.event_id
    )
  );

  const rsvpedEventIds = new Set(
    student.rsvps
      .filter(
        (rsvp) =>
          rsvp.status &&
          rsvp.status.toUpperCase() !== "CANCELLED"
      )
      .map((rsvp) => rsvp.event_id)
  );

  return {
    profile,
    bookmarkedEventIds,
    rsvpedEventIds,
    excludedEventIds,
    excludedCategories,
    excludedTags,
  };
}


function eventVector(event) {
  const v = new Set();
  if (event.category) v.add(`cat:${event.category.toLowerCase()}`);
  (event.tags || []).forEach((t) => v.add(`tag:${t.toLowerCase()}`));
  v.add(`club:${event.club_id}`);
  return v;
}

function matchesExclusion(event, excludedCategories, excludedTags) {
  const cat = (event.category || "").toLowerCase();
  if (cat && excludedCategories.has(cat)) return true;
  return (event.tags || []).some((t) => excludedTags.has(t.toLowerCase()));
}

// ==============================
// 2. CONTENT-BASED SCORE
// ==============================
function contentScore(profile, event) {
  const vec = eventVector(event);
  let score = 0;
  vec.forEach((key) => {
    if (profile[key]) score += profile[key];
  });
  return score;
}

// ==============================
// 3. ITEM-BASED COLLABORATIVE FILTERING
// ==============================
async function computeCollaborativeScores(engagedEventIds, candidateEvents) {
  const scores = new Map(candidateEvents.map((e) => [e.event_id, 0]));
  if (engagedEventIds.size === 0) return scores;

  const allBookmarks = await prisma.bookmark.findMany({
    select: { student_id: true, event_id: true },
  });

  const eventStudents = new Map();
  allBookmarks.forEach(({ student_id, event_id }) => {
    if (!eventStudents.has(event_id)) eventStudents.set(event_id, new Set());
    eventStudents.get(event_id).add(student_id);
  });

  candidateEvents.forEach((candidate) => {
    const candidateStudents = eventStudents.get(candidate.event_id) || new Set();
    let total = 0;

    engagedEventIds.forEach((engagedId) => {
      const engagedStudents = eventStudents.get(engagedId) || new Set();
      const overlap = [...candidateStudents].filter((s) => engagedStudents.has(s)).length;
      const denom = Math.sqrt(candidateStudents.size * engagedStudents.size) || 1;
      total += overlap / denom;
    });

    scores.set(candidate.event_id, total);
  });

  return scores;
}

// ==============================
// 4. POPULARITY + RECENCY
// ==============================
function popularityScore(event, bookmarkCounts) {
  const count = bookmarkCounts.get(event.event_id) || 0;
  const daysUntil = (new Date(event.date).getTime() - Date.now()) / (1000 * 60 * 60 * 24);
  const timelinessBoost = daysUntil >= 0 ? decay(daysUntil, EVENT_TIMELINESS_HALFLIFE) : 0;
  return count * (0.5 + 0.5 * timelinessBoost);
}

// ==============================
// 5. FRESHNESS / ITEM COLD-START BOOST
//    New events with little/no bookmark history would otherwise be invisible
//    (popularity ~0, collaborative ~0). Give them a chance based on content fit.
// ==============================
function freshnessScore(event, bookmarkCounts, contentScoreValue) {
  const age = daysAgo(event.createdAt);
  const count = bookmarkCounts.get(event.event_id) || 0;
  if (age > NEW_EVENT_WINDOW_DAYS || count > 2) return 0;
  const freshnessFactor = decay(age, NEW_EVENT_WINDOW_DAYS);
  return freshnessFactor * contentScoreValue;
}

// ==============================
// 6. DIVERSITY RE-RANKING (cap results per club)
// ==============================
function diversify(scoredEvents, limit) {
  const result = [];
  const clubCounts = new Map();
  const overflow = [];

  for (const e of scoredEvents) {
    const clubCount = clubCounts.get(e.club_id) || 0;
    if (clubCount < MAX_PER_CLUB_IN_TOP_N) {
      result.push(e);
      clubCounts.set(e.club_id, clubCount + 1);
    } else {
      overflow.push(e);
    }
    if (result.length >= limit) break;
  }

  // backfill with overflow if we didn't hit the limit (small candidate pools)
  let i = 0;
  while (result.length < limit && i < overflow.length) {
    result.push(overflow[i]);
    i++;
  }

  return result.slice(0, limit);
}

// ==============================
// 7. MAIN ENTRY POINT
// ==============================
async function getRecommendations(studentId, limit = 10) {
  const {
    profile,
    bookmarkedEventIds,
    rsvpedEventIds,
    excludedEventIds,
    excludedCategories,
    excludedTags,
  } = await buildStudentProfile(studentId);

  const engagedEventIds = new Set([...bookmarkedEventIds, ...rsvpedEventIds]);
  const now = new Date();

  const rawCandidates = await prisma.event.findMany({
    where: {
      status: "APPROVED",
      event_id: { notIn: [...excludedEventIds] },
    },
    include: { club: true },
  });

  const candidates = rawCandidates.filter(
    (e) => eventEndsAt(e) >= now && !matchesExclusion(e, excludedCategories, excludedTags)
  );

  if (candidates.length === 0) return [];

  const bookmarkCounts = new Map();

  const bookmarkGroups = await prisma.bookmark.groupBy({
    by: ["event_id"],
    _count: {
      event_id: true,
    },
});

bookmarkGroups.forEach((r) => {
  bookmarkCounts.set(r.event_id, r._count.event_id);
});

  const contentRaw = new Map(candidates.map((e) => [e.event_id, contentScore(profile, e)]));
  const collabRaw = await computeCollaborativeScores(engagedEventIds, candidates);
  const popRaw = new Map(candidates.map((e) => [e.event_id, popularityScore(e, bookmarkCounts)]));
  const freshRaw = new Map(
    candidates.map((e) => [
      e.event_id,
      freshnessScore(e, bookmarkCounts, contentRaw.get(e.event_id) || 0),
    ])
  );

  const contentNorm = normalize(contentRaw);
  const collabNorm = normalize(collabRaw);
  const popNorm = normalize(popRaw);
  const freshNorm = normalize(freshRaw);

  const isColdStartUser = engagedEventIds.size === 0 && Object.keys(profile).length === 0;
  const weights = isColdStartUser
    ? { content: 0, collaborative: 0, popularity: 0.8, freshness: 0.2 }
    : WEIGHTS;

  const scored = candidates.map((e) => {
    const score =
      weights.content * (contentNorm.get(e.event_id) || 0) +
      weights.collaborative * (collabNorm.get(e.event_id) || 0) +
      weights.popularity * (popNorm.get(e.event_id) || 0) +
      weights.freshness * (freshNorm.get(e.event_id) || 0);

    return {
      ...e,
      recommendation: {
        score: Number(score.toFixed(4)),
        breakdown: {
          content: Number((contentNorm.get(e.event_id) || 0).toFixed(4)),
          collaborative: Number((collabNorm.get(e.event_id) || 0).toFixed(4)),
          popularity: Number((popNorm.get(e.event_id) || 0).toFixed(4)),
          freshness: Number((freshNorm.get(e.event_id) || 0).toFixed(4)),
        },
        coldStartUser: isColdStartUser,
        isNewEvent: freshRaw.get(e.event_id) > 0,
      },
    };
  });

  scored.sort((a, b) => b.recommendation.score - a.recommendation.score);

  return diversify(scored, limit);
}

module.exports = { getRecommendations };