# Permission strings, per language

`CFBundleLocalizations` makes iOS translate ITS OWN interface — the Cancel and
Choose buttons in the photo picker. It does not translate OUR sentences: the
"why does this app want your photos" line comes from `Info.plist` and stays in
whatever language that file is written in, which is English.

That line is the first thing a woman reads about møma's intentions, and she
reads it in a modal she did not ask for.

`plugins/withLocalizedPermissions.js` copies these into the generated iOS
project at prebuild and attaches them to the target.

**They live here, at the repo root, and not under `ios/`.** They used to live in
`ios/localization/`, which was wrong twice over: `ios/` is gitignored, so they
were never actually committed, and `expo prebuild --clean` deletes the whole
directory — which is exactly how the first set was lost. Anything the build
CONSUMES has to sit outside the directory the build REGENERATES.

Keep the key list in step with the `infoPlist` block in `app.json`; that block
is the English original.
