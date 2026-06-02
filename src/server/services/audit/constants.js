export const RELEVANCE_THRESHOLD = 0.6

export const STATUS_META = {
  CONFLICTS: {
    severity: 1,
    label: 'Goes against the law',
    meaning:
      'This guidance tells people to do something the law does not allow.',
    tone: 'red',
    cta: 'Review conflicting pages'
  },
  GUIDANCE_MISSING: {
    severity: 2,
    label: 'No guidance for this law',
    meaning:
      'There is a law about this, but no guidance has been written for it.',
    tone: 'orange',
    cta: 'View laws without guidance'
  },
  GUIDANCE_INCOMPLETE: {
    severity: 3,
    label: 'Only part of the law',
    meaning: 'The guidance covers some of the law, but leaves parts out.',
    tone: 'yellow',
    cta: 'View pages with partial coverage'
  },
  UNGROUNDED: {
    severity: 4,
    label: 'No law found',
    meaning:
      'This guidance does not seem to be based on any law we could find.',
    tone: 'grey',
    cta: 'View pages not based on law'
  },
  GUIDANCE_BROADER: {
    severity: 5,
    label: 'Goes beyond the law',
    meaning: 'The guidance matches the law and also adds extra advice.',
    tone: 'blue',
    cta: 'View pages with extra advice'
  },
  GROUNDED: {
    severity: 6,
    label: 'Matches the law',
    meaning: 'The guidance correctly matches the law.',
    tone: 'green',
    cta: 'View pages that match'
  }
}

export const STATUS_ORDER = [
  'CONFLICTS',
  'GUIDANCE_MISSING',
  'GUIDANCE_INCOMPLETE',
  'UNGROUNDED',
  'GUIDANCE_BROADER',
  'GROUNDED'
]
