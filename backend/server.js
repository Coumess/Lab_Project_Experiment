const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();

// 1. LE RADAR : Il va écrire dans les logs la moindre tentative de connexion
app.use((req, res, next) => {
    console.log(`📡 Quelqu'un frappe à la porte : ${req.method} ${req.url}`);
    next();
});

// 2. LE BOUCLIER ANTI-CORS
app.use(cors({ origin: '*' }));
app.use(express.json({ limit: '10mb' }));

// 3. PRÉPARATION DU DOSSIER
const dataFolder = path.join(__dirname, 'data');
if (!fs.existsSync(dataFolder)) {
    fs.mkdirSync(dataFolder);
}

// 4. LA ROUTE DE TEST (Très important pour l'étape 3)
app.get('/', (req, res) => {
    console.log("👋 Quelqu'un a visité la page d'accueil !");
    res.send("<h1>Le serveur backend fonctionne et est bien connecté à Internet ! ✅</h1>");
});

// 5. LA ROUTE DE SAUVEGARDE
app.post('/save_data', (req, res) => {
    const participantId = req.body.participant_id;
    const donnees = req.body.resultats;

    if (!participantId || !donnees) {
        return res.status(400).send('Données manquantes');
    }

    const fileName = `resultats_${participantId}.json`;
    const filePath = path.join(dataFolder, fileName);

    fs.writeFile(filePath, JSON.stringify(req.body, null, 2), (err) => {
        if (err) {
            console.error('❌ Erreur d\'écriture :', err);
            return res.status(500).send('Erreur interne');
        }
        console.log(`✅ Succès : Fichier ${fileName} créé !`);
        res.status(200).send('Sauvegarde réussie');
    });
});

// 6. LANCEMENT DU SERVEUR
// On laisse Railway injecter son propre port mystère, sinon on utilise 3000
const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Serveur actif et ouvert sur le port ${PORT}`);
});