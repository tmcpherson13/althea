/**
 * Culture / dress-norm rules that feed the packing engine's modesty logic.
 *
 * The authoritative source is the `culture_norms` table (editorially reviewed,
 * per scoping doc 02). This module is the built-in starter set + graceful
 * default used until that KB is reviewed and published — deliberately scoped
 * to the destinations where dress norms carry the most weight, with a
 * permissive default everywhere else. STARTER CONTENT — pending editorial
 * review before it is promoted to the DB and marketed as "reviewed".
 */

export type CultureRule = {
  countryCode: string; // ISO alpha-2
  headline: string;
  details: string[];
  /** Destination leans conservative: cover shoulders & knees for sightseeing by default. */
  modestByDefault: boolean;
  /** Activities/contexts that always call for coverage, even in cosmopolitan places. */
  modestActivities: string[];
};

const RELIGIOUS = ['religious sites', 'temples', 'mosques', 'churches'];

const RULES: Record<string, CultureRule> = {
  MA: {
    countryCode: 'MA',
    headline: 'In medinas and religious sites, shoulders and knees stay covered.',
    details: [
      'Beachwear stays at the riad pool.',
      'Evenings in cosmopolitan districts are relaxed — smart eveningwear is fine.',
      'A wrap or scarf doubles as coverage for mosque visits.',
    ],
    modestByDefault: true,
    modestActivities: RELIGIOUS,
  },
  AE: {
    countryCode: 'AE',
    headline: 'Cover shoulders and knees in public; malls and souks expect modest dress.',
    details: [
      'Swimwear is for the beach and hotel pool only.',
      'Carry a light layer for heavily air-conditioned interiors.',
      'Sheikh Zayed Mosque requires full coverage and a headscarf.',
    ],
    modestByDefault: true,
    modestActivities: RELIGIOUS,
  },
  EG: {
    countryCode: 'EG',
    headline: 'Modest dress — covered shoulders and knees — is expected at sites and in towns.',
    details: [
      'Loose, breathable layers handle the heat and the coverage at once.',
      'Bring a scarf for mosques.',
      'Resort areas are more relaxed than cities and temple sites.',
    ],
    modestByDefault: true,
    modestActivities: RELIGIOUS,
  },
  JO: {
    countryCode: 'JO',
    headline: 'Cover shoulders and knees, especially at religious and rural sites.',
    details: [
      'Petra involves long walks — modest, breathable layers work best.',
      'A scarf is useful for mosque visits and sun.',
    ],
    modestByDefault: true,
    modestActivities: RELIGIOUS,
  },
  TR: {
    countryCode: 'TR',
    headline: 'Cities are cosmopolitan, but mosques require covered shoulders, knees and hair.',
    details: [
      'Keep a scarf handy for the Blue Mosque and Hagia Sophia.',
      'Coastal resorts are relaxed; conservative towns less so.',
    ],
    modestByDefault: false,
    modestActivities: [...RELIGIOUS, 'old town'],
  },
  IN: {
    countryCode: 'IN',
    headline: 'Modest dress is respectful; temples require covered shoulders and knees.',
    details: [
      'Lightweight cottons and a scarf cover a lot of ground.',
      'Some temples ask you to remove shoes and cover your head.',
    ],
    modestByDefault: true,
    modestActivities: RELIGIOUS,
  },
  ID: {
    countryCode: 'ID',
    headline: 'Temples require a sarong and covered shoulders; beach towns are relaxed.',
    details: [
      'Many temples provide a sarong, but bringing your own is easier.',
      'Ubud and temple visits lean modest; Seminyak beach clubs do not.',
    ],
    modestByDefault: false,
    modestActivities: [...RELIGIOUS, 'temple tour'],
  },
  TH: {
    countryCode: 'TH',
    headline: 'Temples require covered shoulders and knees; elsewhere is easygoing.',
    details: [
      'The Grand Palace enforces coverage strictly.',
      'Carry a light layer for temple days.',
    ],
    modestByDefault: false,
    modestActivities: RELIGIOUS,
  },
  IT: {
    countryCode: 'IT',
    headline: 'Churches — including the Vatican — require covered shoulders and knees.',
    details: [
      'A shawl in your bag covers you for any church visit.',
      'Otherwise, Italian style runs smart-casual to polished.',
    ],
    modestByDefault: false,
    modestActivities: [...RELIGIOUS, 'vatican'],
  },
  VA: {
    countryCode: 'VA',
    headline: "St. Peter's and the Vatican Museums require covered shoulders and knees.",
    details: ['No exceptions at the basilica — bring a wrap.'],
    modestByDefault: true,
    modestActivities: RELIGIOUS,
  },
};

/** Permissive default for destinations without a specific rule. */
const DEFAULT_RULE: CultureRule = {
  countryCode: '',
  headline: 'No strict dress code — pack for the weather and your plans.',
  details: ['Carry a light layer for religious sites, which may ask for covered shoulders.'],
  modestByDefault: false,
  modestActivities: RELIGIOUS,
};

export function cultureFor(countryCode: string): CultureRule {
  return RULES[countryCode?.toUpperCase()] ?? { ...DEFAULT_RULE, countryCode };
}

/** Does a given day (by its activities) call for covered shoulders/knees? */
export function dayNeedsModesty(rule: CultureRule, activities: string[]): boolean {
  if (rule.modestByDefault) return true;
  const lower = activities.map((a) => a.toLowerCase());
  return rule.modestActivities.some((m) => lower.some((a) => a.includes(m.toLowerCase())));
}
