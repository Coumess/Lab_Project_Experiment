// 1. Initialisation de jsPsych
const jsPsych = initJsPsych({
    on_finish: function() {
        // Affiche les données brutes à la fin de l'expérience
        jsPsych.data.displayData();
    }
});

// 2. Contrebalancement aléatoire des touches
const mappingCondition = Math.random() < 0.5 ? 1 : 2;
let attrKey, unattrKey;

if (mappingCondition === 1) {
    attrKey = 'e';
    unattrKey = 'p';
} else {
    attrKey = 'p';
    unattrKey = 'e';
}

// 3. Fonction asynchrone pour charger le JSON et lancer l'expérience
async function runExperiment() {
    try {
        // Chargement du fichier JSON
        const response = await fetch('stimuli.json');
        if (!response.ok) throw new Error("Erreur lors du chargement de stimuli.json");
        const stimuli = await response.json();

        // 4. Préchargement des images (évite les latences d'affichage)
        const preloadImages = stimuli.map(trial => trial.target_image);
        const preload = {
            type: jsPsychPreload,
            images: preloadImages
        };

        // 5. Instructions (s'adaptent automatiquement au mapping)
        const instructions = {
            type: jsPsychHtmlKeyboardResponse,
            stimulus: `
                <div style="max-width: 800px; text-align: center;">
                    <h1>Bienvenue dans cette étude</h1>
                    <p>Dans cette tâche, vous allez voir un mot apparaître brièvement, suivi du visage d'une personne.</p>
                    <p>Votre objectif est de juger <strong>le plus rapidement possible</strong> si vous trouvez ce visage attractif ou non.</p>
                    <br>
                    <p>Si le visage est <strong>Attractif</strong>, appuyez sur la touche <strong style="color: #ffca28; font-size: 24px;">${attrKey.toUpperCase()}</strong>.</p>
                    <p>Si le visage est <strong>Non attractif</strong>, appuyez sur la touche <strong style="color: #ffca28; font-size: 24px;">${unattrKey.toUpperCase()}</strong>.</p>
                    <br>
                    <p>Placez vos index sur les touches ${attrKey.toUpperCase()} et ${unattrKey.toUpperCase()} et appuyez sur n'importe quelle touche pour commencer.</p>
                </div>
            `
        };

        // 6. Définition des événements d'un essai (Trial)
        const fixation = {
            type: jsPsychHtmlKeyboardResponse,
            stimulus: '<div class="fixation">+</div>',
            choices: "NO_KEYS",
            trial_duration: 1000,
            data: { task: 'fixation' }
        };

        const prime = {
            type: jsPsychHtmlKeyboardResponse,
            stimulus: function() {
                // Utilisation d'une fonction pour récupérer la variable dynamiquement
                return `<div class="prime">${jsPsych.timelineVariable('prime')}</div>`;
            },
            choices: "NO_KEYS",
            trial_duration: 800,
            data: { task: 'prime' }
        };

        const isi = {
            type: jsPsychHtmlKeyboardResponse,
            stimulus: '', // Écran vide
            choices: "NO_KEYS",
            trial_duration: 200,
            data: { task: 'isi' }
        };

        const target = {
            type: jsPsychImageKeyboardResponse,
            stimulus: jsPsych.timelineVariable('target_image'),
            choices: ['e', 'p'],
            data: {
                task: 'target',
                prime_word: jsPsych.timelineVariable('prime'),
                prime_condition: jsPsych.timelineVariable('prime_condition')
            },
            on_finish: function(data) {
                // Enregistrement de la signification de la réponse du participant
                if (data.response === attrKey) {
                    data.response_meaning = 'Attractif';
                } else if (data.response === unattrKey) {
                    data.response_meaning = 'Non attractif';
                }
                data.mapping_condition = `Attr=${attrKey.toUpperCase()} | Unattr=${unattrKey.toUpperCase()}`;
            }
        };

        // 7. Assemblage de la procédure avec les variables de la timeline
        const procedure = {
            timeline: [fixation, prime, isi, target],
            timeline_variables: stimuli,
            randomize_order: true // Mélange aléatoire des essais pour chaque participant
        };

        // 8. Lancement
        jsPsych.run([preload, instructions, procedure]);

    } catch (error) {
        console.error("Erreur d'initialisation : ", error);
        document.body.innerHTML = "<p>Erreur lors du chargement des données. Vérifiez que vous utilisez un serveur local.</p>";
    }
}

// Exécution
runExperiment();