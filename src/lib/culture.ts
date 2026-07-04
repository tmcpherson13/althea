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
  SA: {
    countryCode: 'SA',
    headline: 'Dress modestly — cover shoulders and knees; an abaya is no longer required for visitors.',
    details: [
      'Loose, opaque clothing is expected in public.',
      'A headscarf is needed inside mosques, not on the street.',
    ],
    modestByDefault: true,
    modestActivities: RELIGIOUS,
  },
  QA: {
    countryCode: 'QA',
    headline: 'Cover shoulders and knees in public; malls post modest-dress reminders.',
    details: ['Carry a light layer for strong air-conditioning.', 'Beachwear stays at the resort.'],
    modestByDefault: true,
    modestActivities: RELIGIOUS,
  },
  OM: {
    countryCode: 'OM',
    headline: 'Oman is conservative — cover shoulders and knees, and a scarf for mosques.',
    details: ['Loose, breathable layers handle both the heat and the coverage.'],
    modestByDefault: true,
    modestActivities: RELIGIOUS,
  },
  MV: {
    countryCode: 'MV',
    headline: 'Resort islands are relaxed; inhabited local islands expect covered shoulders and knees.',
    details: [
      'Bikinis are fine on resort islands and designated tourist beaches only.',
      'On local islands, cover up away from the beach.',
    ],
    modestByDefault: false,
    modestActivities: [...RELIGIOUS, 'local island'],
  },
  LK: {
    countryCode: 'LK',
    headline: 'Temples require covered shoulders and knees, bare feet, and no photos turning your back to Buddha.',
    details: ['A light scarf and slip-on shoes make temple visits easy.'],
    modestByDefault: false,
    modestActivities: RELIGIOUS,
  },
  NP: {
    countryCode: 'NP',
    headline: 'Modest dress is respectful; temples require covered shoulders and knees.',
    details: ['Some Hindu temples restrict entry to Hindus.', 'Remove shoes and leather at temple entrances.'],
    modestByDefault: false,
    modestActivities: RELIGIOUS,
  },
  KH: {
    countryCode: 'KH',
    headline: 'Angkor and all temples require covered shoulders and knees — enforced at the gate.',
    details: ['Bring a scarf; sleeveless tops and shorts are turned away at Angkor Wat.'],
    modestByDefault: false,
    modestActivities: [...RELIGIOUS, 'angkor'],
  },
  VN: {
    countryCode: 'VN',
    headline: 'Pagodas and temples expect covered shoulders and knees; cities are otherwise relaxed.',
    details: ['Keep a light layer for temple visits.'],
    modestByDefault: false,
    modestActivities: [...RELIGIOUS, 'pagoda'],
  },
  MM: {
    countryCode: 'MM',
    headline: 'Pagodas require covered shoulders and knees and bare feet — socks off too.',
    details: ['Slip-on shoes and a longyi or wrap make pagoda visits smoother.'],
    modestByDefault: false,
    modestActivities: [...RELIGIOUS, 'pagoda'],
  },
  IL: {
    countryCode: 'IL',
    headline: 'Religious sites in Jerusalem require covered shoulders and knees; some quarters are very conservative.',
    details: [
      'The Western Wall and holy sites expect modest dress and a head covering in places.',
      'Tel Aviv is cosmopolitan and relaxed.',
    ],
    modestByDefault: false,
    modestActivities: [...RELIGIOUS, 'jerusalem', 'old city'],
  },
  GR: {
    countryCode: 'GR',
    headline: 'Monasteries (Meteora, Mount Athos) require covered shoulders and knees — often skirts for women.',
    details: ['Many monasteries lend wraps at the door, but bringing your own is easier.', 'Islands and cities are relaxed.'],
    modestByDefault: false,
    modestActivities: [...RELIGIOUS, 'monasteries', 'meteora'],
  },
  ES: {
    countryCode: 'ES',
    headline: 'Cathedrals — including the Sagrada Família — require covered shoulders and knees.',
    details: ['A shawl covers you for any church visit.', 'Otherwise Spain runs smart-casual.'],
    modestByDefault: false,
    modestActivities: RELIGIOUS,
  },
  FR: {
    countryCode: 'FR',
    headline: 'Churches and cathedrals expect covered shoulders and knees; cities lean chic.',
    details: ['Keep a light scarf for church visits.'],
    modestByDefault: false,
    modestActivities: RELIGIOUS,
  },
  MX: {
    countryCode: 'MX',
    headline: 'Churches expect covered shoulders and knees; beach towns and cities are relaxed.',
    details: ['A wrap covers you for cathedral visits.'],
    modestByDefault: false,
    modestActivities: RELIGIOUS,
  },
  JP: {
    countryCode: 'JP',
    headline: 'Generally relaxed — but remove your shoes where indicated, and cover up for some temples.',
    details: [
      'Slip-on shoes make temple, ryokan and home visits easier.',
      'Visible tattoos can bar entry to onsen (hot springs) — check ahead or cover them.',
    ],
    modestByDefault: false,
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
