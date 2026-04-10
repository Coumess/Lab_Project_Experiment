// GÉNÉRATION DE L'ID
// Création d'un ID unique en décimal traduit en string
const subject_id = Math.random().toString(36).substring(2, 10);

// INITIALISATION DE jsPsych
const jsPsych = initJsPsych({
    on_finish: function() {
        // Envoi des données au serveur à la fin de l'expérience
        const donneesPropres = jsPsych.data.get()
            .filterCustom(function(trial) {
                return trial.task === 'target' || trial.task === 'demographics';
            })
            .ignore(['internal_node_id', 'time_elapsed', 'trial_type', 'success', 'timeout', 'failed_images'])
            .values();

        fetch('https://confident-reflection-production-dba9.up.railway.app/save_data', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                participant_id: subject_id,
                resultats: donneesPropres
            })
        })
        .then(response => {
            const display = document.querySelector('.jspsych-display-element');
            if (response.ok) {
                display.innerHTML = "<h1 style='color:white; text-align:center; margin-top:20vh;'>Merci pour votre participation !<br>Les données ont été sauvegardées.</h1>";
            } else {
                display.innerHTML = "<h1 style='color:red; text-align:center; margin-top:20vh;'>Erreur lors de la sauvegarde (Le serveur a refusé les données).</h1>";
            }
        })
        .catch(error => {
            console.error('Erreur réseau:', error);
            const display = document.querySelector('.jspsych-display-element');
            if (display) {
                display.innerHTML = "<h1 style='color:red; text-align:center; margin-top:20vh;'>Erreur de connexion au serveur.<br>Avez-vous bien lancé 'node server.js' dans le terminal ?</h1>";
            }
        });
    }
});

//  Attribution des touches
// Math.random() > 0.5
const randomKey = Math.random() > 0.5;
const attrKey = randomKey ? 's' : 'l';
const unattrKey = randomKey ? 'l' : 's';
const attrDisplay = attrKey.toUpperCase();
const unattrDisplay = unattrKey.toUpperCase();

// Data à envoyer au serveur 
jsPsych.data.addProperties({
    participant_id: subject_id,
    touche_attractif: attrDisplay,
    touche_non_attractif: unattrDisplay
});

// Fonction pour mélanger nos visages et mots 
function shuffle(array) {
    let newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
}

function genererStimuli() {
    let stimuliFinaux = [];
    let visagesA = shuffle(visagesAttracNames);
    let visagesU = shuffle(visagesUnattracNames);
    let motsP = shuffle(motsPositifs);
    let motsN = shuffle(motsNeutres);
    let motsNeg = shuffle(motsNegatifs);

    for (let i = 0; i < 30; i++) {
        let valence, motChoisi;
        if (i < 10)      { valence = 'positif'; motChoisi = motsP[i]; }
        else if (i < 20) { valence = 'neutre';  motChoisi = motsN[i - 10]; }
        else             { valence = 'negatif'; motChoisi = motsNeg[i - 20]; }

        stimuliFinaux.push({
            target_image: visagesA[i],
            baseline_attrac: 'Attractif',
            valence: valence,
            word: motChoisi
        });
    }

    for (let i = 0; i < 30; i++) {
        let valence, motChoisi;
        if (i < 10)      { valence = 'positif'; motChoisi = motsP[i % 10]; }
        else if (i < 20) { valence = 'neutre';  motChoisi = motsN[(i - 10) % 10]; }
        else             { valence = 'negatif'; motChoisi = motsNeg[(i - 20) % 10]; }

        stimuliFinaux.push({
            target_image: visagesU[i],
            baseline_attrac: 'Unattractif',
            valence: valence,
            word: motChoisi
        });
    }
    return stimuliFinaux;
}


// Constante des stimulis
const motsPositifs = [
    "Chaleureux", "Bienveillant", "Heureux", "Ouvert", "Positif", 
    "Fascinant", "Respectueux", "Sincère", "Honnête", "Intelligent", 
    "Brillant", "Juste", "Drôle", "Tolérant", "Généreux", 
    "Talentueux", "Intéressant", "Génial", "Formidable", "Merveilleux"
];

const motsNeutres = [
    "Expansif", "Solitaire", "Sceptique", "Ordinaire", "Systématique", 
    "Excitable", "Excité", "Troublant", "Nostalgique", "Réservé", 
    "Traditionnel", "Rebelle", "Théâtral", "Silencieux", "Classique", 
    "Contrôlé", "Clownesque", "Normal", "Obéissant", "Flatteur"
];

const motsNegatifs = [
    "Raciste", "Ignoble", "Malhonnête", "Égoïste", "Haineux", 
    "Méprisant", "Irrespectueux", "Violent", "Méchant", "Odieux", 
    "Dégoûtant", "Cruel", "Démoralisant", "Injuste", "Déprimant", 
    "Insultant", "Hypocrite", "Intolérant", "Désagréable", "Menteur"
];

const visagesAttracNames = [
    "face_attrac/AF-218.jpg", "face_attrac/AF-242.jpg", "face_attrac/AF-244.jpg", "face_attrac/AF-255.jpg", "face_attrac/BF-002.jpg",
    "face_attrac/BF-013.jpg", "face_attrac/BF-214.jpg", "face_attrac/BF-216.jpg", "face_attrac/BF-217.jpg", "face_attrac/BF-218.jpg",
    "face_attrac/BF-229.jpg", "face_attrac/BF-232.jpg", "face_attrac/BF-233.jpg", "face_attrac/BF-240.jpg", "face_attrac/BF-241.jpg",
    "face_attrac/BF-244.jpg", "face_attrac/BM-043.jpg", "face_attrac/LF-243.jpg", "face_attrac/LF-249.jpg", "face_attrac/LM-224.jpg",
    "face_attrac/WF-003.jpg", "face_attrac/WF-012.jpg", "face_attrac/WF-022.jpg", "face_attrac/WF-024.jpg", "face_attrac/WF-027.jpg",
    "face_attrac/WF-205.jpg", "face_attrac/WF-220.jpg", "face_attrac/WF-233.jpg", "face_attrac/WF-238.jpg", "face_attrac/WF-242.jpg"
];

const visagesUnattracNames = [
    "face_unnattrac/AM-212.jpg", "face_unnattrac/AM-224.jpg", "face_unnattrac/AM-226.jpg", "face_unnattrac/AM-233.jpg", "face_unnattrac/BF-007.jpg",
    "face_unnattrac/BF-029.jpg", "face_unnattrac/BF-038.jpg", "face_unnattrac/BF-044.jpg", "face_unnattrac/BF-200.jpg", "face_unnattrac/BF-224.jpg",
    "face_unnattrac/BF-227.jpg", "face_unnattrac/BM-213.jpg", "face_unnattrac/BM-219.jpg", "face_unnattrac/LF-220.jpg", "face_unnattrac/LM-203.jpg",
    "face_unnattrac/LM-209.jpg", "face_unnattrac/LM-240.jpg", "face_unnattrac/LM-251.jpg", "face_unnattrac/WF-002.jpg", "face_unnattrac/WF-010.jpg",
    "face_unnattrac/WF-026.jpg", "face_unnattrac/WF-204.jpg", "face_unnattrac/WF-210.jpg", "face_unnattrac/WF-248.jpg", "face_unnattrac/WF-250.jpg",
    "face_unnattrac/WM-201.jpg", "face_unnattrac/WM-206.jpg", "face_unnattrac/WM-215.jpg", "face_unnattrac/WM-228.jpg", "face_unnattrac/WM-236.jpg"
];

// Fonction asynchrone pour charger le JSON et lancer l'expérience (se fait en même temps que le reste)
function runExperiment() {
    try {
        // Fais le mélange
        const stimuli = genererStimuli()

        // Préchargement des images (peut-être à changer pour randomize les trials)
        const preloadImages = stimuli.map(trial => trial.target_image);
        const preload = {
            type: jsPsychPreload,
            images: preloadImages
        };

        // Consentement éclairé (inspiré du CNRS)
        const consent = {
            type: jsPsychSurveyHtmlForm,
            preamble: '<h2>Consentement Éclairé</h2>',
            html: `
                <div style="text-align: left; margin: 20px auto; max-width: 600px; background: white; padding: 20px; border-radius: 8px; color: black; font-size: 15px;">
                    <p>Bonjour et bienvenue dans cette expérience.</p>
                    <p><strong>Avant de commencer, veuillez lire attentivement les conditions suivantes :</strong></p>
                    <ul>
                        <li>Votre participation est entièrement <strong>volontaire</strong>.</li>
                        <li>Vous êtes libre d'interrompre l'expérience à tout moment en fermant simplement cette fenêtre, sans enregistrement de vos données.</li>
                        <li>Toutes les données recueillies seront traitées de manière strictement <strong>anonyme et confidentielle</strong>.</li>
                        <li> Vous acceptez que vos réponses à l'expérience posées soient exploitées dans le cadre de l'étude.</li>
                        <li>Cette expérience dure environ x à x minutes.</li>
                    </ul>
                    <hr style="margin: 20px 0;">
                    <p style="text-align: center;">
                        <label style="cursor: pointer; font-weight: bold;">
                            <input type="checkbox" id="consent_checkbox" name="consent" required style="transform: scale(1.5); margin-right: 10px;">
                            Je certifie avoir plus de 18 ans, avoir lu ces informations, et j'accepte de participer.
                        </label>
                    </p>
                </div>
            `,
            button_label: 'Valider et Continuer',
            data: { task: 'consent' }
        };

        // Formulaire démographique
        const demographics = {
            type: jsPsychSurveyHtmlForm,
            preamble: '<h2>Informations démographiques</h2><p>Veuillez répondre aux questions ci-dessous avant de commencer :</p>',
            html: `
                <div style="text-align: left; margin: 20px auto; max-width: 400px; background: white; padding: 20px; border-radius: 8px; color: black;">
                    <p>
                        <label for="age"><strong>Âge :</strong></label><br>
                        <input type="number" id="age" name="age" required min="18" max="101" style="width: 100%; padding: 8px; margin-top: 5px;">
                    </p>
                    <fieldset style="border: none; padding: 0; margin: 0 0 15px 0;">
                        <legend style="font-weight: bold; margin-bottom: 5px;">Sexe :</legend>
                        <input type="radio" id="femme" name="sexe" value="Femme" required> <label for="femme">Femme</label><br>
                        <input type="radio" id="homme" name="sexe" value="Homme"> <label for="homme">Homme</label><br>
                        <input type="radio" id="autre" name="sexe" value="Autre"> <label for="autre">Autre / Préfère ne pas répondre</label>
                    </fieldset>
                    <p>
                        <label for="education"><strong>Niveau d'étude :</strong></label><br>
                        <select id="education" name="education" required style="width: 100%; padding: 8px; margin-top: 5px;">
                            <option value="">-- Sélectionnez une option --</option>
                            <option value="Brevet">Brevet des collèges</option>
                            <option value="Bac">Baccalauréat</option>
                            <option value="Bac+2">Bac +2 (BTS, DUT...)</option>
                            <option value="Bac+3">Bac +3 (Licence...)</option>
                            <option value="Bac+5">Bac +5 (Master...)</option>
                            <option value="Doctorat">Doctorat</option>
                            <option value="Autre">Autre</option>
                        </select>
                    </p>
                    <p>
                        <label for="langue"><strong>Niveau de français :</strong></label><br>
                        <select id="langue" name="niveau_francais" required style="width: 100%; padding: 8px; margin-top: 5px;">
                            <option value="">-- Sélectionnez une option --</option>
                            <option value="Natif">Langue maternelle (Natif)</option>
                            <option value="Bilingue_C2">Bilingue / Maîtrise (C2)</option>
                            <option value="Avance_C1">Courant / Avancé (C1)</option>
                            <option value="Intermediaire_B1_B2">Intermédiaire (B1 - B2)</option>
                            <option value="Debutant_A1_A2">Débutant (A1 - A2)</option>
                        </select>
                    </p>
                </div>
            `,
            button_label: 'Continuer',
            data: { task: 'demographics' }
        };

        // Instructions
        const instructions = {
            type: jsPsychHtmlKeyboardResponse,
            stimulus: `
                <div style="max-width: 800px; text-align: center;">
                    <h1>Bienvenue dans cette étude</h1>
                    <p>Dans ces tâches, vous allez juger un visage d'une personne et indiquer s'il est attractif ou non.</p>
                    <p>Votre objectif est de juger <strong style="color: red">le plus rapidement possible</strong> si vous trouvez ce visage <strong>attractif</strong> ou non</strong>.</p>
                    <br>
                    <p>Si le visage est <strong style="color: red; font-size: 34px;">Attractif</strong>, appuyez sur la touche <strong style="color: red; font-size: 34px;">${attrDisplay.toUpperCase()}</strong>.</p>
                    <p>Si le visage est <strong style="color: green; font-size: 34px;">Non attractif</strong>, appuyez sur la touche <strong style="color: green; font-size: 34px;">${unattrDisplay.toUpperCase()}</strong>.</p>
                    <br>
                    <p>Placez vos doigts sur les touches ${attrDisplay.toUpperCase()} et ${unattrDisplay.toUpperCase()} et appuyez sur n'importe quelle touche pour commencer.</p>
                </div>
            `
        };

        // Modalité expérience
        const instru_exp = {
            type: jsPsychHtmlKeyboardResponse,
            stimulus: `
                <div style="max-width: 800px; text-align: center;">
                    <h1>Expérience</h1>
                    <p>Dans cette tâche, vous allez voir un mot apparaître brièvement, suivi du visage d'une personne.</p>
                    <p>Votre objectif est de juger <strong style="color: red">le plus rapidement possible</strong> si vous trouvez ce visage <strong>attractif</strong> ou non</strong>.</p>
                    <br>
                    <p>Si le visage est <strong style="color: red; font-size: 34px;"> Attractif </strong>, appuyez sur la touche <strong style="color: red; font-size: 34px;"> ${attrDisplay.toUpperCase()} </strong>.</p>
                    <p>Si le visage est <strong style="color: green; font-size: 34px;"> Non attractif </strong>, appuyez sur la touche <strong style="color: green; font-size: 34px;"> ${unattrDisplay.toUpperCase()} </strong>.</p>
                    <br>
                    <p>Appuyez sur n'importe quelle touche pour commencer.</p>
                </div>
            `
        };

        // Essais

        // Une croix en transition / Inter-Stimulus Interval (ISI)
        const fixation = {
            type: jsPsychHtmlKeyboardResponse,
            stimulus: '<div class="fixation">+</div>',
            choices: "NO_KEYS",
            trial_duration: 300,
            data: { task: 'fixation' }
        };

        // mot à valence (neg or pos or neutral)
        const word = {
            type: jsPsychHtmlKeyboardResponse,
            stimulus: function() {
                return `<div class="word">${jsPsych.timelineVariable('word')}</div>`;
            },
            choices: "NO_KEYS",
            trial_duration: 800,
            data: { task: 'word' }
        };
        
        // Face que l'on présente 
        const target = {
            type: jsPsychImageKeyboardResponse,
            stimulus: jsPsych.timelineVariable('target_image'),
            stimulus_height: 500, // Ajustement de la taille de l'image
            choices: [attrKey, unattrKey], // Commande pour indiquer attractif ou non
            prompt: `<p style="font-size: 20px; margin-top: 20px;"><strong>${attrDisplay}</strong> : Attractif &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; <strong>${unattrDisplay}</strong> : Non attractif</p>`,
            data: {
                task: 'target',
                word: jsPsych.timelineVariable('word'),
                valence: jsPsych.timelineVariable('valence'),
                baseline_attrac: jsPsych.timelineVariable('baseline_attrac')
            },
            on_finish: function(data) {
                if (data.response === attrKey) {
                    data.response_meaning = 'Attractif';
                } else if (data.response === unattrKey) {
                    data.response_meaning = 'Non attractif';
                }
                data.mapping_condition = `Attr=${attrKey.toUpperCase()} | Unattr=${unattrKey.toUpperCase()}`;
            }
        };
        
        // Procédure, déroulement de l'expérience
        const procedure = {
            timeline: [fixation, word, fixation, target],
            timeline_variables: stimuli,
            randomize_order: true // randomize les conditions x
        };

        // Scénario
        jsPsych.run([preload, consent, demographics, instructions, instru_exp, procedure]);

    } catch (error) {
        console.error("Erreur d'initialisation : ", error);
        document.body.innerHTML = "<p>Erreur lors du chargement des données. Vérifiez que vous utilisez un serveur local.</p>";
    }
}

runExperiment();