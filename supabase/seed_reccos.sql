-- ============================================================
-- Seed data: Contributors + Recco Posts
-- Run this in Supabase SQL Editor
-- ============================================================

-- 1. CONTRIBUTORS (5 verified experts)
INSERT INTO contributors (id, display_name, handle, verified, avatar_color) VALUES
  ('c0000001-0000-0000-0000-000000000001', 'Sophie Laurent', 'sophielaurent', true, '#E8389C'),
  ('c0000001-0000-0000-0000-000000000002', 'Dr. Emma van Dijk', 'emmavandijk', true, '#9878C8'),
  ('c0000001-0000-0000-0000-000000000003', 'Nora Bakker', 'norabakker', true, '#00B8C8'),
  ('c0000001-0000-0000-0000-000000000004', 'Lisa Chen', 'lisachen', true, '#FF7A00'),
  ('c0000001-0000-0000-0000-000000000005', 'Mila de Vries', 'miladevries', false, '#B8D830')
ON CONFLICT (id) DO NOTHING;

-- 2. RECCO POSTS (12 posts across 4 categories)

-- === CLASSES (3 posts) ===
INSERT INTO recco_posts (contributor_id, category, title, body, link_url, link_label, published_at) VALUES
(
  'c0000001-0000-0000-0000-000000000001',
  'classes',
  'Mama Moves — Postnatal Pilates in Oud-Zuid',
  'I started Mama Moves at 6 weeks postpartum and it was genuinely the best thing I did for myself. The instructor, Lieke, is a pelvic floor specialist and tailors every session to where you are in recovery. Small groups (max 6 mamas), babies welcome on mats next to you. They also have a Saturday partner class if your SO wants to join. The studio is gorgeous — bright, airy, right by Vondelpark. Book the intro package (3 sessions for €45) to try it out.',
  'https://www.mamamoves.nl',
  'Book a class',
  now() - interval '2 days'
),
(
  'c0000001-0000-0000-0000-000000000003',
  'classes',
  'Baby Sensory Amsterdam — Worth Every Minute',
  'If your baby is 0-13 months, Baby Sensory is incredible. It''s not just music and lights — it''s a structured developmental play programme backed by research. Each week has a theme (textures, sounds, movement). My 4-month-old was completely captivated. The Amsterdam Centrum class runs Tuesday mornings and Thursday afternoons. What I loved most: the facilitator explains WHY each activity matters for brain development. Also a great way to meet other mamas naturally.',
  'https://www.babysensory.nl/amsterdam',
  'Find a session',
  now() - interval '5 days'
),
(
  'c0000001-0000-0000-0000-000000000005',
  'classes',
  'Hypnobirthing Course with Anna — Even Postpartum',
  'I know hypnobirthing sounds like it''s only for before birth, but Anna''s course includes 2 postnatal sessions on breath work for anxiety and sleep. The techniques are science-based (diaphragmatic breathing, visualisation) and I use them every single night. She runs 4-week evening courses in De Pijp, €180 per couple. Even if you''ve already given birth, the postnatal module alone is worth it.',
  'https://www.birthwithannadam.nl',
  'View schedule',
  now() - interval '8 days'
),

-- === PRODUCTS (3 posts) ===
(
  'c0000001-0000-0000-0000-000000000004',
  'products',
  'The Only Carrier You Need: Ergobaby Omni Breeze',
  'I tested 4 carriers and the Ergobaby Omni Breeze won by a mile. The mesh is genuinely breathable (critical for Dutch summer), it has lumbar support (your back will thank you), and it grows with your baby from newborn to 20kg without an insert. Yes, it''s €190 but you will use it every single day for 2+ years. Pro tip: buy from Baby-Dump — they have a 100-day return policy if it doesn''t work for you.',
  'https://www.ergobaby.nl/omni-breeze',
  'View carrier',
  now() - interval '1 day'
),
(
  'c0000001-0000-0000-0000-000000000001',
  'products',
  'Hatch Rest Sound Machine — The Sleep Game Changer',
  'We tried white noise from a phone, a cheap Amazon machine, and then the Hatch Rest. Night and day difference. The Hatch lets you programme routines (dim red light + deep rain sound at 19:00 = sleep cue), control it from your phone without entering the room, and gradually shift wake-up time. It''s €69 and I would pay triple. If you''re only going to buy ONE sleep product, make it this.',
  'https://www.hatchworldwide.com',
  'Shop Hatch',
  now() - interval '3 days'
),
(
  'c0000001-0000-0000-0000-000000000002',
  'products',
  'Frida Mom Postpartum Recovery Kit — Honest Review',
  'Nobody talks about postpartum recovery enough so here goes: the Frida Mom kit has peri bottles, cooling pad liners, disposable underwear, and witch hazel foam. It sounds unglamorous but these products made the first 2 weeks bearable. The peri bottle alone is essential — way better than toilet paper post-delivery. Available at Bol.com for €35. Buy it before your due date, future you will be grateful.',
  'https://www.bol.com/nl/p/frida-mom-postpartum-recovery',
  'Buy on Bol',
  now() - interval '10 days'
),

-- === WELLNESS (3 posts) ===
(
  'c0000001-0000-0000-0000-000000000002',
  'wellness',
  'Postpartum Doula: Why I Hired One and You Should Too',
  'A postpartum doula is not a luxury — it''s a necessity that our healthcare system forgot to include. Mine (Femke from Amsterdam Doulas) came 3x/week for the first month. She helped with breastfeeding positions, showed my partner how to do the ''magic hold'' for colic, cooked one-pot meals I could reheat, and most importantly — she normalised everything I was feeling. Cost: €45/hour, most doulas offer packages around €600 for 15 hours. Your kraamzorg ends after 8 days; a doula bridges the gap.',
  'https://www.amsterdamdoulas.nl',
  'Find a doula',
  now() - interval '4 days'
),
(
  'c0000001-0000-0000-0000-000000000003',
  'wellness',
  'Cold Water Swimming for New Mums — It Actually Works',
  'Before you scroll past: I was the biggest sceptic. But the evidence on cold exposure and mood regulation is solid (check Huberman Lab episode #66). I started at IJburg outdoor pool with the ''mamas'' group — they do 8am Saturday sessions. You stay in for 1-2 minutes, then warm up in the sauna. The endorphin rush is real. I felt more like myself after 3 weeks than I had in months. Wait until 6 weeks postpartum minimum, clear it with your midwife first.',
  null,
  null,
  now() - interval '6 days'
),
(
  'c0000001-0000-0000-0000-000000000004',
  'wellness',
  'Therapy via OpenUp — Free Through Most Dutch Employers',
  'PSA: if you or your partner work for a Dutch company with 50+ employees, you likely have free access to OpenUp. It''s not a replacement for clinical psychology but they offer 1-on-1 video sessions with psychologists, and they have a specific ''new parent'' track. I used it for PPA (postpartum anxiety) screening and got referred to the right specialist within a week. Check with your HR — mine had no idea either.',
  'https://www.openup.com',
  'Check access',
  now() - interval '12 days'
),

-- === NUTRITION (3 posts) ===
(
  'c0000001-0000-0000-0000-000000000001',
  'nutrition',
  'Meal Prep Sundays — My One-Handed Lunch System',
  'Here''s what I meal prep every Sunday in 90 minutes, all eatable one-handed while nursing: (1) Overnight oats x5 jars — oats, chia, frozen berries, almond milk. (2) Energy balls x20 — dates, cashews, coconut, cocoa. (3) Pasta salad x3 portions — orzo, pesto, sundried tomato, feta, spinach. (4) Soup x4 portions — sweet potato + red lentil + coconut milk, blitz and freeze in portions. Total cost: ~€22. Total sanity saved: immeasurable. All recipes in the link.',
  'https://www.notion.so/mama-meal-prep',
  'Get recipes',
  now() - interval '7 days'
),
(
  'c0000001-0000-0000-0000-000000000002',
  'nutrition',
  'Breastfeeding Nutrition — What Actually Matters',
  'As a doctor, I see so much misinformation about breastfeeding diets. Here''s what the evidence actually says: (1) You need ~500 extra calories/day — not 1000, not ''eating for two''. (2) Hydration matters more than food choices — aim for 3L/day. (3) Omega-3 (DHA) supplementation is the one thing with strong evidence for breast milk quality. (4) There''s no reliable evidence that specific foods cause colic — the ''avoid garlic/onion/dairy'' advice is mostly myth. (5) Vitamin D for you AND baby regardless of diet. Keep it simple.',
  null,
  null,
  now() - interval '9 days'
),
(
  'c0000001-0000-0000-0000-000000000005',
  'nutrition',
  'Picnic Amsterdam — Grocery Delivery That Saved My Sanity',
  'I know everyone knows Picnic but if you haven''t switched yet, DO IT. Free delivery, no minimum order, and they have a ''baby essentials'' category that includes Olvarit, HiPP, diapers, and formula. The app lets you save a weekly template so I literally just tap ''reorder'' every Tuesday. They also deliver Albert Heijn products now. My weekly grocery time went from 2 hours (hauling baby to AH) to 4 minutes on my phone. The €5/month ''Plus'' membership pays for itself in the first week.',
  'https://www.picnic.app',
  'Download Picnic',
  now() - interval '14 days'
);
