const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();

// 1. LE BOUCLIER ANTI-CORS (Doit être la toute première chose)
// L'étoile '*' dit "J'accepte toutes les connexions entrantes" (parfait pour débloquer)
app.use(cors({
    origin: '*'
}));

// 2. LECTURE DES DONNÉES DU FRONTEND
app.use(express.json({ limit: '10mb' }));

// 3. PRÉPARATION DU DOSSIER DE SAUVEGARDE
const dataFolder = path.join(__dirname, 'data');
if (!fs.existsSync(dataFolder)) {
    fs.mkdirSync(dataFolder);
}

// 4. LA ROUTE POUR RECEVOIR LES DONNÉES
app.post('/save_data', (req, res) => {
    const participantId = req.body.participant_id;
    const donnees = req.body.resultats;

    if (!participantId || !donnees) {
        console.log("Erreur : Il manque l'ID ou les données.");
        return res.status(400).send('Données manquantes');
    }

    const fileName = `resultats_${participantId}.json`;
    const filePath = path.join(dataFolder, fileName);

    fs.writeFile(filePath, JSON.stringify(req.body, null, 2), (err) => {
        if (err) {
            console.error('Erreur d\'écriture sur le disque :', err);
            return res.status(500).send('Erreur interne du serveur');
        }
        
        console.log(`✅ Succès : Données du participant ${participantId} sauvegardées !`);
        res.status(200).send('Sauvegarde réussie');
    });
});

// 5. LE LANCEMENT DU SERVEUR (Le secret est le '0.0.0.0')
const PORT = process.env.PORT || 8080;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Serveur actif et ouvert sur le port ${PORT}`);
    console.log(`📁 Sauvegarde dans : ${dataFolder}`);
});