/**
 * Every word of event copy lives here so organisers can edit the site without
 * touching components. Sourced from the "IIITN Demo Days" brief.
 */

export const event = {
  name: 'IIITN Demo Days',
  year: '2026',
  tagline: 'Find the problem. Build the fix. Pitch it.',
  host: 'Indian Institute of Information Technology, Nagpur',
  venue: 'Seminar Hall, IIIT Nagpur, Maharashtra, India',
  eventDate: '17 September 2026',
  prizePool: '₹15,000',
  registrationClosesAt: '2026-09-15T20:00:00+05:30',
  registrationClosesLabel: '15 September 2026, 8:00 PM IST',
  pptTemplateUrl: '/DemoDaysTemplate.pptx',
  presentedBy: 'CRISPR · IIIT Nagpur',
};

export const heroStats = [
  { label: 'Event day', value: '17 Sep', note: '2026' },
  { label: 'Prize pool', value: '₹15,000', note: 'cash' },
  { label: 'Team size', value: '2–4', note: 'members' },
  { label: 'Venue', value: 'Seminar Hall', note: 'IIITN campus' },
];

export const about = {
  heading: 'What is Demo Days?',
  paragraphs: [
    'IIITN Demo Days is a platform for students to identify real-world challenges, innovate practical solutions, and present their ideas to create meaningful impact within and outside the IIIT Nagpur community. We believe the best problem solvers are the ones facing the problems every day — this event puts them in charge of fixing campus life, academics and student welfare.',
    'Unlike a traditional hackathon, Demo Days welcomes both ideas and prototypes. Whether you are at the concept stage or already have a working MVP, this is the space to show your creativity and problem-solving. The top ideas receive mentorship, further support, and the opportunity to scale.',
  ],
  highlights: [
    'Ideas are welcome — a prototype is optional, not required.',
    'Top teams get a mentor for a one-month MVP build.',
    'Judged on innovation, implementation, scalability and student impact.',
  ],
};

export const stages = [
  {
    index: '01',
    title: 'Online Round',
    when: 'Submission via Unstop',
    body: 'Every team submits a PowerPoint presentation of their idea. Submissions must land within the allotted window — late decks are not reviewed.',
    points: [
      'Submit your idea deck using the official template.',
      'The top 10 performers qualify for the offline round on campus.',
    ],
  },
  {
    index: '02',
    title: 'Preliminary Round · On campus',
    when: '17 September 2026 · Seminar Hall, IIITN',
    body: 'A 3-hour on-site round at the IIITN campus. Teams are evaluated on both the core idea and its implementation, with 10–15 minutes each to present in the seminar hall.',
    points: [
      'Shortlisted teams present a detailed version of their idea live.',
      'Top teams move into the mentorship phase.',
      'Each selected team is paired with a mentor for a 1-month MVP build.',
    ],
  },
  {
    index: '03',
    title: 'Main Round · Finals',
    when: 'October 2026 · date to be announced',
    body: 'Teams submit their final project as a GitHub repository or a live deployed application link, then present it live on the scheduled date.',
    points: [
      'Evaluated on innovation, implementation, scalability and community impact.',
      'Bring your own laptop and setup for all offline rounds.',
    ],
  },
];

export const prizes = [
  { place: 'Winner', amount: '₹7,000', note: 'Cash prize + mentorship', featured: true },
  { place: 'First runner-up', amount: '₹5,000', note: 'Cash prize + mentorship' },
  { place: 'Second runner-up', amount: '₹3,000', note: 'Cash prize' },
];

export const eligibility = [
  'Open to all students pursuing B.Tech.',
  'Teams of 2 to 4 members.',
  'Participate with or without a working prototype.',
  'Bring your own laptop and setup for the offline rounds.',
];

export const rules = [
  'Use sensible, appropriate team names — offensive names lead to disqualification.',
  'Do not share your idea publicly while the competition is running.',
  'Plagiarism or malpractice results in immediate disqualification.',
  'The organisers’ decisions are final and binding.',
  'Mentors are assigned only to teams selected in the Prelims.',
  'Final work must be submitted through GitHub or a live deployment link.',
];

export const dates = [
  { label: 'Registration closes', value: '15 September 2026, 8:00 PM IST', locked: false },
  { label: 'Online submission', value: 'Announced with shortlist', locked: true },
  { label: 'Prelims · on campus', value: '17 September 2026', locked: false },
  { label: 'Mentorship phase', value: '1 month post-Prelims', locked: true },
  { label: 'Mains submission', value: 'October 2026', locked: true },
];

export const faqs = [
  {
    q: 'Do I need a working product to enter?',
    a: 'No. Demo Days accepts ideas and prototypes equally. A clear problem statement and a credible plan can beat a half-built app.',
  },
  {
    q: 'What do I upload while registering?',
    a: 'Your idea presentation, built on the official Demo Days template. PDF, PPT and PPTX are all accepted, up to 25 MB.',
  },
  {
    q: 'Can I register alone?',
    a: 'You need at least 2 members to register — the form accepts teams of 2 to 4. Every member needs their name and BT ID.',
  },
  {
    q: 'What happens after I submit?',
    a: 'You get an on-screen confirmation and your team is recorded under its team name — organisers track every team by name through the rounds.',
  },
  {
    q: 'Can I edit my submission later?',
    a: 'Re-submitting is not automatic. Write to the organisers with your team name and they will update your entry.',
  },
];
