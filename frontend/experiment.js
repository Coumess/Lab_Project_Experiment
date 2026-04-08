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

        fetch('http://localhost:3000/api/save-results', {
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

// Ajouter cet identifiant à toutes les lignes de données
jsPsych.data.addProperties({
    participant_id: subject_id
});

//  Attribution des touches
const attrKey = 'P';
const unattrKey = 'E';
const attrDisplay = 'P';
const unattrDisplay = 'E';

// Fonction asynchrone pour charger le JSON et lancer l'expérience (se fait en même temps que le reste)
async function runExperiment() {
    try {
        // Chargement du fichier JSON
        const response = await fetch('stimuli.json');
        if (!response.ok) throw new Error("Erreur lors du chargement de stimuli.json");
        const stimuli = await response.json();

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
                        <input type="number" id="age" name="age" required min="18" max="99" style="width: 100%; padding: 8px; margin-top: 5px;">
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
                    <p>Si le visage est <strong>Attractif</strong>, appuyez sur la touche <strong style="color: red; font-size: 24px;">${attrDisplay.toUpperCase()}</strong>.</p>
                    <p>Si le visage est <strong>Non attractif</strong>, appuyez sur la touche <strong style="color: red; font-size: 24px;">${unattrDisplay.toUpperCase()}</strong>.</p>
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
                    <p>Si le visage est <strong>Attractif</strong>, appuyez sur la touche <strong style="color: red; font-size: 24px;">${attrDisplay.toUpperCase()}</strong>.</p>
                    <p>Si le visage est <strong>Non attractif</strong>, appuyez sur la touche <strong style="color: red; font-size: 24px;">${unattrDisplay.toUpperCase()}</strong>.</p>
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
        // mot à valence (neg or pos)
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
            data: {
                task: 'target',
                word: jsPsych.timelineVariable('word'),
                valence: jsPsych.timelineVariable('valence')
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
        
        // test valence
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