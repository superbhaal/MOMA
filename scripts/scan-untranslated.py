#!/usr/bin/env python3
"""
Finds user-facing copy that is not going through t().

Written after six rounds of Simon finding untranslated screens by hand. The
first heuristic only looked at JSX text and quoted literals, and missed the
shape this codebase actually uses most: sentences held in module-level Records
(DECLINE_OPTIONS, TIME_BLOCKS, PAUSE_OPTIONS, KIND_COURSE, COPY, PROMISES,
STAGE groups, PLACE_CATEGORIES...). This one looks at the positions that make a
string visible — label:/title:/sub:/note:/placeholder=, Alert.alert, and
`return 'some sentence'` — rather than at where it sits in the file.

Run:  python3 scripts/scan-untranslated.py

It over-reports on purpose. Known and accepted noise:
  * constants/onboarding.ts LANGUAGE_OPTIONS — those labels are ALSO the value
    stored in users.primary_language; display goes through languageLabel().
  * hooks/*.ts 'not authenticated', 'missing context' — internal error strings
    that never reach a screen unrendered.
  * long prose inside comments.
import re, pathlib, json, sys

# Codes, styles, valeurs techniques : jamais de la copie.
TECH = re.compile(r"^(#|rgba?\(|https?:|[a-z0-9_.-]+/[a-z0-9_./-]+$|@[a-z@/-]|\d)|"
                  r"^(row|column|center|flex-\w+|space-\w+|absolute|relative|none|auto|"
                  r"contain|cover|stretch|baseline|bold|normal|italic|small|large|medium|"
                  r"default|transparent|hidden|visible|solid|dashed|clip|head|tail|"
                  r"padding|margin|height|width|top|bottom|left|right|handled|always|"
                  r"never|on-drag|interactive|light|dark|ios|android|web|done|next|go|"
                  r"send|search|email-address|numeric|number-pad|phone-pad|url|words|"
                  r"sentences|characters|no|yes|off|instagram|tiktok|place|person|"
                  r"morning|afternoon|evening|en|fr|es)$", re.I)
FONT = re.compile(r"(DMSans|Cormorant|Lora)-")
# Au moins deux mots alphabétiques, ou un mot capitalisé de 4+ lettres.
COPYISH = re.compile(r"^[A-Za-zÀ-ÿ][A-Za-zÀ-ÿ’'.,!?&()·—–-]*( +[A-Za-zÀ-ÿ’'.,!?&()·—–-]+)+$|^[A-Z][a-zA-Z]{3,}$")

# Positions qui rendent une chaîne visible.
ATTR = re.compile(r"\b(label|title|placeholder|hint|sub|note|text|accessibilityLabel|q|a|body|deck|lead|message)\s*[:=]\s*(['\"])(.+?)\2")
JSXATTR = re.compile(r"\b(label|title|placeholder|hint|accessibilityLabel)=\"([^\"]+)\"")
JSXTEXT = re.compile(r"^\s{4,}([A-ZÀ-Ý][A-Za-zÀ-ÿ’'.,!?&() —–-]{7,})\s*$")
ALERT = re.compile(r"Alert\.alert\(\s*(['\"])(.+?)\1")
RETSTR = re.compile(r"return\s+(['\"])([A-Za-z][^'\"]{6,})\1")

hits = []
for d in ('app', 'components', 'constants', 'hooks', 'lib'):
    for f in sorted(pathlib.Path(d).rglob('*.ts*')):
        src = f.read_text()
        for n, line in enumerate(src.split('\n'), 1):
            st = line.strip()
            if st.startswith(('//', '*', '/*')) or 'import ' in st: continue
            if "t('" in line or 't(`' in line: continue
            if FONT.search(line): continue
            found = set()
            for m in ATTR.finditer(line): found.add(m.group(3))
            for m in JSXATTR.finditer(line): found.add(m.group(2))
            for m in ALERT.finditer(line): found.add(m.group(2))
            for m in RETSTR.finditer(line): found.add(m.group(2))
            m = JSXTEXT.match(line)
            if m: found.add(m.group(1))
            for s in found:
                if TECH.match(s) or not COPYISH.match(s): continue
                hits.append((str(f), n, s[:70]))

by_file = {}
for f, n, s in hits: by_file.setdefault(f, []).append((n, s))
print(f"{len(hits)} chaînes suspectes dans {len(by_file)} fichiers\n")
for f in sorted(by_file, key=lambda k: -len(by_file[k])):
    print(f"── {f}  ({len(by_file[f])})")
    for n, s in by_file[f][:6]: print(f"   {n}: {s}")
