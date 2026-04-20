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

// 5. LA ROUTE DE SAUVEGARDE (Celle que le frontend utilise)
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

// ==========================================
// 🚨 NOUVEAU : LES ROUTES D'ADMINISTRATION 🚨
// ==========================================

// 5.1 PAGE ADMIN : Voir tous les fichiers sauvegardés
app.get('/admin/fichiers', (req, res) => {
    fs.readdir(dataFolder, (err, files) => {
        if (err) {
            return res.status(500).send("Erreur lors de la lecture du dossier");
        }
        
        let html = '<h1 style="font-family: sans-serif;">Fichiers de données</h1>';
        html += '<ul style="font-family: monospace; font-size: 18px;">';
        
        if (files.length === 0) {
            html += '<li>Aucun fichier pour le moment.</li>';
        } else {
            files.forEach(file => {
                html += `<li style="margin-bottom: 10px;">
                            <a href="/admin/telecharger/${file}" style="color: blue;">📥 Télécharger ${file}</a>
                         </li>`;
            });
        }
        html += '</ul>';
        res.send(html);
    });
});

// 5.2 ROUTE DE TÉLÉCHARGEMENT : Quand on clique sur le lien
app.get('/admin/telecharger/:nomFichier', (req, res) => {
    const filePath = path.join(dataFolder, req.params.nomFichier);
    res.download(filePath, (err) => {
        if (err) {
            console.error("Erreur de téléchargement :", err);
            res.status(404).send("Fichier introuvable");
        }
    });
});

// --- ROUTE SECRÈTE POUR TÉLÉCHARGER LES DONNÉES ---
app.get('/api/admin/download-all', (req, res) => {
    // On lit tous les fichiers dans le dossier data
    fs.readdir(dataFolder, (err, files) => {
        if (err) {
            return res.status(500).send("Erreur lors de la lecture du dossier");
        }

        // On filtre pour ne garder que les .json
        const jsonFiles = files.filter(f => f.endsWith('.json'));
        let allData = [];

        // On assemble le tout
        jsonFiles.forEach(file => {
            const filePath = path.join(dataFolder, file);
            const content = fs.readFileSync(filePath, 'utf-8');
            allData.push(JSON.parse(content));
        });

        // On envoie le gros tableau final au navigateur
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', 'attachment; filename="toutes_les_donnees.json"');
        res.status(200).send(JSON.stringify(allData, null, 2));
    });
});

// ==========================================

// 6. LANCEMENT DU SERVEUR
// On laisse Railway injecter son propre port mystère, sinon on utilise 8080
const PORT = process.env.PORT || 8080;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Serveur actif et ouvert sur le port ${PORT}`);
});