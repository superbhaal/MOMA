#!/usr/bin/env python3
"""
Builds studio/seed/learn-i18n.ndjson — French and Spanish for every Learn and
Watch document, plus the English originals re-stamped with language: 'en'.

Run:    python3 studio/seed/build-learn-i18n.py
Import: cd studio && npx sanity dataset import --replace seed/learn-i18n.ndjson production

--replace matters: the five batch-one documents already exist and this file
carries them again only to add the `language` field they were seeded without.

Model: document-level translation. Each translated article is its own document,
id `<original>-fr`, carrying `language` and `translationOf`. The app filters on
coalesce(language,"en") == $lang, so an untranslated document simply doesn't
appear for that reader — which is why the reels are here too. Translating only
the articles would have left a French reader with an empty Watch tab.

The prose is translated, not transliterated: the register follows each language.
Medical claims are unchanged — this is the same guidance in three languages, and
a translation that softened or sharpened a clinical threshold would be a
different article wearing the same title.
"""
import json, pathlib

def blocks(items):
    """[(style, text), ...] -> Portable Text, keys matching the English original."""
    return [
        {"_type": "block", "_key": f"b{i}", "style": style,
         "children": [{"_type": "span", "_key": f"s{i}", "text": text}]}
        for i, (style, text) in enumerate(items, 1)
    ]

# ─── English originals from batch one, re-stamped with a language ───────────
BATCH1_EN = [
  dict(_id="learn-newborn-sleep", _type="learnArticle",
       title="Why newborn sleep cycles differ from adult ones",
       deck="REM-heavy cycles are neurologically protective, not a problem to fix.",
       category="Sleep", babyStage="0-4wks", author="Dr. Hanna Beckett",
       authorTitle="Developmental Paediatrics", readMinutes=5, source="Pediatrics, 2023",
       publishedAt="2026-07-10T09:00:00Z",
       lead="If your newborn wakes the moment you set them down, nothing is wrong with them — or with you. Their sleep is built differently, and for good reason.",
       keyPoints=["Newborns spend about half their sleep in light REM sleep.",
                  "Frequent waking is developmentally normal and protective.",
                  "Cycles lengthen on their own as the brain matures."],
       body=blocks([
         ("normal","Adults spend most of the night in deep, non-REM sleep. Newborns do the opposite: roughly half of their sleep is active REM sleep, the lighter stage where the brain is busy wiring itself."),
         ("h2","Light sleep is doing a job"),
         ("normal","During REM, a newborn's brain forms and prunes connections at a staggering rate. Easy waking is a feature of this stage, not a flaw — it also keeps babies rousable, which is protective in the early weeks."),
         ("blockquote","A newborn who wakes easily is not a bad sleeper. They are a normal one."),
         ("normal","Sleep cycles lengthen and consolidate over the first several months as the brain matures. There is nothing to train away in the newborn stage — only a rhythm to ride out."),
       ])),
  dict(_id="learn-postpartum-brain", _type="learnArticle",
       title="The postpartum brain: what's actually happening",
       deck="Gray matter changes are real, protective, and reversible.",
       category="Mind", babyStage="0-4wks", author="Dr. Sigrid Greene",
       authorTitle="MD, Perinatal Psychiatry", readMinutes=5, source="Nature Neuroscience, 2022",
       publishedAt="2026-07-09T09:00:00Z",
       lead="The forgetfulness has a name and a mechanism. Your brain isn't failing — it's being remodelled for the job in front of it.",
       keyPoints=["Gray matter changes measurably in the perinatal period.",
                  "The shifts correlate with attachment and cue-reading.",
                  "Volume recovers over roughly the first two years."],
       body=blocks([
         ("normal","Brain imaging shows measurable reductions in gray matter volume across pregnancy and the early postpartum months, concentrated in regions tied to social cognition."),
         ("h2","Less volume, sharper focus"),
         ("normal","This looks alarming but reads as fine-tuning: the same changes correlate with stronger attachment and quicker reading of an infant's cues. The brain is specialising, not shrinking in capability."),
         ("blockquote","The changes track with attachment, not decline — and they recover."),
         ("normal","Follow-up scans show gray matter rebounding over the first two years. The remodelling is a phase with a return trip, not a permanent loss."),
       ])),
  dict(_id="learn-exercise-postpartum", _type="learnArticle",
       title="When is it safe to exercise postpartum?",
       deck="An evidence-based timeline, the signs to watch, and what to avoid.",
       category="Recovery", babyStage="1-3mo", author="Dr. Lena Fitzgerald",
       authorTitle="PhD, Pelvic Health", readMinutes=6, source="BJSM, 2023",
       publishedAt="2026-07-08T09:00:00Z",
       lead="There is no single green-light date. There is a sequence — and a few clear signals that tell you to ease off.",
       keyPoints=["Start with walking and breath-led core work.",
                  "Watch for heaviness, leaking, or midline bulging.",
                  "Return to running once symptom-free under load."],
       body=blocks([
         ("normal","Gentle walking and breath-led core work can usually begin within days of an uncomplicated birth. Higher-impact training belongs later, once the pelvic floor and connective tissue have recovered."),
         ("h2","Signs to ease off"),
         ("normal","Heaviness or dragging in the pelvis, any leaking, or a bulge along the midline of the belly are all cues to scale back and, ideally, see a pelvic-floor physio before progressing."),
         ("blockquote","Pain, heaviness, or leaking are not things to push through."),
         ("normal","A common evidence-based arc: walking and breathwork early, loaded strength around 6–12 weeks with guidance, and running once you can hop, single-leg balance, and load without symptoms."),
       ])),
]

BATCH1_REELS_EN = [
  dict(_id="reel-matrescence", _type="learnReel", title="Matrescence isn't postpartum depression",
       platform="instagram", externalUrl="https://www.instagram.com/reel/moma-matrescence/",
       thumbnailHex="#F4D1D1", durationSec=108, creatorName="Dr. Sigrid Greene",
       creatorHandle="@dr.sigrid.greene", credential="MD · Perinatal",
       babyStage="0-4wks", category="Mind", publishedAt="2026-07-11T09:00:00Z"),
  dict(_id="reel-wake-windows", _type="learnReel", title="Wake windows for a 3-week-old, explained",
       platform="tiktok", externalUrl="https://www.tiktok.com/@drsleepbaby/video/moma-wake-windows",
       thumbnailHex="#C8DCF0", durationSec=74, creatorName="@drsleepbaby",
       creatorHandle="@drsleepbaby", credential="IBCLC · Sleep",
       babyStage="0-4wks", category="Sleep", publishedAt="2026-07-12T09:00:00Z"),
]

# ─── Translations, keyed by original id ────────────────────────────────────
ART = {}

ART["learn-newborn-sleep"] = {
 "fr": dict(title="Pourquoi le sommeil du nouveau-né n’a rien de celui d’un adulte",
   deck="Des cycles riches en sommeil paradoxal : une protection neurologique, pas un défaut à corriger.",
   lead="Si votre nouveau-né se réveille à l’instant où vous le posez, il n’a rien d’anormal — et vous non plus. Son sommeil est construit autrement, et pour de bonnes raisons.",
   keyPoints=["Le nouveau-né passe environ la moitié de son sommeil en sommeil paradoxal léger.",
              "Les réveils fréquents sont normaux sur le plan du développement, et protecteurs.",
              "Les cycles s’allongent d’eux-mêmes à mesure que le cerveau mûrit."],
   body=[("normal","L’adulte passe l’essentiel de la nuit en sommeil profond. Le nouveau-né fait l’inverse : près de la moitié de son sommeil est du sommeil paradoxal, ce stade plus léger où le cerveau est occupé à se câbler."),
         ("h2","Le sommeil léger travaille"),
         ("normal","Pendant le sommeil paradoxal, le cerveau du nouveau-né crée et élague des connexions à un rythme vertigineux. Se réveiller facilement est une caractéristique de ce stade, pas un défaut — cela le garde aussi éveillable, ce qui le protège dans les premières semaines."),
         ("blockquote","Un nouveau-né qui se réveille facilement n’est pas un mauvais dormeur. C’est un dormeur normal."),
         ("normal","Les cycles s’allongent et se consolident au fil des premiers mois, à mesure que le cerveau mûrit. Il n’y a rien à corriger au stade nouveau-né — seulement un rythme à traverser.")]),
 "es": dict(title="Por qué el sueño del recién nacido no se parece al del adulto",
   deck="Los ciclos con mucho sueño REM son una protección neurológica, no un fallo que arreglar.",
   lead="Si tu recién nacido se despierta en cuanto lo dejas, no le pasa nada — ni a ti tampoco. Su sueño está construido de otra manera, y por buenas razones.",
   keyPoints=["El recién nacido pasa cerca de la mitad del sueño en fase REM ligera.",
              "Despertarse a menudo es normal en su desarrollo, y protector.",
              "Los ciclos se alargan solos a medida que madura el cerebro."],
   body=[("normal","El adulto pasa casi toda la noche en sueño profundo. El recién nacido hace lo contrario: alrededor de la mitad de su sueño es REM activo, la fase más ligera en la que el cerebro está ocupado cableándose."),
         ("h2","El sueño ligero está trabajando"),
         ("normal","Durante el REM, el cerebro del recién nacido crea y poda conexiones a una velocidad asombrosa. Despertarse con facilidad es una característica de esta fase, no un defecto — además lo mantiene despertable, lo que protege en las primeras semanas."),
         ("blockquote","Un recién nacido que se despierta fácilmente no duerme mal. Duerme como toca."),
         ("normal","Los ciclos se alargan y se consolidan a lo largo de los primeros meses, según madura el cerebro. En la etapa de recién nacido no hay nada que entrenar — solo un ritmo que atravesar.")]),
}

ART["learn-postpartum-brain"] = {
 "fr": dict(title="Le cerveau après l’accouchement : ce qui se passe vraiment",
   deck="Les changements de matière grise sont réels, protecteurs et réversibles.",
   lead="Les oublis ont un nom et un mécanisme. Votre cerveau ne lâche pas — il se réaménage pour la tâche qui l’attend.",
   keyPoints=["La matière grise change de façon mesurable pendant la période périnatale.",
              "Ces changements vont de pair avec l’attachement et la lecture des signaux du bébé.",
              "Le volume se rétablit sur environ les deux premières années."],
   body=[("normal","L’imagerie montre des réductions mesurables du volume de matière grise pendant la grossesse et les premiers mois qui suivent, concentrées dans les régions liées à la cognition sociale."),
         ("h2","Moins de volume, plus de précision"),
         ("normal","Cela paraît alarmant mais se lit comme un réglage fin : ces mêmes changements vont de pair avec un attachement plus fort et une lecture plus rapide des signaux du bébé. Le cerveau se spécialise, il ne perd pas ses capacités."),
         ("blockquote","Ces changements suivent l’attachement, pas un déclin — et ils se rétablissent."),
         ("normal","Les examens de suivi montrent une remontée de la matière grise sur les deux premières années. Ce réaménagement est une phase avec un billet retour, pas une perte définitive.")]),
 "es": dict(title="El cerebro después del parto: qué está pasando de verdad",
   deck="Los cambios en la materia gris son reales, protectores y reversibles.",
   lead="Los olvidos tienen nombre y mecanismo. Tu cerebro no está fallando — se está remodelando para el trabajo que tiene delante.",
   keyPoints=["La materia gris cambia de forma medible en el periodo perinatal.",
              "Los cambios se relacionan con el apego y con leer antes las señales del bebé.",
              "El volumen se recupera a lo largo de los dos primeros años."],
   body=[("normal","Las imágenes cerebrales muestran reducciones medibles del volumen de materia gris durante el embarazo y los primeros meses tras el parto, concentradas en regiones ligadas a la cognición social."),
         ("h2","Menos volumen, más precisión"),
         ("normal","Suena alarmante pero se lee como un ajuste fino: esos mismos cambios se relacionan con un apego más fuerte y con leer antes las señales del bebé. El cerebro se especializa, no pierde capacidad."),
         ("blockquote","Los cambios acompañan al apego, no a un declive — y se recuperan."),
         ("normal","Los estudios de seguimiento muestran que la materia gris se recupera en los dos primeros años. La remodelación es una etapa con billete de vuelta, no una pérdida permanente.")]),
}

ART["learn-exercise-postpartum"] = {
 "fr": dict(title="Quand peut-on reprendre le sport après l’accouchement ?",
   deck="Un calendrier fondé sur les données, les signaux à surveiller, et ce qu’il faut éviter.",
   lead="Il n’y a pas de date unique qui donne le feu vert. Il y a une progression — et quelques signaux clairs qui disent de lever le pied.",
   keyPoints=["Commencez par la marche et le travail du centre guidé par la respiration.",
              "Surveillez la lourdeur, les fuites, ou un renflement sur la ligne du ventre.",
              "Reprenez la course quand la charge ne déclenche plus de symptômes."],
   body=[("normal","La marche douce et le travail du centre guidé par la respiration peuvent en général commencer quelques jours après un accouchement sans complication. Les impacts plus forts viennent plus tard, une fois le périnée et les tissus conjonctifs rétablis."),
         ("h2","Les signaux qui disent de lever le pied"),
         ("normal","Une lourdeur ou une sensation de traction dans le bassin, la moindre fuite, ou un renflement le long de la ligne médiane du ventre : autant de signaux pour réduire et, idéalement, consulter en rééducation périnéale avant d’aller plus loin."),
         ("blockquote","La douleur, la lourdeur et les fuites ne sont pas des choses à endurer."),
         ("normal","Une progression courante et documentée : marche et respiration au début, renforcement avec charge vers 6 à 12 semaines et accompagnée, puis course quand vous pouvez sautiller, tenir en équilibre sur une jambe et porter une charge sans symptôme.")]),
 "es": dict(title="¿Cuándo se puede volver a hacer ejercicio después del parto?",
   deck="Un calendario basado en la evidencia, las señales a vigilar y lo que conviene evitar.",
   lead="No hay una fecha única que dé luz verde. Hay una progresión — y unas cuantas señales claras que dicen que aflojes.",
   keyPoints=["Empieza caminando y con trabajo del centro guiado por la respiración.",
              "Vigila la pesadez, las pérdidas o un abultamiento en la línea del abdomen.",
              "Vuelve a correr cuando la carga ya no te dé síntomas."],
   body=[("normal","Caminar suave y el trabajo del centro guiado por la respiración suelen poder empezar a los pocos días de un parto sin complicaciones. El entrenamiento de más impacto va después, cuando el suelo pélvico y el tejido conectivo se han recuperado."),
         ("h2","Señales para aflojar"),
         ("normal","Pesadez o sensación de arrastre en la pelvis, cualquier pérdida, o un abultamiento en la línea media del abdomen son señales para bajar el ritmo y, a ser posible, ver a una fisioterapeuta de suelo pélvico antes de avanzar."),
         ("blockquote","El dolor, la pesadez y las pérdidas no son cosas que haya que aguantar."),
         ("normal","Una progresión habitual y documentada: caminar y respiración al principio, fuerza con carga entre las 6 y las 12 semanas y acompañada, y correr cuando puedas saltar, mantener el equilibrio a una pierna y cargar sin síntomas.")]),
}

ART["learn-four-month-sleep"] = {
 "fr": dict(title="La régression des quatre mois est une réorganisation",
   deck="Le sommeil se dégrade parce que le cerveau a mûri, pas parce que quelque chose s’est cassé.",
   lead="Vers quatre mois, un bébé qui dormait de longues plages se met à se réveiller toutes les deux heures. On dirait un retour en arrière. C’est l’inverse.",
   keyPoints=["Vers quatre mois, les cycles se réorganisent en stades proches de ceux de l’adulte.",
              "Les brefs réveils entre deux cycles sont normaux et définitifs — les adultes en ont aussi.",
              "Cela se stabilise en général en deux à six semaines, sans rien faire."],
   body=[("normal","Le sommeil du nouveau-né a deux états : actif et calme. Autour du quatrième mois, ce schéma simple se réorganise en une architecture d’adulte, avec des stades légers et profonds qui s’enchaînent toutes les cinquante minutes environ."),
         ("normal","La conséquence est immédiate et mal venue. À la fin de chaque cycle, il y a désormais une brève remontée — un moment de quasi-réveil que les adultes traversent sans jamais s’en souvenir. Un bébé endormi au sein, dans vos bras, en mouvement, remonte et ne retrouve rien de tout cela. Alors il vous appelle."),
         ("normal","C’est pourquoi le changement surgit d’un coup chez un bébé qui « dormait bien ». Rien n’a été perdu. Un système plus sophistiqué s’est mis en route, et il demande d’autres conditions que celui qu’il remplace."),
         ("normal","La régression se résout seule en deux à six semaines, à mesure que les transitions s’assouplissent. Il n’y a rien à réparer entre-temps, même si s’endormir dans les conditions où l’on se réveillera tend à raccourcir la période.")]),
 "es": dict(title="La regresión de los cuatro meses es una reorganización",
   deck="El sueño empeora porque el cerebro maduró, no porque algo se haya roto.",
   lead="Hacia los cuatro meses, un bebé que dormía tramos largos empieza a despertarse cada dos horas. Parece un paso atrás. Es lo contrario.",
   keyPoints=["Hacia los cuatro meses los ciclos se reorganizan en fases parecidas a las del adulto.",
              "Los despertares breves entre ciclos son normales y permanentes — los adultos también los tienen.",
              "Suele estabilizarse en dos a seis semanas, sin intervenir."],
   body=[("normal","El sueño del recién nacido tiene dos estados: activo y tranquilo. Cerca de los cuatro meses ese patrón simple se reorganiza en la arquitectura adulta de fases ligeras y profundas, encadenándose cada cincuenta minutos aproximadamente."),
         ("normal","La consecuencia es inmediata e inoportuna. Al final de cada ciclo hay ahora un breve aflorar — un momento de casi despertar que los adultos atraviesan sin recordarlo nunca. Un bebé que se durmió al pecho, en tus brazos, en movimiento, aflora y no encuentra nada de eso. Así que te llama."),
         ("normal","Por eso el cambio llega de golpe en un bebé que «dormía bien». No se ha perdido nada. Se ha puesto en marcha un sistema más sofisticado, y necesita condiciones distintas de las del que reemplaza."),
         ("normal","La regresión se resuelve sola en dos a seis semanas, según se suavizan las transiciones. No hay nada que arreglar mientras tanto, aunque dormirse en las mismas condiciones en las que va a despertarse suele acortarla.")]),
}

ART["learn-cluster-feeding"] = {
 "fr": dict(title="Les tétées groupées ne veulent pas dire que votre lait s’épuise",
   deck="Le marathon du soir, c’est la demande qui commande l’offre — exactement comme prévu.",
   lead="La fin d’après-midi arrive et le bébé veut téter sans arrêt, pendant des heures, alors qu’il a tété il y a quarante minutes. Presque toutes les mères lisent ça pareil : il n’y en a pas assez.",
   keyPoints=["Téter souvent augmente la production — ce n’est pas le signe d’un manque.",
              "Le volume de lait baisse naturellement le soir, au moment même des tétées groupées.",
              "Fiez-vous aux couches et à la courbe de poids, pas à la sensation de sein plein."],
   body=[("normal","La production de lait fonctionne au retrait. Plus le lait est prélevé souvent et complètement, plus le sein reçoit l’instruction d’en fabriquer. Les tétées groupées, c’est cette instruction délivrée intensivement, souvent le soir, souvent pendant une poussée de croissance."),
         ("normal","Il faut savoir que le lait maternel n’est pas identique tout au long de la journée. Le volume est plutôt au plus haut le matin et plus bas le soir — précisément quand les bébés réclament avec le plus d’insistance. Un bébé qui travaille davantage pour un débit moindre ressemble à un bébé affamé devant un sein vide. Il passe commande."),
         ("normal","Les signaux fiables ne sont pas la sensation du sein — un sein souple signifie que le stockage s’est ajusté, pas que la production a échoué. Ce sont les sorties et la croissance : six couches lourdes ou plus par jour après la première semaine, et une prise de poids régulière sur sa propre courbe."),
         ("normal","Si ces deux-là tiennent, les tétées groupées sont une phase à traverser, pas un problème à résoudre. Si l’une des deux flanche, c’est le moment de faire observer une tétée par quelqu’un de qualifié.")]),
 "es": dict(title="Las tomas agrupadas no significan que se te esté acabando la leche",
   deck="El maratón de la tarde es la demanda dando la orden a la producción — funcionando como debe.",
   lead="Llega el final de la tarde y el bebé quiere mamar sin parar, durante horas, habiendo mamado hace cuarenta minutos. Casi todas las madres lo leen igual: no hay suficiente.",
   keyPoints=["Mamar a menudo aumenta la producción — no es señal de que falte.",
              "El volumen de leche baja de forma natural por la tarde, justo cuando se agrupan las tomas.",
              "Fíjate en los pañales y en el peso, no en si el pecho se nota lleno."],
   body=[("normal","La producción de leche funciona por extracción. Cuanto más a menudo y más a fondo se saca la leche, más se le pide al pecho que fabrique. Las tomas agrupadas son esa orden entregada de forma intensiva, normalmente por la tarde y normalmente en un estirón."),
         ("normal","Conviene saber que la leche materna no es igual a lo largo del día. El volumen suele ser mayor por la mañana y menor al caer la tarde, que es justo cuando los bebés maman con más insistencia. Un bebé que se esfuerza más por un flujo menor parece un bebé hambriento ante un pecho vacío. Está haciendo un pedido."),
         ("normal","Las señales fiables no son cómo se nota el pecho — que esté blando significa que el almacenamiento se ha ajustado, no que la producción haya fallado. Son la salida y el crecimiento: seis o más pañales cargados al día después de la primera semana, y un aumento de peso constante en su propia curva."),
         ("normal","Si esas dos se mantienen, las tomas agrupadas son una etapa que atravesar, no un problema que resolver. Si alguna falla, ese es el momento de que alguien cualificado observe una toma.")]),
}

ART["learn-pelvic-floor"] = {
 "fr": dict(title="Votre périnée après l’accouchement, sans deviner",
   deck="Ce qui se rétablit seul, ce qui demande de l’aide, et quand cesser d’attendre.",
   lead="Presque toutes les femmes ont de petites fuites dans les premières semaines après un accouchement par voie basse. Ce que personne ne dit clairement, c’est laquelle de ces versions se règle toute seule et laquelle non.",
   keyPoints=["Une certaine faiblesse est attendue ; une bonne part se rétablit en trois mois.",
              "Une contraction correcte inclut un relâchement complet — une tension permanente n’est pas de la force.",
              "Des fuites à trois mois, une lourdeur, ou des douleurs pendant les rapports méritent une consultation."],
   body=[("normal","La grossesse sollicite le périnée pendant des mois, quelle que soit la façon dont le bébé naît, et l’accouchement peut l’étirer considérablement. Une certaine faiblesse ensuite est attendue, et une bonne part se rétablit dans les trois premiers mois, à mesure que les tissus et la fonction nerveuse reviennent."),
         ("normal","La récupération n’est pas passive pour autant. Les muscles répondent à un usage correct : une bonne contraction remonte vers l’intérieur et vers le haut, puis — c’est la partie le plus souvent oubliée — se relâche complètement. Un périnée tenu en permanence est aussi dysfonctionnel qu’un périnée relâché, et bien plus susceptible de faire mal."),
         ("normal","Trois choses méritent d’être nommées comme des raisons de consulter plutôt que d’attendre : des fuites inchangées à trois mois, une sensation de lourdeur ou de boule dans le vagin, et des douleurs pendant les rapports une fois le feu vert donné. Aucune n’est une issue normale, et toutes répondent bien au traitement."),
         ("normal","Aux Pays-Bas, en France et en Espagne, la rééducation périnéale fait partie du suivi post-natal courant, souvent remboursée. Demander une prescription est ordinaire, pas une escalade.")]),
 "es": dict(title="Tu suelo pélvico después del parto, sin adivinar",
   deck="Qué se recupera solo, qué necesita ayuda, y cuándo dejar de esperar.",
   lead="Casi todas las mujeres tienen alguna pérdida en las primeras semanas tras un parto vaginal. Lo que nadie dice con claridad es cuál de esas versiones se resuelve sola y cuál no.",
   keyPoints=["Cierta debilidad es esperable; buena parte se recupera en tres meses.",
              "Una contracción correcta incluye soltar del todo — la tensión crónica no es fuerza.",
              "Pérdidas a los tres meses, pesadez o dolor en las relaciones merecen consulta."],
   body=[("normal","El embarazo carga el suelo pélvico durante meses, nazca el bebé como nazca, y el parto puede estirarlo bastante. Cierta debilidad después es esperable, y buena parte se recupera en los tres primeros meses, según vuelven el tejido y la función nerviosa."),
         ("normal","La recuperación no es pasiva, eso sí. Los músculos responden a usarse bien: una contracción correcta eleva hacia dentro y hacia arriba y luego — esta es la parte que más se olvida — suelta del todo. Un suelo pélvico permanentemente apretado es tan disfuncional como uno flojo, y mucho más propenso a doler."),
         ("normal","Tres cosas merecen nombrarse como motivos para pedir ayuda en vez de esperar: pérdidas que siguen igual a los tres meses, sensación de pesadez o de bulto en la vagina, y dolor en las relaciones una vez que te han dado el alta. Ninguna es un final normal, y todas responden bien al tratamiento."),
         ("normal","En los Países Bajos, Francia y España la fisioterapia de suelo pélvico es parte habitual del seguimiento posparto, a menudo cubierta. Pedir una derivación es lo normal, no una escalada.")]),
}

ART["learn-intrusive-thoughts"] = {
 "fr": dict(title="Les pensées intrusives sont fréquentes, et elles ne parlent pas de vous",
   deck="L’image nette de votre bébé blessé est un symptôme de vigilance, pas une intention.",
   lead="Vous descendez l’escalier avec elle et votre esprit vous fournit, sans y être invité et en détail, l’image de la laisser tomber. Puis vient la seconde vague : quelle mère pense une chose pareille ?",
   keyPoints=["La grande majorité des jeunes parents ont des pensées intrusives de danger.",
              "Elles sont pénibles précisément parce qu’elles vont à l’encontre de votre intention.",
              "Consultez si elles deviennent attirantes, ou si vous commencez à éviter votre bébé."],
   body=[("normal","Des pensées intrusives d’un malheur arrivant au bébé sont rapportées par la grande majorité des jeunes mères, et par les jeunes pères aussi. C’est l’une des expériences les plus courantes du début de la parentalité, et l’une des moins dites, parce que leur contenu semble disqualifier."),
         ("normal","Le mécanisme est protecteur. Un cerveau nouvellement responsable d’une vie fragile fait tourner des simulations de danger en permanence, et certaines remontent à la conscience sous forme d’images plutôt que de prudence abstraite. La pensée, c’est le système d’alarme qui répète, pas une préférence qui se révèle."),
         ("normal","La distinction que font les cliniciens est entre les pensées qui vous horrifient et celles qui vous attirent. Les pensées intrusives sont égodystoniques : elles arrivent sans être voulues, elles vous dégoûtent, et elles vous rendent plus prudente dans l’escalier, pas moins. Cette détresse est la preuve qu’elles vont contre vous, et non avec vous."),
         ("normal","Deux choses changent le tableau et méritent d’être dites sans attendre à un professionnel : des pensées qui commencent à sembler attirantes plutôt qu’atroces, et des pensées si fréquentes que vous vous mettez à éviter le bébé — refuser de la baigner, ou de rester seule avec elle — pour la protéger de vous-même."),
         ("normal","En deçà de ça, la réponse la plus efficace n’a rien de spectaculaire : le dire à voix haute à une personne. Ces pensées perdent l’essentiel de leur pouvoir dès qu’on leur oppose de la reconnaissance plutôt que de l’alarme.")]),
 "es": dict(title="Los pensamientos intrusivos son comunes, y no hablan de ti",
   deck="La imagen nítida de tu bebé haciéndose daño es un síntoma de vigilancia, no una intención.",
   lead="Bajas la escalera con ella y tu mente te entrega, sin pedirlo y con detalle, la imagen de que se te cae. Después llega la segunda ola: ¿qué clase de madre piensa eso?",
   keyPoints=["La gran mayoría de madres y padres primerizos tienen pensamientos intrusivos de daño.",
              "Angustian precisamente porque van en contra de tu intención.",
              "Busca ayuda si empiezan a resultar atractivos, o si evitas a tu bebé."],
   body=[("normal","Los pensamientos intrusivos de que al bebé le pase algo los describen la gran mayoría de madres primerizas, y también los padres. Es una de las experiencias más comunes del principio de la crianza y una de las menos habladas, porque el contenido parece descalificarte."),
         ("normal","El mecanismo es protector. Un cerebro recién responsable de una vida frágil hace simulaciones de amenaza sin parar, y algunas afloran a la conciencia como imágenes en vez de como cautela abstracta. El pensamiento es la alarma ensayando, no una preferencia revelándose."),
         ("normal","La distinción que hacen los clínicos es entre pensamientos que te horrorizan y pensamientos que te atraen. Los intrusivos son egodistónicos: llegan sin quererlos, te dan asco y te vuelven más cuidadosa en la escalera, no menos. Ese malestar es la prueba de que van contra ti, no contigo."),
         ("normal","Dos cosas cambian el cuadro y conviene plantearlas a un profesional sin demora: pensamientos que empiezan a resultar atractivos en vez de espantosos, y pensamientos tan frecuentes que empiezas a evitar al bebé — no bañarla, o no quedarte a solas con ella — para protegerla de ti misma."),
         ("normal","Por debajo de eso, la respuesta más eficaz no tiene nada de espectacular: decírselo en voz alta a una persona. Estos pensamientos pierden casi todo su poder en cuanto se les responde con reconocimiento en vez de con alarma.")]),
}

ART["learn-tummy-time"] = {
 "fr": dict(title="Le temps sur le ventre, dans les doses qui comptent vraiment",
   deck="Quelques minutes à la fois, souvent, valent mieux qu’une longue séance que personne n’apprécie.",
   lead="Le temps sur le ventre, c’est le conseil que tout le monde donne et que personne ne chiffre — d’où le énième échec quotidien à cocher.",
   keyPoints=["Visez environ une heure par jour vers trois mois, en très courtes fois.",
              "Le peau à peau sur votre poitrine et le portage sur l’avant-bras comptent aussi.",
              "Arrêtez à la protestation — la fréquence compte plus que la durée d’une séance."],
   body=[("normal","L’objectif est précis et mérite d’être dit : les bébés dorment désormais sur le dos, ce qui a fortement réduit la mort subite du nourrisson et légèrement augmenté les têtes plates et le retard de force du haut du corps. Le temps sur le ventre est le contrepoids, rien de plus."),
         ("normal","La cible de travail est d’environ une heure par jour répartie sur la journée vers trois mois — mais construite en toutes petites sessions. Une à deux minutes après chaque change s’additionne plus vite qu’une séance de quinze minutes qui finit en hurlements et vous décourage toutes les deux."),
         ("normal","Ça n’a pas besoin de se passer par terre. Allonger le bébé sur votre poitrine pendant que vous êtes inclinée compte, et passe en général bien mieux les premières semaines. Le porter face vers le bas le long de votre avant-bras aussi."),
         ("normal","Les pleurs ne prouvent pas que quelque chose ne va pas ; c’est un bébé de deux mois qui fait du gainage. Mais arrêtez à la protestation plutôt que d’insister — l’objectif est la fréquence, et la fréquence dépend de ce qu’aucune des deux ne redoute le moment.")]),
 "es": dict(title="El tiempo boca abajo, en las dosis que de verdad cuentan",
   deck="Unos minutos cada vez, a menudo, funcionan mejor que una sesión larga que nadie disfruta.",
   lead="El tiempo boca abajo es el consejo que todo el mundo da y nadie cuantifica, y así se convierte en otro fracaso diario que anotar.",
   keyPoints=["Apunta a una hora al día hacia los tres meses, en ratos muy cortos.",
              "El pecho con pecho y llevarla sobre el antebrazo también cuentan.",
              "Para cuando proteste — importa más la frecuencia que la duración de cada rato."],
   body=[("normal","El objetivo es concreto y conviene decirlo: los bebés ahora duermen boca arriba, lo que redujo mucho la muerte súbita del lactante y aumentó algo las cabezas planas y el retraso de fuerza en el tren superior. El tiempo boca abajo es el contrapeso, nada más."),
         ("normal","La meta práctica es alrededor de una hora al día repartida hacia los tres meses — pero construida con ratos muy cortos. Uno o dos minutos después de cada cambio de pañal suma más rápido que una sesión de quince minutos que acaba en llanto y os quita las ganas a las dos."),
         ("normal","No tiene que ser en el suelo. Tumbarla sobre tu pecho mientras estás reclinada cuenta, y suele llevarse mucho mejor en las primeras semanas. Llevarla boca abajo sobre tu antebrazo, también."),
         ("normal","Que llore no prueba que algo vaya mal; es una bebé de dos meses haciendo plancha. Pero termina cuando proteste en vez de forzar — el objetivo es la frecuencia, y la frecuencia depende de que ninguna de las dos tema el momento.")]),
}

ART["learn-first-foods-iron"] = {
 "fr": dict(title="La diversification : le fer d’abord, et pourquoi",
   deck="À six mois le calcul change, et c’est surtout un nutriment qui commande le calendrier.",
   lead="On parle des premiers aliments en textures et en photos. La raison pour laquelle la fenêtre se situe à six mois est plus précise que ça, et elle tient surtout au fer.",
   keyPoints=["Les réserves de fer du fœtus s’épuisent vers six mois — c’est ce qui fixe le moment.",
              "Proposez tôt des aliments riches en fer, avec un peu de vitamine C à côté.",
              "Introduisez tôt l’arachide et l’œuf et gardez-les réguliers ; retarder augmente le risque d’allergie."],
   body=[("normal","Un bébé naît avec une réserve de fer constituée pendant les derniers mois de grossesse. Elle le porte à peu près jusqu’à six mois, après quoi elle s’épuise. Le lait maternel est superbement ajusté à presque tous ses besoins, mais il est pauvre en fer, et ne peut pas refaire cette réserve."),
         ("normal","C’est pourquoi les premiers aliments méritent d’être choisis plutôt que laissés à la céréale de riz et à la poire. Les options riches en fer sont la viande, l’œuf bien cuit, les lentilles et les haricots, et les céréales enrichies. Les associer à de la vitamine C — un peu de fruit ou de poivron à côté — augmente nettement le fer réellement absorbé."),
         ("normal","Le lait reste l’essentiel toute la première année. Les solides entre six et neuf mois sont un entraînement : apprendre à déplacer les aliments dans la bouche, rencontrer des textures, s’asseoir à table. Le volume n’est pas le sujet, et manger peu n’est pas un échec."),
         ("normal","Une chose a vraiment changé ces dix dernières années : les aliments allergènes. L’arachide et l’œuf s’introduisent désormais tôt et restent au menu régulièrement, parce qu’il a été montré que les retarder augmentait l’allergie au lieu de la prévenir.")]),
 "es": dict(title="Empezar con sólidos: primero el hierro, y por qué",
   deck="A los seis meses cambia el cálculo, y hay un nutriente que marca el calendario.",
   lead="De los primeros alimentos se habla en texturas y fotos. La razón por la que la ventana está en los seis meses es más concreta, y tiene que ver sobre todo con el hierro.",
   keyPoints=["Las reservas fetales de hierro se agotan hacia los seis meses — eso marca el momento.",
              "Ofrece pronto alimentos ricos en hierro, con algo de vitamina C al lado.",
              "Introduce pronto cacahuete y huevo y mantenlos; retrasarlos aumenta el riesgo de alergia."],
   body=[("normal","Un bebé nace con una reserva de hierro formada en los últimos meses del embarazo. Le dura más o menos hasta los seis meses, y a partir de ahí se agota. La leche materna encaja de maravilla con casi todas sus necesidades, pero es baja en hierro y no puede rellenar esa reserva."),
         ("normal","Por eso conviene elegir los primeros alimentos en vez de tirar de papilla de arroz y pera. Las opciones ricas en hierro son la carne, el huevo bien cocido, las lentejas y las alubias, y los cereales enriquecidos. Combinarlos con vitamina C — algo de fruta o de pimiento al lado — aumenta de forma medible el hierro que se absorbe."),
         ("normal","La leche sigue siendo lo principal todo el primer año. Los sólidos entre los seis y los nueve meses son práctica: aprender a mover la comida en la boca, encontrarse con texturas, sentarse a la mesa. La cantidad no es el objetivo, y comer poco no es un fracaso."),
         ("normal","Algo sí cambió de verdad en la última década: los alimentos alergénicos. El cacahuete y el huevo ahora se introducen pronto y se mantienen con regularidad, porque se vio que retrasarlos aumentaba la alergia en vez de prevenirla.")]),
}

# ─── Reels. Short, but they have to exist in all three languages or the Watch
# ─── tab is simply empty for a French reader. Creator names, handles and
# ─── credentials are proper nouns and stay as they are.
REELS = {
 "reel-matrescence": {
   "fr": "La matrescence n’est pas une dépression post-partum",
   "es": "La matrescencia no es una depresión posparto"},
 "reel-wake-windows": {
   "fr": "Les temps d’éveil d’un bébé de 3 semaines, expliqués",
   "es": "Las ventanas de vigilia de un bebé de 3 semanas, explicadas"},
 "reel-latch-check": {
   "fr": "Vérifier une prise du sein en dix secondes",
   "es": "Comprobar el agarre en diez segundos"},
 "reel-safe-sleep": {
   "fr": "Préparer le lit : ce qui entre, ce qui reste dehors",
   "es": "Preparar la cuna: qué entra y qué se queda fuera"},
 "reel-diastasis": {
   "fr": "Tester le diastasis chez soi, correctement",
   "es": "Comprobar la diástasis en casa, bien hecho"},
 "reel-first-bites": {
   "fr": "Premières bouchées : tailles et formes sans danger",
   "es": "Primeros bocados: tamaños y formas seguros"},
}

# Reel metadata for the four documents that live in learn-seed-2.ndjson, so the
# translations can be built without importing that file first.
BATCH2_REELS = {
 "reel-latch-check": dict(platform="instagram", externalUrl="https://www.instagram.com/reel/moma-latch-check/",
   thumbnailHex="#F4D1D1", durationSec=48, creatorName="Wren Ashby",
   creatorHandle="@wren.feeds", credential="IBCLC · Lactation", babyStage="0-4wks", category="Feeding"),
 "reel-safe-sleep": dict(platform="tiktok", externalUrl="https://www.tiktok.com/@moma/video/moma-safe-sleep",
   thumbnailHex="#C8DCF0", durationSec=62, creatorName="Dr. Hanna Beckett",
   creatorHandle="@dr.hanna.beckett", credential="MD · Paediatrics", babyStage="0-4wks", category="Sleep"),
 "reel-diastasis": dict(platform="instagram", externalUrl="https://www.instagram.com/reel/moma-diastasis/",
   thumbnailHex="#D8E8C8", durationSec=75, creatorName="Dr. Lena Fitzgerald",
   creatorHandle="@lena.pelvic", credential="PhD · Pelvic Floor", babyStage="1-3mo", category="Recovery"),
 "reel-first-bites": dict(platform="tiktok", externalUrl="https://www.tiktok.com/@moma/video/moma-first-bites",
   thumbnailHex="#F5EDB8", durationSec=54, creatorName="Maja Lindqvist",
   creatorHandle="@maja.firstfoods", credential="RD · Infant Nutrition", babyStage="6-12mo", category="Nutrition"),
}

# Fields copied verbatim from the English original onto every translation:
# taxonomy the app filters on, and proper nouns.
CARRY_ARTICLE = ["category", "babyStage", "author", "authorTitle", "readMinutes",
                 "source", "publishedAt"]

# ─── Assemble ──────────────────────────────────────────────────────────────
docs = []

# Batch-one English, re-stamped.
for d in BATCH1_EN + BATCH1_REELS_EN:
    docs.append({**d, "language": "en"})

# Article metadata for batch two, read back out of the sibling generator's output.
seed2 = pathlib.Path(__file__).parent / "learn-seed-2.ndjson"
BATCH2_EN = {}
if seed2.exists():
    for line in seed2.read_text().splitlines():
        if line.strip():
            d = json.loads(line)
            BATCH2_EN[d["_id"]] = d

EN_BY_ID = {d["_id"]: d for d in BATCH1_EN}
EN_BY_ID.update({k: v for k, v in BATCH2_EN.items() if v["_type"] == "learnArticle"})

for base_id, per_lang in ART.items():
    en = EN_BY_ID.get(base_id)
    if en is None:
        raise SystemExit(f"missing English original for {base_id} — run build-learn-seed-2.py first")
    for lang, tr in per_lang.items():
        docs.append({
            "_id": f"{base_id}-{lang}",
            "_type": "learnArticle",
            "language": lang,
            "translationOf": base_id,
            "title": tr["title"], "deck": tr["deck"], "lead": tr["lead"],
            "keyPoints": tr["keyPoints"], "body": blocks(tr["body"]),
            **{k: en[k] for k in CARRY_ARTICLE if k in en},
        })

REEL_EN = {d["_id"]: d for d in BATCH1_REELS_EN}
for rid, meta in BATCH2_REELS.items():
    REEL_EN[rid] = {"_id": rid, **meta,
                    "publishedAt": BATCH2_EN.get(rid, {}).get("publishedAt", "2026-08-13T09:00:00Z")}

for rid, per_lang in REELS.items():
    en = REEL_EN[rid]
    for lang, title in per_lang.items():
        docs.append({
            "_id": f"{rid}-{lang}", "_type": "learnReel",
            "language": lang, "translationOf": rid, "title": title,
            **{k: v for k, v in en.items() if k not in ("_id", "_type", "title", "language")},
        })

out = pathlib.Path(__file__).parent / "learn-i18n.ndjson"
out.write_text("\n".join(json.dumps(d, ensure_ascii=False) for d in docs) + "\n")

from collections import Counter
c = Counter((d["_type"], d["language"]) for d in docs)
print(f"{len(docs)} documents -> {out}")
for (t, l), n in sorted(c.items()):
    print(f"  {t:14} {l}  {n}")
