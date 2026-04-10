const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();

// MiddleWare
// On crée nos règles CORS
const corsOptions = {
    origin: 'https://attractive-exp.up.railway.app', // Votre frontend
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type']
};

// On applique ces règles au serveur
app.use(cors(corsOptions));

// On gère le "preflight" (OPTIONS) UNIQUEMENT pour la route /save_data
app.options('/save_data', cors(corsOptions));

// Middleware pour lire le JSON (avec une limite augmentée au cas où)
app.use(express.json({ limit: '10mb' }));

// Créer le dossier "data" s'il n'existe pas déjà
const dataFolder = path.join(__dirname, 'data');
if (!fs.existsSync(dataFolder)) {
    fs.mkdirSync(dataFolder);
}

// La route qui reçoit les données à la fin de l'expérience
app.post('/save_data', (req, res) => {
    // On récupère l'ID du participant et les résultats depuis la requête
    const participantId = req.body.participant_id;
    const donnees = req.body.resultats;

    if (!participantId || !donnees) {
        console.log("Erreur : ID ou données manquantes !");
        return res.status(400).send('Données manquantes');
    }

    // On crée un nom de fichier unique avec l'ID du participant
    const fileName = `resultats_${participantId}.json`;
    const filePath = path.join(dataFolder, fileName);

    // On sauvegarde le fichier dans le dossier 'data'
    fs.writeFile(filePath, JSON.stringify(req.body, null, 2), (err) => {
        if (err) {
            console.error('Erreur lors de la sauvegarde du fichier :', err);
            return res.status(500).send('Erreur interne du serveur');
        }
        
        console.log(`✅ Succès : Données sauvegardées dans ${fileName}`);
        res.status(200).send('Données sauvegardées avec succès');
    });
});

// Lancement du serveur
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Serveur actif sur http://localhost:${PORT}`);
    console.log(`📁 Les fichiers seront sauvegardés dans le dossier : ${dataFolder}`);
});