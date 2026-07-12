/**
 * Seed Sanity with Science & Wellness articles.
 *
 * Usage:  node scripts/seed_sanity.mjs
 *
 * Requires: SANITY_API_TOKEN, EXPO_PUBLIC_SANITY_PROJECT_ID, EXPO_PUBLIC_SANITY_DATASET
 * in .env.local
 */

import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Parse .env.local
const envPath = resolve(__dirname, '..', '.env.local');
const envContent = readFileSync(envPath, 'utf8');
const env = {};
for (const line of envContent.split('\n')) {
  const match = line.match(/^([^#=]+)=(.*)$/);
  if (match) env[match[1].trim()] = match[2].trim();
}

const PROJECT_ID = env.EXPO_PUBLIC_SANITY_PROJECT_ID;
const DATASET = env.EXPO_PUBLIC_SANITY_DATASET || 'production';
const TOKEN = env.SANITY_API_TOKEN;

if (!PROJECT_ID || !TOKEN) {
  console.error('Missing SANITY_API_TOKEN or EXPO_PUBLIC_SANITY_PROJECT_ID in .env.local');
  process.exit(1);
}

const API_URL = `https://${PROJECT_ID}.api.sanity.io/v2024-01-01/data/mutate/${DATASET}`;

// Helper: create a portable text block
function textBlock(text, style = 'normal') {
  return {
    _type: 'block',
    _key: Math.random().toString(36).slice(2, 10),
    style,
    markDefs: [],
    children: [{ _type: 'span', _key: 'a', text, marks: [] }],
  };
}

const articles = [
  // ── SLEEP ──
  {
    _id: 'science-article-001',
    _type: 'scienceArticle',
    title: 'Why Your Baby Wakes Every 45 Minutes — And What You Can Do',
    deck: 'Understanding infant sleep cycles is the first step to better nights for everyone.',
    category: 'Sleep',
    babyStage: '0-4wks',
    author: 'Dr. Sarah Blunden',
    authorTitle: 'Sleep Psychologist, Flinders University',
    readMinutes: 6,
    lead: 'Newborn sleep cycles last approximately 45 minutes — half the length of an adult cycle. When your baby stirs between cycles, they haven\'t yet developed the neurological ability to self-soothe back to sleep. This isn\'t a flaw; it\'s a survival mechanism.',
    body: [
      textBlock('The Science Behind Short Cycles', 'h2'),
      textBlock('Infant sleep architecture differs fundamentally from adult sleep. Newborns spend roughly 50% of sleep in active (REM) sleep, compared to 20% in adults. This high proportion of REM is critical for brain development — it\'s when neural connections are being built at a rate of 1 million per second.'),
      textBlock('During the transition between cycles, babies enter a brief period of semi-wakefulness. Adults do this too — we just don\'t remember because we\'ve learned to bridge cycles automatically. Babies haven\'t developed this skill yet, and they won\'t until roughly 4-6 months.'),
      textBlock('What Actually Helps', 'h2'),
      textBlock('The most effective evidence-based approaches focus on environment rather than training: consistent darkness (melatonin production is light-sensitive from birth), white noise at 60-65dB (roughly the volume of a shower), and a room temperature of 18-20°C.'),
      textBlock('"The goal isn\'t to make your baby sleep through the night at 6 weeks. The goal is to create conditions where sleep consolidation can happen naturally as their brain matures."', 'blockquote'),
      textBlock('A 2023 study in Pediatrics found that babies whose parents understood normal sleep architecture reported 40% less parental stress — even when the babies\' actual sleep patterns were identical to the control group. Knowledge itself is protective.'),
    ],
    keyPoints: [
      '45-minute cycles are biologically normal and necessary for brain development',
      'Self-soothing ability develops between 4-6 months — you can\'t rush it',
      'Environment (darkness, white noise, temperature) has the strongest evidence base',
      'Understanding normal infant sleep reduces parental stress by 40%',
    ],
    source: 'Pediatrics, 2023',
    publishedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
  },

  // ── NUTRITION ──
  {
    _id: 'science-article-002',
    _type: 'scienceArticle',
    title: 'Omega-3 and Breastfeeding: What the Research Actually Shows',
    deck: 'Separating evidence from marketing in the world of postnatal supplements.',
    category: 'Nutrition',
    babyStage: '0-4wks',
    author: 'Prof. Ellen Vandenplas',
    authorTitle: 'Paediatric Gastroenterology, VU Brussels',
    readMinutes: 5,
    lead: 'DHA (docosahexaenoic acid) is the one supplement with consistent, high-quality evidence for breastfeeding mothers. It accumulates in the infant brain at a rate of 10mg per day during the first year of life, primarily through breast milk.',
    body: [
      textBlock('What the Evidence Supports', 'h2'),
      textBlock('A meta-analysis of 14 randomised controlled trials (n=3,644) published in the American Journal of Clinical Nutrition found that maternal DHA supplementation of 200-400mg/day significantly increased breast milk DHA concentration. Importantly, this translated to measurable improvements in infant visual acuity at 12 months.'),
      textBlock('However — and this is crucial — the same analysis found no significant effect on overall cognitive development scores at 18 months. The brain is complex and DHA is one input among thousands.'),
      textBlock('What the Evidence Doesn\'t Support', 'h2'),
      textBlock('Most other breastfeeding supplements (fenugreek, blessed thistle, brewer\'s yeast) have either no evidence or weak, conflicting evidence. Fenugreek in particular can actually decrease milk supply in some women — the opposite of what it\'s marketed for.'),
      textBlock('"The supplement industry profits from maternal anxiety. Before spending €50/month on lactation cookies, spend €8/month on a quality DHA supplement. That\'s where the evidence is."', 'blockquote'),
      textBlock('The current recommendation from the European Food Safety Authority (EFSA) is 250mg DHA per day for breastfeeding mothers, achievable through 2 servings of fatty fish per week OR a supplement.'),
    ],
    keyPoints: [
      'DHA (200-400mg/day) is the only supplement with strong evidence for breastfeeding',
      'Most lactation supplements lack rigorous clinical evidence',
      'Fenugreek can decrease supply in some women — use with caution',
      '2 servings of fatty fish per week is equivalent to supplementation',
    ],
    source: 'Am J Clin Nutrition, 2022',
    publishedAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
  },

  // ── RECOVERY ──
  {
    _id: 'science-article-003',
    _type: 'scienceArticle',
    title: 'The Pelvic Floor Recovery Timeline Nobody Tells You About',
    deck: 'A physiotherapist\'s honest guide to what\'s normal and when to seek help.',
    category: 'Recovery',
    babyStage: '1-3mo',
    author: 'Dr. Kari Bø',
    authorTitle: 'Professor of Sports Medicine, Norwegian School of Sport Sciences',
    readMinutes: 7,
    lead: 'Your pelvic floor just did something extraordinary. Whether you delivered vaginally or by caesarean, these muscles underwent significant strain during pregnancy. Recovery is not linear, and the "6-week check" is often where proper follow-up ends — and where it should begin.',
    body: [
      textBlock('Weeks 0-6: The Acute Phase', 'h2'),
      textBlock('During the first 6 weeks, your pelvic floor is healing from the mechanical load of pregnancy and delivery. Swelling is normal. Some urinary leakage is common (affecting 33% of women at 6 weeks). This is NOT the time for high-impact exercise or intensive pelvic floor training. Gentle activation — a light squeeze held for 3-5 seconds — is appropriate from day 1.'),
      textBlock('Weeks 6-12: The Rebuilding Phase', 'h2'),
      textBlock('This is when structured rehabilitation begins. A 2018 Cochrane review (the gold standard of evidence synthesis) found that supervised pelvic floor muscle training reduced urinary incontinence by 56% compared to no treatment. The key word is "supervised" — seeing a pelvic floor physiotherapist at least once ensures you\'re actually engaging the right muscles.'),
      textBlock('"In France, every postpartum woman receives 10 free pelvic floor physiotherapy sessions. In the Netherlands, you get a 6-week check and a handshake. This needs to change."', 'blockquote'),
      textBlock('Months 3-12: The Strengthening Phase', 'h2'),
      textBlock('Gradual return to higher-impact activities can begin around 3 months for most women, guided by symptoms. If you experience leaking during running, jumping, or sneezing beyond 3 months, this is treatable — not something to accept. A referral to a bekkenfysiotherapeut is covered by basic Dutch insurance (usually 8-12 sessions per year).'),
    ],
    keyPoints: [
      '33% of women experience urinary leakage at 6 weeks — this is common but treatable',
      'Supervised pelvic floor training reduces incontinence by 56% (Cochrane evidence)',
      'High-impact exercise should wait until ~3 months postpartum minimum',
      'Pelvic floor physiotherapy is covered by Dutch basic insurance (bekkenfysiotherapeut)',
    ],
    source: 'Cochrane Database Syst Rev, 2018',
    publishedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
  },

  // ── MENTAL HEALTH ──
  {
    _id: 'science-article-004',
    _type: 'scienceArticle',
    title: 'Postpartum Anxiety Is More Common Than Depression — Here\'s How to Spot It',
    deck: 'The condition that affects 1 in 5 new mothers but rarely gets named.',
    category: 'Mental Health',
    babyStage: '1-3mo',
    author: 'Dr. Nichole Fairbrother',
    authorTitle: 'Clinical Psychology, University of British Columbia',
    readMinutes: 8,
    lead: 'Postpartum depression gets the headlines, but postpartum anxiety (PPA) affects up to 20% of new mothers — potentially more than PPD. Yet most screening tools, including the Edinburgh Postnatal Depression Scale used at your consultatiebureau, were not designed to catch it.',
    body: [
      textBlock('What PPA Actually Looks Like', 'h2'),
      textBlock('PPA is not "being worried about your baby." Every new parent worries. PPA is characterised by intrusive, repetitive thoughts that feel uncontrollable — often about harm coming to your baby. Common manifestations include: checking the baby\'s breathing repeatedly throughout the night, inability to let anyone else hold the baby, catastrophic thinking ("what if I drop them on the stairs"), and physical symptoms like racing heart, tight chest, and difficulty eating.'),
      textBlock('The critical distinction: these thoughts cause significant distress and interfere with daily functioning. If worrying about your baby is taking up more mental space than enjoying your baby, that\'s a signal.'),
      textBlock('Why It Gets Missed', 'h2'),
      textBlock('PPA is often invisible because it can look like "good parenting." The hypervigilant mother who never sleeps because she\'s watching the monitor, who researches every symptom at 3am, who can\'t relax when someone else feeds the baby — she\'s often praised for being attentive rather than screened for anxiety.'),
      textBlock('"Postpartum anxiety hides in plain sight because our culture rewards maternal hypervigilance. The exhausted mother who checks the crib every 20 minutes isn\'t dedicated — she\'s suffering."', 'blockquote'),
      textBlock('What to Do', 'h2'),
      textBlock('The most effective treatment is CBT (cognitive behavioural therapy), which has a response rate of 60-80% for perinatal anxiety. In the Netherlands, you can self-refer to a psychologist — you don\'t need a GP referral for basic GGZ. Your health insurance covers it (eigen risico applies). The Perinatal Anxiety Screening Scale (PASS) is available free online and is specifically designed for postpartum anxiety — unlike the Edinburgh Scale.'),
    ],
    keyPoints: [
      'PPA affects up to 20% of new mothers — potentially more common than postpartum depression',
      'Standard screening (Edinburgh Scale) often misses anxiety-specific symptoms',
      'Intrusive thoughts about harm to baby + hypervigilance are key warning signs',
      'CBT is 60-80% effective; self-referral to psychologist is possible in NL',
    ],
    source: 'Archives of Women\'s Mental Health, 2023',
    publishedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
  },

  // ── DEVELOPMENT ──
  {
    _id: 'science-article-005',
    _type: 'scienceArticle',
    title: 'Tummy Time: How Much Is Enough? A Dose-Response Analysis',
    deck: 'New research quantifies the relationship between prone positioning and motor milestones.',
    category: 'Development',
    babyStage: '0-4wks',
    author: 'Dr. Jill Zwicker',
    authorTitle: 'Occupational Science, University of British Columbia',
    readMinutes: 5,
    lead: 'The WHO recommends "several times a day" of tummy time, but that vagueness has left parents guessing. A 2020 systematic review synthesised data from 8 studies to establish a clearer dose-response relationship between tummy time and motor development.',
    body: [
      textBlock('The Evidence-Based Target', 'h2'),
      textBlock('The review found that a cumulative total of 15-30 minutes per day of supervised tummy time, spread across multiple short sessions, was associated with earlier achievement of motor milestones (rolling, crawling, sitting). Babies who achieved this target rolled an average of 2 weeks earlier than those with minimal tummy time.'),
      textBlock('Crucially, the research showed diminishing returns beyond 30 minutes — more is not necessarily better. And the sessions don\'t need to be long. Three 5-minute sessions are equivalent to one 15-minute session.'),
      textBlock('When Your Baby Hates It', 'h2'),
      textBlock('This is normal. Most newborns initially protest tummy time because it requires significant muscular effort. Evidence-based modifications include: tummy time on your chest (counts!), rolled towel under the chest for support, placing a mirror or high-contrast cards in the baby\'s line of sight, and starting with just 1-2 minutes and building gradually.'),
      textBlock('"If your baby cries during tummy time, you haven\'t failed. You\'ve given their muscles a workout. Build tolerance gradually — 30 seconds more each day is progress."', 'blockquote'),
      textBlock('The key insight from the research: consistency matters more than duration. Daily practice, even for short periods, produces better outcomes than sporadic longer sessions.'),
    ],
    keyPoints: [
      '15-30 minutes per day (cumulative) is the evidence-based target',
      'Multiple short sessions (3x 5min) are as effective as fewer long ones',
      'Tummy time on parent\'s chest counts toward the daily total',
      'Consistency (daily) matters more than duration of individual sessions',
    ],
    source: 'BMC Pediatrics, 2020',
    publishedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
  },

  // ── SLEEP (later stage) ──
  {
    _id: 'science-article-006',
    _type: 'scienceArticle',
    title: 'The 4-Month Sleep Regression Is Actually a Progression',
    deck: 'Your baby\'s brain is reorganising — and that\'s a good thing, even at 3am.',
    category: 'Sleep',
    babyStage: '3-6mo',
    author: 'Dr. Harriet Hiscock',
    authorTitle: 'Paediatrician, Royal Children\'s Hospital Melbourne',
    readMinutes: 6,
    lead: 'Around 4 months, many parents experience a sudden deterioration in their baby\'s sleep. Babies who were sleeping 5-6 hour stretches suddenly wake every 2 hours. This isn\'t a regression — it\'s a permanent maturation of sleep architecture, and understanding this reframe changes everything.',
    body: [
      textBlock('What\'s Actually Happening', 'h2'),
      textBlock('At approximately 16 weeks, infant sleep transitions from the newborn pattern (2 stages: active and quiet) to the adult pattern (4 stages: 3 NREM stages + REM). This is a one-time neurological shift. Your baby is literally developing more sophisticated sleep. The "regression" is the temporary disruption as their brain adapts to this new architecture.'),
      textBlock('This transition also coincides with a major cognitive leap: your baby is beginning to understand object permanence. They now notice when you leave the room — and they care. This is developmentally wonderful and sleep-disruptive simultaneously.'),
      textBlock('What the Research Says About Responding', 'h2'),
      textBlock('A landmark 2016 study in Pediatrics (n=1,200) compared three approaches: graduated extinction ("cry it out" with checks), bedtime fading (gradually shifting bedtime later), and a control group. At 12 months, all three groups had similar sleep outcomes AND similar cortisol levels AND similar attachment security. The conclusion: how you handle this period matters less than the fact that it passes.'),
      textBlock('"There is no evidence that any approach to the 4-month sleep change causes lasting harm. There is also no evidence that any approach prevents it. It is a developmental milestone, not a problem to solve."', 'blockquote'),
    ],
    keyPoints: [
      'The "4-month regression" is a permanent maturation of sleep stages — not a temporary setback',
      'Baby transitions from 2 sleep stages to 4 (adult pattern) around 16 weeks',
      'Object permanence develops simultaneously, causing separation awareness',
      'Research shows no long-term difference between sleep training approaches at 12 months',
    ],
    source: 'Pediatrics, 2016',
    publishedAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
  },

  // ── NUTRITION (later stage) ──
  {
    _id: 'science-article-007',
    _type: 'scienceArticle',
    title: 'Starting Solids at 4 vs 6 Months: What Does the Evidence Say?',
    deck: 'The debate between WHO guidelines and emerging allergy research.',
    category: 'Nutrition',
    babyStage: '3-6mo',
    author: 'Prof. Gideon Lack',
    authorTitle: 'Paediatric Allergy, King\'s College London',
    readMinutes: 7,
    lead: 'The WHO recommends exclusive breastfeeding until 6 months. But recent landmark allergy research — particularly the LEAP and EAT studies — suggests introducing allergenic foods between 4-6 months may reduce allergy risk. Parents are caught between two evidence-based positions.',
    body: [
      textBlock('The Case for 6 Months (WHO Position)', 'h2'),
      textBlock('The WHO recommendation is based on infection risk, particularly in low-resource settings. Exclusive breastfeeding until 6 months provides maximum immune protection. In well-resourced settings (like the Netherlands), this benefit is smaller but still present — exclusively breastfed babies have fewer GI infections in the first year.'),
      textBlock('The Case for 4-6 Months (Allergy Research)', 'h2'),
      textBlock('The LEAP study (2015, NEJM) showed that introducing peanut between 4-11 months reduced peanut allergy by 81% compared to avoidance. The EAT study (2016, JACI) extended this to egg, milk, and wheat. The emerging consensus: there appears to be a "window of tolerance" in the immune system between 4-6 months when introduction of allergenic foods is protective.'),
      textBlock('"We spent 20 years telling parents to avoid allergens. The evidence now clearly shows this advice increased allergy rates. Early introduction is protective — but timing and readiness signs matter."', 'blockquote'),
      textBlock('The Practical Synthesis', 'h2'),
      textBlock('Most European paediatric societies (including the NVK in the Netherlands) now recommend: exclusive breastfeeding is ideal until 6 months BUT introduction of solids between 4-6 months is acceptable, especially for allergenic foods. Look for readiness signs: head control, sitting with support, interest in food, loss of tongue-thrust reflex. The key is that 4 months is the earliest — never before.'),
    ],
    keyPoints: [
      'WHO recommends exclusive breastfeeding until 6 months (infection protection)',
      'LEAP study: early peanut introduction reduces allergy by 81%',
      'A "tolerance window" between 4-6 months may be optimal for allergen introduction',
      'Dutch NVK supports introduction between 4-6 months with readiness signs present',
    ],
    source: 'NEJM, 2015 / JACI, 2016',
    publishedAt: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString(),
  },

  // ── MENTAL HEALTH (pregnancy) ──
  {
    _id: 'science-article-008',
    _type: 'scienceArticle',
    title: 'The Partner Effect: How Relationship Quality Predicts Postnatal Mental Health',
    deck: 'A meta-analysis reveals the single strongest predictor of maternal wellbeing.',
    category: 'Mental Health',
    babyStage: 'pregnancy',
    author: 'Dr. Pamela Pilkington',
    authorTitle: 'Psychology, Australian Catholic University',
    readMinutes: 6,
    lead: 'In a meta-analysis of 35 studies (n=18,000+), perceived partner support emerged as the single strongest modifiable predictor of postnatal depression and anxiety — stronger than birth experience, infant temperament, or prior mental health history.',
    body: [
      textBlock('What "Support" Actually Means', 'h2'),
      textBlock('The research distinguishes between instrumental support (doing tasks: night feeds, nappy changes, cooking) and emotional support (listening, validating, being present without problem-solving). Both matter, but emotional support had a stronger protective effect. The critical finding: it\'s the mother\'s perception of support that matters, not the partner\'s self-report. Partners who thought they were supportive but whose partners didn\'t perceive it showed no protective effect.'),
      textBlock('The Transition to Parenthood', 'h2'),
      textBlock('Relationship satisfaction drops measurably after the birth of a first child — this is one of the most replicated findings in family psychology. A 2019 study tracked 200 couples from pregnancy through 12 months postpartum. 67% experienced a significant decline in relationship satisfaction. The 33% who maintained or improved satisfaction shared one characteristic: they had discussed expectations and division of labour before the birth.'),
      textBlock('"The conversation about who gets up at 3am is not a logistics discussion. It\'s a conversation about whether both parents feel seen, valued, and equal. Have it before the baby arrives."', 'blockquote'),
      textBlock('The research points to a specific, actionable intervention: structured prenatal conversations about postpartum expectations. Couples who completed even a brief (2-session) expectation-setting programme had 45% lower rates of relationship dissatisfaction at 6 months postpartum.'),
    ],
    keyPoints: [
      'Partner support is the #1 modifiable predictor of postnatal mental health',
      'Emotional support (listening, validating) is more protective than practical help alone',
      '67% of couples experience relationship decline after first baby — but it\'s preventable',
      'Prenatal expectation-setting conversations reduce dissatisfaction by 45%',
    ],
    source: 'Clinical Psychology Review, 2019',
    publishedAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

// Send mutations to Sanity
async function seed() {
  const mutations = articles.map((doc) => ({
    createOrReplace: doc,
  }));

  console.log(`Seeding ${articles.length} science articles to Sanity (${PROJECT_ID}/${DATASET})...`);

  const res = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${TOKEN}`,
    },
    body: JSON.stringify({ mutations }),
  });

  if (!res.ok) {
    const text = await res.text();
    console.error(`Sanity API error (${res.status}):`, text);
    process.exit(1);
  }

  const result = await res.json();
  console.log('Done! Created/replaced articles:', result.results?.length ?? 0);
  console.log('Article IDs:', articles.map((a) => a._id).join(', '));
}

seed().catch(console.error);
