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
  * onboarding/profile.tsx 'van Dijk' — a sample surname in a placeholder, not
    copy; it reads as a name in every language.

A JSX line counts as copy once its {...} expressions are stripped out — that is
what catches titles broken by a manual line break, e.g. Matching{'\n'}preferences,
which no contiguous-string search can ever see.
"""
import re, pathlib

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
# Les chiffres comptent : « frees up 1 of 2 slots » est de la copie, et sans
# 0-9 dans les classes ce genre de phrase passait sous le radar.
COPYISH = re.compile(r"^[A-Za-zÀ-ÿ][A-Za-zÀ-ÿ0-9’'.,!?&()·—–-]*( +[A-Za-zÀ-ÿ0-9’'.,!?&()·—–-]+)+$"
                     r"|^[A-Z][a-zA-Z]{3,}$"
                     # A bare English function word on its own JSX line: signup.tsx
                     # rendered a hardcoded "or" between the buttons for months and
                     # every pass walked past it, because the filter wanted two words
                     # or a capital. An allowlist rather than "any short word" — the
                     # latter drowns in JSX boolean props (multiline, optional) and
                     # enum values (newborn, expecting).
                     r"|^(or|and|to|of|at|in|on|no|yes|from|with|by|new|back|next|done|save|edit|add)$")

# Positions qui rendent une chaîne visible.
# setError/setMessage carry copy straight to the screen. signup.tsx held
# `setError("passwords don't match")` in English for months and no pass caught
# it, because the detector only looked at attribute-shaped positions.
ATTR = re.compile(r"\b(label|title|placeholder|hint|sub|note|text|accessibilityLabel|q|a|body|deck|lead|message)\s*[:=]\s*(['\"])(.+?)\2")
SETTER = re.compile(r"\bset(?:Error|Message|Status|Toast|Notice)\(\s*(['\"])(.+?)\1")
JSXATTR = re.compile(r"\b(label|title|placeholder|hint|accessibilityLabel)=\"([^\"]+)\"")
BRACE = re.compile(r"\{[^{}]*\}")
# && || ?: sont du JSX conditionnel, jamais de la copie.
NOTCOPY = re.compile(r"[=;\[\]<>]|\w\(|\)\w|&&|\|\||\?|(^|\s)\w+\.\w+($|\s)")

def jsx_text(line: str):
    """The visible text of a JSX line, or None if the line is not copy."""
    st = line.strip()
    if len(line) - len(line.lstrip()) < 4: return None
    if not st or st[0] in '<}/': return None
    if st.startswith('{') and st.endswith('}'): return None   # pure expression
    t = BRACE.sub(' ', st).strip()                            # drop {'\n'}, {count}...
    t = re.sub(r'\s+', ' ', t)
    if not t or NOTCOPY.search(t): return None
    # « return ( » ouvre du JSX ; de la copie parenthésée est toujours équilibrée.
    if t.count('(') != t.count(')'): return None
    return t
ALERT = re.compile(r"Alert\.alert\(\s*(['\"])(.+?)\1")
TEMPLATE = re.compile(r"`([^`]*)`")
SUBST = re.compile(r"\$\{[^{}]*\}")
RETSTR = re.compile(r"return\s+(['\"])([A-Za-z][^'\"]{6,})\1")

hits = []
for d in ('app', 'components', 'constants', 'hooks', 'lib'):
    for f in sorted(pathlib.Path(d).rglob('*.ts*')):
        src = f.read_text()
        in_block = False
        for n, line in enumerate(src.split('\n'), 1):
            st = line.strip()
            # Suivre les commentaires de bloc : leurs lignes de continuation ne
            # commencent pas toutes par * et se lisaient comme de la prose.
            if in_block:
                if '*/' in st: in_block = False
                continue
            # {/* ... */} sur plusieurs lignes : la forme JSX du commentaire.
            if st.startswith(('/*', '{/*')) and '*/' not in st:
                in_block = True
                continue
            if st.startswith(('//', '*', '/*')) or 'import ' in st: continue
            if "t('" in line or 't(`' in line: continue
            if FONT.search(line): continue
            found = set()
            for m in ATTR.finditer(line): found.add(m.group(3))
            for m in JSXATTR.finditer(line): found.add(m.group(2))
            for m in ALERT.finditer(line): found.add(m.group(2))
            for m in SETTER.finditer(line): found.add(m.group(2))
            for m in TEMPLATE.finditer(line):
                lit = re.sub(r'\s+', ' ', SUBST.sub(' ', m.group(1))).strip()
                if lit: found.add(lit)
            for m in RETSTR.finditer(line): found.add(m.group(2))
            jt = jsx_text(line)
            if jt: found.add(jt)
            for s in found:
                if TECH.match(s) or not COPYISH.match(s): continue
                hits.append((str(f), n, s[:70]))

by_file = {}
for f, n, s in hits: by_file.setdefault(f, []).append((n, s))
print(f"{len(hits)} chaînes suspectes dans {len(by_file)} fichiers\n")
for f in sorted(by_file, key=lambda k: -len(by_file[k])):
    print(f"── {f}  ({len(by_file[f])})")
    for n, s in by_file[f][:6]: print(f"   {n}: {s}")
