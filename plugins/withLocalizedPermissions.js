/**
 * Ship the permission strings in French and Spanish.
 *
 * CFBundleLocalizations makes iOS translate ITS OWN interface — the Cancel and
 * Choose buttons in the photo picker. It does not translate OUR sentences: the
 * "why does this app want your photos" line comes from Info.plist and stays in
 * whatever language that file is written in, which is English.
 *
 * Seen on a Spanish simulator: the dialog title read «"møma" quiere acceder a
 * tus fotos» and directly underneath, in English, "møma needs your photos so
 * you can add a picture to your profile…". That line is the first thing a woman
 * reads about møma's intentions, in a modal she did not ask for.
 *
 * The translations live in ios/localization/<lang>.lproj/InfoPlist.strings.
 * They were written before this plugin existed and sat unused, because ios/ is
 * generated: anything added to the Xcode project by hand disappears at the next
 * prebuild. So the wiring has to happen AT prebuild, which is what this does —
 * copy the files in, register the languages, and attach the variant group to
 * the target's resources.
 */

const { withXcodeProject, withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

const LANGS = ['fr', 'es'];
const SOURCE_DIR = 'ios/localization';
const FILENAME = 'InfoPlist.strings';

/** Copy <lang>.lproj/InfoPlist.strings into the generated iOS project. */
function withCopiedStrings(config) {
  return withDangerousMod(config, [
    'ios',
    (cfg) => {
      const projectRoot = cfg.modRequest.projectRoot;
      const platformRoot = cfg.modRequest.platformProjectRoot;
      const appName = cfg.modRequest.projectName;
      for (const lang of LANGS) {
        const from = path.join(projectRoot, SOURCE_DIR, `${lang}.lproj`, FILENAME);
        if (!fs.existsSync(from)) {
          throw new Error(
            `withLocalizedPermissions: missing ${from}. The translations are the ` +
              `point of this plugin — failing loudly rather than shipping English.`,
          );
        }
        const toDir = path.join(platformRoot, appName, `${lang}.lproj`);
        fs.mkdirSync(toDir, { recursive: true });
        fs.copyFileSync(from, path.join(toDir, FILENAME));
      }
      return cfg;
    },
  ]);
}

/** Register the languages and attach the variant group to the target. */
function withStringsInProject(config) {
  return withXcodeProject(config, (cfg) => {
    const project = cfg.modResults;
    const appName = cfg.modRequest.projectName;

    // knownRegions drives which .lproj folders Xcode will even look at.
    const root = project.getFirstProject().firstProject;
    root.knownRegions = root.knownRegions || [];
    for (const lang of LANGS) {
      if (!root.knownRegions.includes(lang)) root.knownRegions.push(lang);
    }

    // A localized resource is one PBXVariantGroup with a child per language.
    // Bail out if a previous run already added it — prebuild is not always
    // --clean, and a duplicate resource is a build error.
    const groups = project.hash.project.objects.PBXVariantGroup || {};
    const already = Object.values(groups).some(
      (g) => g && typeof g === 'object' && g.name === FILENAME,
    );
    if (already) return cfg;

    const children = LANGS.map((lang) => {
      const fileRef = project.generateUuid();
      project.addToPbxFileReferenceSection({
        uuid: fileRef,
        fileRef,
        basename: FILENAME,
        path: `${lang}.lproj/${FILENAME}`,
        group: 'Resources',
        lastKnownFileType: 'text.plist.strings',
        sourceTree: '"<group>"',
        explicitFileType: undefined,
        defaultEncoding: 4,
        includeInIndex: 0,
        settings: undefined,
      });
      return { value: fileRef, comment: lang };
    });

    const variantUuid = project.generateUuid();
    project.hash.project.objects.PBXVariantGroup =
      project.hash.project.objects.PBXVariantGroup || {};
    project.hash.project.objects.PBXVariantGroup[variantUuid] = {
      isa: 'PBXVariantGroup',
      children,
      name: FILENAME,
      sourceTree: '"<group>"',
    };
    project.hash.project.objects.PBXVariantGroup[`${variantUuid}_comment`] = FILENAME;

    // Into the app group so it shows in the navigator, and into Resources so it
    // actually ships. The second is the one that matters.
    const appGroupKey = project.findPBXGroupKey({ name: appName });
    if (appGroupKey) project.addToPbxGroup(variantUuid, appGroupKey);

    const buildFileUuid = project.generateUuid();
    project.hash.project.objects.PBXBuildFile[buildFileUuid] = {
      isa: 'PBXBuildFile',
      fileRef: variantUuid,
      fileRef_comment: FILENAME,
    };
    project.hash.project.objects.PBXBuildFile[`${buildFileUuid}_comment`] =
      `${FILENAME} in Resources`;

    const resourcesPhase = project.pbxResourcesBuildPhaseObj(project.getFirstTarget().uuid);
    resourcesPhase.files.push({
      value: buildFileUuid,
      comment: `${FILENAME} in Resources`,
    });

    return cfg;
  });
}

module.exports = function withLocalizedPermissions(config) {
  return withStringsInProject(withCopiedStrings(config));
};
