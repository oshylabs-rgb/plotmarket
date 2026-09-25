/**
 * Buyer guides published at /guides/[slug]. Plain, factual, document literate.
 * Plotmarket shows title documents and does not verify them, so every guide
 * ends by sending the reader to the relevant registry.
 */

export interface GuideSection {
  heading: string
  paragraphs: string[]
  bullets?: string[]
}

export interface GuideFaq {
  question: string
  answer: string
}

export interface Guide {
  slug: string
  title: string
  description: string
  /** ISO date, shown on the page and used in the sitemap */
  updated: string
  readingMinutes: number
  sections: GuideSection[]
  faqs: GuideFaq[]
}

export const GUIDES: Guide[] = [
  {
    slug: 'nigerian-land-title-documents-explained',
    title: 'Nigerian land title documents explained',
    description:
      'What a Certificate of Occupancy, Governor’s Consent, Deed of Assignment, Excision, Gazette, Registered Survey, Allocation Letter and Family Receipt each prove, and which ones do not prove ownership on their own.',
    updated: '2026-09-13',
    readingMinutes: 8,
    sections: [
      {
        heading: 'Why the paper matters more than the fence',
        paragraphs: [
          'Under the Land Use Act 1978 all land in a state is vested in the governor, who grants rights of occupancy to individuals and companies. In the Federal Capital Territory the Minister of the FCT plays that role. What a buyer purchases is therefore a right over the land, and the document is the evidence of that right.',
          'Most land losses in Nigeria happen because money changes hands before anyone looks at the document. The seller shows a fence, a signboard and a survey beacon, and the buyer pays. On Plotmarket every listing states which document the seller holds, so the conversation starts with the paper.',
        ],
      },
      {
        heading: 'Certificate of Occupancy (C of O)',
        paragraphs: [
          'A Certificate of Occupancy is issued by the state governor, or by the FCT Minister in Abuja, as evidence of a statutory right of occupancy. It carries a file number, a term of years (commonly 99), the name of the holder and a survey plan.',
          'It is the strongest single document a seller can show, but copies are forged and genuine certificates are sometimes sold twice. Always confirm the file number at the state lands registry and check that the name on the certificate is the person selling to you.',
        ],
      },
      {
        heading: 'Governor’s Consent',
        paragraphs: [
          'Section 22 of the Land Use Act requires the governor’s consent before a holder of a statutory right of occupancy transfers, mortgages or leases it. When land that already has a C of O is sold, the buyer applies for Governor’s Consent, and the consent is endorsed on the Deed of Assignment.',
          'If a seller shows a C of O in someone else’s name and a Deed of Assignment without consent, the chain is incomplete. Ask whether consent was obtained for every transfer since the certificate was issued.',
        ],
      },
      {
        heading: 'Deed of Assignment',
        paragraphs: [
          'A Deed of Assignment is the contract that records a sale between the seller and the buyer. It describes the land, states the price and is signed by both parties and witnesses. It should be stamped at the stamp duties office and registered at the lands registry.',
          'A deed is only as strong as the title behind it. A registered deed backed by a C of O with Governor’s Consent is solid. A deed from a family without any government title only records that a sale happened, not that the family had the right to sell.',
        ],
      },
      {
        heading: 'Excision and Gazette',
        paragraphs: [
          'When a state government acquires land for public purposes it can later release part of it to the original community. That release is an excision. Once approved it is published in the state government Gazette with a number, the village name and the area released.',
          'Land sold as “excised” or “gazetted” should come with the Gazette number and an excision survey. Check that the specific plot falls inside the excised area. Land outside the excision, even in the same village, remains government land.',
        ],
      },
      {
        heading: 'Registered Survey',
        paragraphs: [
          'A survey plan drawn by a registered surveyor and lodged with the Office of the Surveyor General shows the exact coordinates and size of a plot. It proves where the land is, not who owns it.',
          'A registered survey is essential for a title search and for a charting report, which shows whether the plot sits on government acquisition, a road setback or a pipeline right of way. It should accompany every other document above.',
        ],
      },
      {
        heading: 'Allocation Letter',
        paragraphs: [
          'An allocation letter is issued by a government agency, an area council or an estate developer offering a plot to a named person, usually with conditions and a payment schedule. It precedes a C of O or Right of Occupancy.',
          'On its own an allocation letter is an offer, not a title. Ask what has been paid, whether the allocation has been regularised with the state or the FCTA, and whether a Right of Occupancy has been issued.',
        ],
      },
      {
        heading: 'Family Receipt',
        paragraphs: [
          'A family receipt is a purchase receipt from a family or community that holds land under customary tenure. It is common at the edges of Lagos, Ogun, Oyo and Rivers and is the weakest document on this list.',
          'The risks are that the family does not own the land, that another branch of the family has already sold the same plot, or that the land is under government acquisition. A family receipt should be followed by a Deed of Assignment, a registered survey and an application for a C of O.',
        ],
      },
      {
        heading: 'What to do before you pay',
        paragraphs: ['Whatever document the seller holds, the steps are the same.'],
        bullets: [
          'Get a copy of the document and the survey plan, and confirm the name on it matches the seller.',
          'Commission a title search at the state lands registry, or AGIS in Abuja, using the file number.',
          'Ask a registered surveyor for a charting report on the survey plan to rule out acquisition, setbacks and overlaps.',
          'Visit the land with the survey plan and confirm the beacons match the coordinates.',
          'Pay only through traceable channels, with a Deed of Assignment signed at the same time.',
        ],
      },
    ],
    faqs: [
      {
        question: 'Is a Certificate of Occupancy proof of ownership?',
        answer:
          'It is the strongest evidence that the named holder has a statutory right of occupancy over the land for the stated term. It is not proof that the person in front of you is that holder, or that the certificate has not been revoked, which is why a registry search is still needed.',
      },
      {
        question: 'Can I buy land with only a family receipt?',
        answer:
          'People do, but it is the highest risk purchase in the market. A family receipt shows a sale took place, not that the family had title. If you proceed, follow it with a Deed of Assignment, a registered survey and an application for a C of O, and confirm the land is not under government acquisition.',
      },
      {
        question: 'Does Plotmarket verify title documents?',
        answer:
          'No. Plotmarket requires every seller to state which document they hold and shows it on the listing. Buyers confirm the document at the relevant state registry before paying.',
      },
    ],
  },
  {
    slug: 'how-to-verify-land-title-in-nigeria',
    title: 'How to verify land title in Nigeria, step by step',
    description:
      'The registry search, charting report and site inspection that every buyer should complete before paying for land in Lagos, Abuja, Ogun, Oyo or Rivers.',
    updated: '2026-09-13',
    readingMinutes: 7,
    sections: [
      {
        heading: 'Step 1: Collect the documents',
        paragraphs: [
          'Ask the seller for a copy of the title document, the survey plan and any previous Deeds of Assignment. Note the file number on the C of O or Right of Occupancy, the Gazette number on an excision, and the surveyor’s name and plan number on the survey.',
          'A seller who will not release copies before payment is telling you something. Genuine sellers expect a search.',
        ],
      },
      {
        heading: 'Step 2: Search the lands registry',
        paragraphs: [
          'Every state keeps a register of titles. In Lagos the search is done at the Lands Registry in Alausa, Ikeja. In the FCT it is done through Abuja Geographic Information Systems (AGIS) in Garki, with a legal search confirmed against the physical file. Ogun uses the Bureau of Lands and Survey in Abeokuta, Oyo the Ministry of Lands in Ibadan, and Rivers the Ministry of Lands and Survey in Port Harcourt.',
          'The search confirms whether the title exists, whose name it is in, whether consent was granted for previous transfers, and whether there is a mortgage, caveat or revocation recorded against it. Fees and turnaround times change, so confirm them with the registry or your lawyer at the time.',
        ],
      },
      {
        heading: 'Step 3: Get a charting report',
        paragraphs: [
          'A charting report from the Office of the Surveyor General places the survey plan on the state master plan. It shows whether the plot lies on land under government acquisition, on a road or drainage setback, on a pipeline or power line right of way, or overlaps another registered plot.',
          'Many disputed sales along the Lekki Epe corridor and the Airport Road in Abuja would have been avoided by this single report.',
        ],
      },
      {
        heading: 'Step 4: Check the Gazette for excised land',
        paragraphs: [
          'If the seller relies on an Excision or Gazette, obtain the Gazette itself and confirm the number, the village and the area excised. Then confirm with the excision survey that the specific plot sits inside that area.',
        ],
      },
      {
        heading: 'Step 5: Inspect the land with the survey plan',
        paragraphs: [
          'Walk the land with a surveyor and the plan. Confirm the beacons match the coordinates and that the plot the seller points to is the plot on the paper. Ask neighbours who sold them their land and whether the same family or agent is involved.',
        ],
      },
      {
        heading: 'Step 6: Confirm the seller',
        paragraphs: [
          'Match the name on the title to the seller’s identification. For a company, obtain a CAC search and a board resolution authorising the sale. For family land, obtain evidence that the person signing is the family head or has the family’s written authority, and that the principal members consent.',
        ],
      },
      {
        heading: 'Step 7: Pay against a signed deed',
        paragraphs: [
          'Pay through a bank transfer to an account in the seller’s name, at the same time as the Deed of Assignment is signed and witnessed. Then stamp and register the deed and, where the land has a C of O, apply for Governor’s Consent. Where it has no government title, apply for a C of O.',
        ],
      },
    ],
    faqs: [
      {
        question: 'How long does a land title search take?',
        answer:
          'It varies by state and by whether the file is digitised. AGIS legal searches in Abuja can return within days. Physical searches in Lagos and other states typically take longer. Ask the registry or your lawyer for a current estimate.',
      },
      {
        question: 'Can I do the search myself or do I need a lawyer?',
        answer:
          'You can apply in person in most states, but a property lawyer knows the registry process, can read the file and will spot an incomplete chain of consent. For any purchase above a few million naira the fee is small next to the risk.',
      },
      {
        question: 'What does Plotmarket show on a listing?',
        answer:
          'The title document the seller states they hold, the seller’s name and type, the location and price, photos and where available 360 degree media. Plotmarket does not perform searches or verify documents.',
      },
    ],
  },
  {
    slug: 'buying-land-in-nigeria-from-abroad',
    title: 'Buying land in Nigeria from abroad without flying home',
    description:
      'A practical guide for Nigerians in the UK, US, Canada and Europe: how to inspect, verify and pay for land in Nigeria without travelling, and the frauds to avoid.',
    updated: '2026-09-13',
    readingMinutes: 6,
    sections: [
      {
        heading: 'The problem is not money, it is sight',
        paragraphs: [
          'Nigerians abroad send home tens of billions of dollars a year and a large share of it goes into land and building. The losses come from buying blind: a relative or agent is sent to inspect, a receipt is photographed, and the money is sent before anyone has seen a title document or the land itself.',
        ],
      },
      {
        heading: 'Start with the document, not the location',
        paragraphs: [
          'Before you discuss price, ask which title document the seller holds and request a copy. A Certificate of Occupancy, Governor’s Consent or a Gazetted excision can be checked from anywhere through a lawyer. A family receipt or an allocation letter cannot be checked in the same way and should be treated as unproven.',
          'On Plotmarket the title document is stated on every listing and can be filtered, so you can exclude the weakest documents before you spend time on a listing.',
        ],
      },
      {
        heading: 'Inspect remotely, then independently',
        paragraphs: [
          'Ask for 360 degree photos or a video walkthrough with the survey plan visible, and for a live video call from the land showing the beacons and the access road. Then commission an independent surveyor, not one introduced by the seller, to visit the land with the plan and confirm the beacons and the surroundings.',
        ],
      },
      {
        heading: 'Use a lawyer who is not the seller’s lawyer',
        paragraphs: [
          'Engage a Nigerian property lawyer directly, agree the fee in writing, and have them run the registry search and charting report described in our verification guide. Ask them to confirm the seller’s identity against the title and to prepare the Deed of Assignment.',
        ],
      },
      {
        heading: 'Pay in a way you can trace',
        paragraphs: [
          'Send money to the seller’s own bank account, never to an agent’s personal account, and pay against the signed deed. Where possible, route payment through your lawyer’s client account so it is released only when the documents are in hand. Keep every receipt and the transfer references.',
        ],
      },
      {
        heading: 'Frauds to recognise',
        paragraphs: ['These patterns recur in Nairaland threads and EFCC prosecutions.'],
        bullets: [
          'The same plot sold to several buyers, each with a family receipt.',
          'A genuine C of O photographed from a stranger’s file and presented as the seller’s own.',
          'An estate selling plots on land still under government acquisition, with a promise that excision is “in process”.',
          'A relative or agent who inspects a different plot from the one being sold.',
          'Pressure to pay a deposit within hours to “hold” the land.',
        ],
      },
      {
        heading: 'After you buy',
        paragraphs: [
          'Register the Deed of Assignment, apply for Governor’s Consent or a C of O, fence the land and put a signboard with your lawyer’s contact on it. Visit or have it inspected at least once a year. Unfenced land bought from abroad is the easiest to resell to someone else.',
        ],
      },
    ],
    faqs: [
      {
        question: 'Can a lawyer in Nigeria do the registry search without me?',
        answer:
          'Yes. Give them copies of the documents and a written instruction. They can apply for the search and the charting report, and report back with the results and the file references.',
      },
      {
        question: 'Should I buy through a family member?',
        answer:
          'A family member can help with inspection, but the title search, the surveyor and the payment should go through professionals you instruct directly. Many disputes between relatives start with land bought in someone else’s name for convenience.',
      },
      {
        question: 'Does Plotmarket handle payments or escrow?',
        answer:
          'Not for land purchases. Plotmarket charges listers for listing plans through Paystack. Purchase payments happen between buyer and seller, ideally through a lawyer’s client account.',
      },
    ],
  },
]

export function findGuide(slug: string): Guide | undefined {
  return GUIDES.find((g) => g.slug === slug)
}
