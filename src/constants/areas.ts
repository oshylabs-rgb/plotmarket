/**
 * Launch areas for the location landing pages at /land-for-sale/[state]/[area].
 *
 * Copy is plain and document literate. Registry notes describe where a buyer
 * confirms a title, because Plotmarket shows title documents and does not
 * verify them. Keep every sentence factual; no marketing adjectives.
 */

export interface LaunchArea {
  /** URL slug for the state segment */
  stateSlug: string
  /** State name exactly as stored in properties.state */
  state: string
  /** URL slug for the area segment */
  slug: string
  /** Display name */
  name: string
  /** Search terms matched against properties.city and properties.location */
  match: string[]
  /** Short paragraph for the page intro. One or two sentences, factual. */
  intro: string
  /** What titles are common here and what to confirm before paying */
  titleNotes: string
  /** Where to confirm the title */
  registry: string
}

export const LAUNCH_AREAS: LaunchArea[] = [
  {
    stateSlug: 'lagos',
    state: 'Lagos',
    slug: 'lekki',
    name: 'Lekki',
    match: ['Lekki', 'Lekki Phase 1', 'Lekki Phase 2', 'Chevron', 'Ikate', 'Osapa'],
    intro:
      'Lekki covers the corridor from Lekki Phase 1 through Chevron and Osapa to the Lekki Free Trade Zone. Prices are quoted per plot or per square metre and vary sharply between gazetted estates and land under acquisition.',
    titleNotes:
      'Expect Certificates of Occupancy and Governor’s Consent in the older phases, and Excision or Gazette further out along the Lekki Epe Expressway. Land described as “under acquisition” or sold on a family receipt alone carries the most risk.',
    registry:
      'Lagos State Lands Registry, Alausa, Ikeja. A title search is done in person with a survey plan and the title number. The Lagos State Land Information System also lists gazetted excisions.',
  },
  {
    stateSlug: 'lagos',
    state: 'Lagos',
    slug: 'ajah',
    name: 'Ajah',
    match: ['Ajah', 'Sangotedo', 'Abraham Adesanya', 'Badore', 'Addo'],
    intro:
      'Ajah sits between Lekki and Epe and includes Sangotedo, Badore and Abraham Adesanya. Most plots on offer are in private estates carved out of excised village land.',
    titleNotes:
      'Gazette and Excision are the titles you will see most. Ask for the Gazette number and the excision survey, and check that the plot falls inside the excised area rather than on committed government land.',
    registry:
      'Lagos State Lands Registry, Alausa. Confirm the excision in the Lagos State Gazette and cross check the survey plan coordinates with a registered surveyor.',
  },
  {
    stateSlug: 'lagos',
    state: 'Lagos',
    slug: 'ibeju-lekki',
    name: 'Ibeju Lekki',
    match: ['Ibeju', 'Ibeju-Lekki', 'Ibeju Lekki', 'Eleko', 'Lakowe', 'Akodo', 'Eleranigbe'],
    intro:
      'Ibeju Lekki is the largest land market in Lagos by volume, driven by the Lekki Free Trade Zone, the Dangote refinery and the Lekki deep sea port. It is also where the most disputed sales happen.',
    titleNotes:
      'Genuine plots carry a Gazette or Excision with a specific number and village name. Government acquisition maps change, so an allocation letter or family receipt alone does not establish title here.',
    registry:
      'Lagos State Lands Registry, Alausa, and the Lagos State Gazette for excisions. Ask the Office of the Surveyor General for a charting report on the survey plan before paying.',
  },
  {
    stateSlug: 'lagos',
    state: 'Lagos',
    slug: 'ikorodu',
    name: 'Ikorodu',
    match: ['Ikorodu', 'Imota', 'Igbogbo', 'Agbowa'],
    intro:
      'Ikorodu is the affordable end of the Lagos land market, with plots in Imota, Igbogbo and Agbowa priced well below the Lekki corridor. Access roads and drainage vary by estate.',
    titleNotes:
      'Excision and Gazette are common, with some Certificates of Occupancy in older layouts. Ask for the excision file number and confirm the family selling is the one named in the excision.',
    registry:
      'Lagos State Lands Registry, Alausa, and the Ikorodu local land office for community layouts.',
  },
  {
    stateSlug: 'lagos',
    state: 'Lagos',
    slug: 'epe',
    name: 'Epe',
    match: ['Epe', 'Ketu Epe', 'Poka', 'Ilara'],
    intro:
      'Epe is the frontier of the Lekki Epe corridor, with large land parcels bought for farming, estates and long term holding. Plots are cheap per square metre and distances are long.',
    titleNotes:
      'Most land is sold on Excision, Gazette or a family receipt. Ask whether the excision has been perfected and whether the plot lies inside the Epe agricultural or residential scheme.',
    registry:
      'Lagos State Lands Registry, Alausa. The Lagos State Gazette lists excised villages in Epe division.',
  },
  {
    stateSlug: 'lagos',
    state: 'Lagos',
    slug: 'ikeja',
    name: 'Ikeja',
    match: ['Ikeja', 'GRA Ikeja', 'Ikeja GRA', 'Magodo', 'Ogba', 'Opebi', 'Allen'],
    intro:
      'Ikeja is the state capital and the mainland business district, with houses and plots in GRA, Magodo, Opebi and Ogba. Supply is thin and most sales are of built property rather than bare land.',
    titleNotes:
      'Certificates of Occupancy and Governor’s Consent are standard. Any sale of C of O land needs Governor’s Consent to be valid, so ask whether consent has been obtained for previous transfers.',
    registry:
      'Lagos State Lands Registry, Alausa, Ikeja. A search by title number takes a few working days.',
  },
  {
    stateSlug: 'fct-abuja',
    state: 'FCT Abuja',
    slug: 'gwarinpa',
    name: 'Gwarinpa',
    match: ['Gwarinpa', 'Life Camp', 'Dawaki'],
    intro:
      'Gwarinpa is the largest single housing estate in West Africa and a dense market for duplexes, flats and infill plots. Neighbouring Dawaki and Life Camp trade on the same basis.',
    titleNotes:
      'FCT land is held on Right of Occupancy from the Federal Capital Territory Administration, not from a state governor. Ask for the R of O or C of O and the AGIS file number, and check for any revocation notice.',
    registry:
      'Abuja Geographic Information Systems (AGIS), Area 11, Garki. A legal search is done online and confirmed with the physical file.',
  },
  {
    stateSlug: 'fct-abuja',
    state: 'FCT Abuja',
    slug: 'lugbe',
    name: 'Lugbe',
    match: ['Lugbe', 'Airport Road', 'Pyakasa', 'Sabon Lugbe'],
    intro:
      'Lugbe lies along the Airport Road and is the busiest entry level land market in the FCT. Plots sell in layouts approved by the Abuja Municipal Area Council as well as in unapproved settlements.',
    titleNotes:
      'Area council allocations are common here and are weaker than an FCTA Right of Occupancy. Ask whether the plot has been regularised with the FCTA, and treat a bare allocation letter as an unproven title.',
    registry:
      'AGIS for FCTA titles. For area council allocations, the AMAC land office and the FCTA regularisation desk.',
  },
  {
    stateSlug: 'fct-abuja',
    state: 'FCT Abuja',
    slug: 'kubwa',
    name: 'Kubwa',
    match: ['Kubwa', 'Arab Road', 'Byazhin', 'Dutse'],
    intro:
      'Kubwa is a large satellite town north of the city centre with a mature housing stock and active plot sales in Byazhin and along Arab Road.',
    titleNotes:
      'Look for an FCTA Right of Occupancy or Certificate of Occupancy with an AGIS file number. Bwari Area Council allocations exist and need regularisation before they are secure.',
    registry:
      'AGIS, Area 11, Garki. Bwari Area Council land office for council allocations.',
  },
  {
    stateSlug: 'ogun',
    state: 'Ogun',
    slug: 'mowe-ibafo',
    name: 'Mowe and Ibafo',
    match: ['Mowe', 'Ibafo', 'Ofada', 'Magboro', 'Arepo'],
    intro:
      'Mowe, Ibafo, Magboro and Arepo sit on the Lagos Ibadan Expressway just outside Lagos and absorb much of the demand priced out of the city. Estates range from gated schemes to bare plots.',
    titleNotes:
      'Ogun State issues Certificates of Occupancy and Governor’s Consent, and many estates sell on a Deed of Assignment backed by a registered survey. Ask whether the estate itself holds a global C of O.',
    registry:
      'Ogun State Bureau of Lands and Survey, Oke Mosan, Abeokuta. The Ogun State Land Information System handles searches.',
  },
  {
    stateSlug: 'oyo',
    state: 'Oyo',
    slug: 'ibadan',
    name: 'Ibadan',
    match: ['Ibadan', 'Akobo', 'Alakia', 'Moniya', 'Apata', 'Jericho', 'Bodija', 'Oluyole'],
    intro:
      'Ibadan is the largest city in West Africa by land area, and plots remain cheap by Lagos standards in Moniya, Akobo, Alakia and along the Lagos Ibadan Expressway.',
    titleNotes:
      'Certificates of Occupancy, Deeds of Assignment and registered surveys are the usual documents. Family land is common, so confirm the family head has authority to sell and that no other branch of the family has sold the same plot.',
    registry:
      'Oyo State Ministry of Lands, Housing and Urban Development, Secretariat, Ibadan. A search requires the survey plan and any existing registration number.',
  },
  {
    stateSlug: 'rivers',
    state: 'Rivers',
    slug: 'port-harcourt',
    name: 'Port Harcourt',
    match: ['Port Harcourt', 'GRA Port Harcourt', 'Rumuokoro', 'Rumuola', 'Eliozu', 'Woji', 'Trans Amadi', 'Peter Odili'],
    intro:
      'Port Harcourt land trades across GRA, Woji, Eliozu and the Peter Odili Road axis. Community land sales are common at the edges of the city and need careful checking.',
    titleNotes:
      'Certificates of Occupancy and Deeds of Assignment are the norm. For community land, confirm that the community has a registered survey and that the plot does not sit on land already acquired by the state.',
    registry:
      'Rivers State Ministry of Lands and Survey, Port Harcourt. A search by file number confirms the C of O and any encumbrance.',
  },
]

export function findArea(stateSlug: string, areaSlug: string): LaunchArea | undefined {
  return LAUNCH_AREAS.find((a) => a.stateSlug === stateSlug && a.slug === areaSlug)
}

export function areasForState(stateSlug: string): LaunchArea[] {
  return LAUNCH_AREAS.filter((a) => a.stateSlug === stateSlug)
}

export const LAUNCH_STATES = Array.from(
  new Map(LAUNCH_AREAS.map((a) => [a.stateSlug, { slug: a.stateSlug, name: a.state }])).values()
)
