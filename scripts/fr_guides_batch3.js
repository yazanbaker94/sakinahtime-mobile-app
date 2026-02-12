// Batch 3: French translations for funeral + character + knowledge + finance guides
const fs = require('fs');
const path = require('path');
const localeDir = path.join(__dirname, '../client/i18n/locales');
const fr = JSON.parse(fs.readFileSync(path.join(localeDir, 'fr.json'), 'utf8'));

// how-to-perform-janazah-prayer
fr.guides["how-to-perform-janazah-prayer"].steps = {
    0: { title: "1. Se mettre en rangs", content: "Formez des rangs derrière l'Imam. Le défunt est placé devant, les hommes se tenant plus près de l'Imam." },
    1: { title: "2. Premier Takbir", content: "Levez vos mains et dites 'Allahu Akbar', puis récitez Al-Fatiha silencieusement." },
    2: { title: "3. Deuxième Takbir", content: "Dites 'Allahu Akbar' (sans lever les mains) et envoyez les bénédictions sur le Prophète : 'Allahumma salli ala Muhammad...'." },
    3: { title: "4. Troisième Takbir", content: "Dites 'Allahu Akbar' et faites une invocation pour le défunt : 'Allahumma ighfir lahu warhamhu...'." },
    4: { title: "5. Quatrième Takbir", content: "Dites 'Allahu Akbar' et faites une brève invocation pour vous-même et tous les musulmans." },
    5: { title: "6. Donner le Tasleem", content: "Tournez la tête à droite et dites 'As-salamu alaykum', puis à gauche et répétez." }
};

// how-to-offer-condolences
fr.guides["how-to-offer-condolences"].steps = {
    0: { title: "1. Rendre visite rapidement", content: "Rendez visite à la famille peu après avoir appris la nouvelle, mais soyez attentif à leur besoin d'espace et d'intimité." },
    1: { title: "2. Dire les mots appropriés", content: "Dites : 'Inna lillahi wa inna ilayhi raji'un' (À Allah nous appartenons et vers Lui nous retournons). Rappelez-leur qu'Allah récompensera leur patience." },
    2: { title: "3. Faire des invocations", content: "Faites des invocations pour le défunt et pour la famille : 'Qu'Allah lui pardonne, lui fasse miséricorde, et vous accorde patience et récompense.'" },
    3: { title: "4. Offrir une aide pratique", content: "Proposez une aide concrète comme préparer de la nourriture, faire des courses ou aider aux arrangements funéraires." },
    4: { title: "5. Être bref", content: "Gardez votre visite courte, sauf si la famille vous demande spécifiquement de rester plus longtemps." },
    5: { title: "6. Éviter les lamentations excessives", content: "Restez composé et évitez les lamentations bruyantes ou les démonstrations excessives de chagrin, car c'est déconseillé en Islam." }
};

// how-to-control-anger
fr.guides["how-to-control-anger"].steps = {
    0: { title: "1. Chercher refuge en Allah", content: "Quand vous sentez la colère monter, dites : 'A'udhu billahi min ash-shaytan ir-rajeem' (Je cherche refuge en Allah contre Satan le maudit)." },
    1: { title: "2. Rester silencieux", content: "Le Prophète (ﷺ) a dit : 'Si l'un d'entre vous se met en colère, qu'il se taise.' Le silence vous empêche de dire des choses que vous regretterez." },
    2: { title: "3. Changer de position", content: "Si vous êtes debout, asseyez-vous. Si vous êtes assis, allongez-vous. Le Prophète (ﷺ) a enseigné cela pour changer votre état physique." },
    3: { title: "4. Faire le Wudu", content: "Faites les ablutions avec de l'eau froide. Le Prophète (ﷺ) a dit que la colère vient de Satan, et Satan est créé de feu, qui est éteint par l'eau." },
    4: { title: "5. Se rappeler le pardon d'Allah", content: "Réfléchissez à la façon dont Allah vous pardonne malgré vos erreurs. Cela devrait vous rendre plus indulgent envers les autres." },
    5: { title: "6. Penser aux conséquences", content: "Considérez les conséquences négatives d'agir sous la colère : relations brisées, paroles regrettables et perte de respect." }
};

// how-to-practice-humility
fr.guides["how-to-practice-humility"].steps = {
    0: { title: "1. Se rappeler son origine", content: "Réfléchissez que vous avez été créé de poussière et que vous retournerez à la poussière. Cette réalité devrait humilier quiconque." },
    1: { title: "2. Reconnaître les faveurs d'Allah", content: "Reconnaissez que toutes vos bénédictions, talents et réussites sont des dons d'Allah, pas votre propre mérite." },
    2: { title: "3. Servir les autres", content: "Le Prophète (ﷺ) servait sa famille, réparait ses vêtements et aidait aux tâches ménagères bien qu'il fût le chef des musulmans." },
    3: { title: "4. Éviter la vantardise", content: "Ne vous vantez pas de votre richesse, savoir, lignée ou accomplissements. Le Prophète (ﷺ) a dit : 'Quiconque a de l'orgueil dans son cœur, ne serait-ce que le poids d'un atome, n'entrera pas au Paradis.'" },
    4: { title: "5. Accepter les conseils", content: "Soyez ouvert aux critiques et conseils des autres, quel que soit leur statut. La vérité peut venir de n'importe qui." },
    5: { title: "6. Traiter tout le monde également", content: "Montrez du respect aux pauvres, aux personnes âgées et à ceux de statut social inférieur. Le Prophète (ﷺ) a dit : 'Les meilleurs d'entre vous sont ceux qui sont les meilleurs envers leurs familles.'" }
};

// how-to-forgive-others
fr.guides["how-to-forgive-others"].steps = {
    0: { title: "1. Se rappeler le pardon d'Allah", content: "Allah vous pardonne d'innombrables péchés. Le Coran dit : 'Qu'ils pardonnent et passent outre. N'aimeriez-vous pas qu'Allah vous pardonne ?' (24:22)" },
    1: { title: "2. Comprendre la récompense", content: "Le Prophète (ﷺ) a dit : 'La charité ne diminue pas la richesse, et Allah augmente l'honneur de celui qui pardonne.'" },
    2: { title: "3. Se mettre à leur place", content: "Essayez de comprendre pourquoi la personne vous a fait du tort. Peut-être traversait-elle des difficultés ou ne réalisait pas l'impact de ses actes." },
    3: { title: "4. Faire des invocations pour eux", content: "Priez pour la personne qui vous a fait du tort. Cela adoucit votre cœur et vous aide à lâcher le ressentiment." },
    4: { title: "5. Lâcher les rancunes", content: "Garder des rancunes ne fait que vous blesser. Le Prophète (ﷺ) a dit : 'Ne vous haïssez pas les uns les autres, ne vous enviez pas les uns les autres, et soyez des serviteurs d'Allah comme des frères.'" },
    5: { title: "6. Se réconcilier si possible", content: "Si c'est approprié, faites le premier pas vers la réconciliation. Le Prophète (ﷺ) a dit : 'Il n'est pas permis à un musulman de rompre avec son frère plus de trois jours.'" }
};

// how-to-seek-knowledge
fr.guides["how-to-seek-knowledge"].steps = {
    0: { title: "1. Purifier son intention", content: "Cherchez le savoir pour Allah, pas pour un gain mondain ou de la reconnaissance. Le Prophète (ﷺ) a mis en garde contre la recherche du savoir par ostentation." },
    1: { title: "2. Commencer par les bases", content: "Commencez par les connaissances fondamentales : la croyance correcte (Aqeedah), comment prier, les règles islamiques de base et la récitation du Coran." },
    2: { title: "3. Trouver des enseignants qualifiés", content: "Apprenez auprès de savants compétents et dignes de confiance qui suivent le Coran et la Sunnah. Le Prophète (ﷺ) a dit : 'Ce savoir sera porté par les personnes dignes de confiance de chaque génération.'" },
    3: { title: "4. Être constant", content: "Étudiez régulièrement, même si c'est un peu chaque jour. Le Prophète (ﷺ) a dit : 'Les actes les plus aimés d'Allah sont ceux faits avec constance.'" },
    4: { title: "5. Pratiquer ce que l'on apprend", content: "Appliquez vos connaissances dans votre vie. Le savoir sans action est comme un arbre sans fruit." },
    5: { title: "6. Enseigner aux autres", content: "Partagez le savoir bénéfique avec les autres. Le Prophète (ﷺ) a dit : 'Les meilleurs d'entre vous sont ceux qui apprennent le Coran et l'enseignent.'" }
};

// how-to-make-tawbah
fr.guides["how-to-make-tawbah"].steps = {
    0: { title: "1. Arrêter le péché immédiatement", content: "La première étape est d'arrêter de commettre le péché immédiatement. Vous ne pouvez pas vous repentir en continuant le péché." },
    1: { title: "2. Ressentir un remords sincère", content: "Ressentez un regret sincère dans votre cœur pour avoir désobéi à Allah. Le Prophète (ﷺ) a dit : 'Le remords est le repentir.'" },
    2: { title: "3. Demander le pardon d'Allah", content: "Demandez à Allah de vous pardonner. Dites : 'Astaghfirullah' (Je demande pardon à Allah) et faites une invocation sincère." },
    3: { title: "4. Prendre la ferme résolution de ne pas recommencer", content: "Prenez la ferme intention de ne jamais retourner à ce péché. Cette détermination est essentielle pour un repentir valide." },
    4: { title: "5. Réparer si nécessaire", content: "Si votre péché impliquait de faire du tort à quelqu'un, demandez son pardon et réparez. Rendez ce qui a été volé, excusez-vous pour le mal causé, etc." },
    5: { title: "6. Remplacer le mal par le bien", content: "Faites suivre votre péché de bonnes actions. Allah dit : 'Les bonnes actions effacent les mauvaises' (Coran 11:114)." },
    6: { title: "7. Ne jamais désespérer", content: "Quelle que soit la gravité de vos péchés, ne perdez jamais espoir en la miséricorde d'Allah. Il dit : 'Dis : Ô Mes serviteurs qui avez commis des excès, ne désespérez pas de la miséricorde d'Allah' (Coran 39:53)." }
};

// understanding-riba
fr.guides["understanding-riba"].steps = {
    0: { title: "1. Qu'est-ce que le Riba ?", content: "Le Riba signifie 'augmentation' ou 'excès'. En finance islamique, il désigne tout intérêt garanti sur l'argent prêté, quel que soit le montant." },
    1: { title: "2. Pourquoi est-il interdit ?", content: "Allah dit : 'Allah a rendu licite le commerce et interdit le Riba' (Coran 2:275). Le Riba exploite les nécessiteux et crée de la richesse sans effort productif." },
    2: { title: "3. Types de Riba", content: "Riba al-Nasiah : Intérêt sur les prêts. Riba al-Fadl : Échange de mêmes marchandises en quantités inégales (ex. : or contre or avec surplus)." },
    3: { title: "4. Gravité du péché", content: "Le Prophète (ﷺ) a dit que le riba a 73 types, dont le moindre est comparable au fait de commettre l'adultère avec sa propre mère. Celui qui donne et celui qui prend sont maudits." },
    4: { title: "5. Alternatives", content: "Utilisez des banques islamiques, des arrangements de partage des bénéfices (Mudarabah) ou des prêts sans intérêt (Qard Hasan) au lieu des prêts conventionnels à intérêt." }
};

// halal-income
fr.guides["halal-income"].steps = {
    0: { title: "1. Importance du revenu Halal", content: "Le Prophète (ﷺ) a dit : 'Personne n'a jamais mangé meilleure nourriture que ce qu'il gagne du travail de ses propres mains.' Le revenu halal est essentiel pour une adoration acceptée." },
    1: { title: "2. Industries interdites", content: "Évitez les revenus provenant de : l'alcool, les jeux de hasard, le porc, la banque à intérêt, le divertissement pour adultes et tout ce qui est nuisible à la société." },
    2: { title: "3. Transactions honnêtes", content: "Soyez honnête dans les affaires. Le Prophète (ﷺ) a dit : 'Le commerçant véridique et digne de confiance sera avec les prophètes, les véridiques et les martyrs.'" },
    3: { title: "4. Prix équitable", content: "N'exploitez pas les clients et ne stockez pas les marchandises pour augmenter les prix. Le Prophète (ﷺ) a maudit ceux qui stockent la nourriture pour augmenter les prix." },
    4: { title: "5. Respecter les contrats", content: "Honorez tous les accords et contrats. Allah dit : 'Ô vous qui croyez, respectez vos engagements' (Coran 5:1)." },
    5: { title: "6. Payer les travailleurs rapidement", content: "Le Prophète (ﷺ) a dit : 'Donnez au travailleur son salaire avant que sa sueur ne sèche.' Retarder le paiement est une oppression." }
};

// islamic-banking
fr.guides["islamic-banking"].steps = {
    0: { title: "1. Principes fondamentaux", content: "La banque islamique interdit l'intérêt (riba), l'incertitude excessive (gharar) et les jeux de hasard (maysir). Les profits doivent provenir d'une activité économique réelle." },
    1: { title: "2. Murabaha (Coût majoré)", content: "La banque achète un actif et vous le vend avec une marge bénéficiaire déclarée. Vous payez en versements. Le profit est fixé à l'avance, ce n'est pas un intérêt." },
    2: { title: "3. Mudarabah (Partage des bénéfices)", content: "Vous fournissez le capital, la banque le gère. Les bénéfices sont partagés selon des ratios convenus ; les pertes sont supportées par le fournisseur de capital." },
    3: { title: "4. Musharakah (Partenariat)", content: "Les deux parties contribuent au capital et partagent les bénéfices et les pertes selon leur ratio d'investissement." },
    4: { title: "5. Ijara (Location)", content: "La banque achète un actif et vous le loue. Vous pouvez avoir l'option de l'acheter à la fin du terme du bail." },
    5: { title: "6. Choisir une banque", content: "Cherchez des banques avec un comité de supervision de la Charia. Recherchez leurs produits et assurez-vous qu'ils sont véritablement conformes, pas simplement des produits conventionnels rebaptisés." }
};

// halal-investing
fr.guides["halal-investing"].steps = {
    0: { title: "1. Filtrer les industries interdites", content: "Évitez les entreprises impliquées dans : l'alcool, le tabac, les jeux de hasard, la banque/assurance conventionnelle, le porc, les armes et le divertissement pour adultes." },
    1: { title: "2. Ratios financiers", content: "De nombreux savants exigent : un ratio dette/actifs inférieur à 33%, des revenus d'intérêts inférieurs à 5% du chiffre d'affaires, et des liquidités/créances inférieures à 50% des actifs." },
    2: { title: "3. Purification des rendements", content: "Si une petite partie des revenus de l'entreprise provient de sources non conformes, calculez et donnez ce pourcentage de vos dividendes en charité." },
    3: { title: "4. Fonds islamiques", content: "Envisagez des fonds communs de placement et des ETF conformes à la Charia qui sont pré-filtrés par des savants islamiques." },
    4: { title: "5. Immobilier", content: "L'investissement immobilier est généralement halal. Évitez le financement par des hypothèques conventionnelles ; utilisez plutôt le financement immobilier islamique." },
    5: { title: "6. Consulter les savants", content: "En cas de doute, consultez des savants compétents ou utilisez des services de filtrage de la finance islamique établis." }
};

// debt-management
fr.guides["debt-management"].steps = {
    0: { title: "1. Éviter les dettes inutiles", content: "Le Prophète (ﷺ) cherchait refuge contre la dette. N'empruntez que lorsque c'est vraiment nécessaire et ayez un plan clair pour rembourser." },
    1: { title: "2. Documenter toutes les dettes", content: "Allah commande : 'Quand vous contractez une dette pour un terme fixé, mettez-la par écrit' (Coran 2:282). Cela protège les deux parties." },
    2: { title: "3. Avoir l'intention de rembourser", content: "Le Prophète (ﷺ) a dit : 'Quiconque prend l'argent des gens avec l'intention de le rembourser, Allah l'aidera. Quiconque le prend avec l'intention de le gaspiller, Allah le détruira.'" },
    3: { title: "4. Rembourser rapidement", content: "Ne retardez pas le remboursement si vous en avez les moyens. Le Prophète (ﷺ) a dit : 'Le retard de paiement par un riche est une injustice.'" },
    4: { title: "5. Être indulgent en tant que créancier", content: "Si votre débiteur a des difficultés, donnez-lui du temps. Allah dit : 'Si quelqu'un est dans la gêne, qu'on lui accorde un délai jusqu'à ce qu'il soit dans l'aisance' (Coran 2:280)." },
    5: { title: "6. Pardonner si possible", content: "Pardonner une dette est hautement récompensé. Allah dit : 'Et si vous faites l'aumône, c'est mieux pour vous' (Coran 2:280)." }
};

fs.writeFileSync(path.join(localeDir, 'fr.json'), JSON.stringify(fr, null, 4), 'utf8');
console.log('✅ Batch 3 done: funeral (2) + character (3) + knowledge (2) + finance (5) = 12 guides translated');
console.log('All 27 guides now have complete French translations!');
