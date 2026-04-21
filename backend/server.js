const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const archiver = require('archiver');

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

// (Assure-toi de garder l'initialisation de dataFolder que tu as déjà)
const archiveFolder = path.join(dataFolder, 'archives');
if (!fs.existsSync(archiveFolder)) {
    fs.mkdirSync(archiveFolder);
}

// --- MIDDLEWARE DE SÉCURITÉ ---
const checkAuth = (req, res, next) => {
    // On récupère le token dans l'URL (?token=xxx)
    const token = req.query.token;
    // On vérifie avec la variable d'environnement (ou un mot de passe par défaut en dev)
    const secret = process.env.ADMIN_SECRET || 'dev_secret_temporaire';
    
    if (token === secret) {
        next(); // Le mot de passe est bon, on continue
    } else {
        res.status(403).send('🚫 Accès refusé. Jeton de sécurité invalide ou manquant.');
    }
};

// --- NOUVELLE ROUTE SÉCURISÉE D'EXTRACTION (ARCHIVE + ZIP) ---
app.get('/api/admin/extract', checkAuth, (req, res) => {
    fs.readdir(dataFolder, (err, files) => {
        if (err) return res.status(500).send("Erreur lors de la lecture du dossier");

        const jsonFiles = files.filter(f => f.endsWith('.json') && f !== 'package.json');
        
        if (jsonFiles.length === 0) {
            return res.status(200).send("Aucune nouvelle donnée à extraire.");
        }

        // 1. Créer un dossier de lot unique basé sur la date/heure
        const timestamp = Date.now();
        const batchFolderName = `batch_${timestamp}`;
        const batchFolderPath = path.join(archiveFolder, batchFolderName);
        fs.mkdirSync(batchFolderPath);

        // 2. Déplacer les fichiers JSON dans ce nouveau dossier
        jsonFiles.forEach(file => {
            const oldPath = path.join(dataFolder, file);
            const newPath = path.join(batchFolderPath, file);
            fs.renameSync(oldPath, newPath); // Déplacement synchrone
        });

        // 3. Créer le fichier ZIP et l'envoyer au client
        res.setHeader('Content-Type', 'application/zip');
        res.setHeader('Content-Disposition', `attachment; filename="extraction_donnees_${timestamp}.zip"`);

        const archive = archiver('zip', { zlib: { level: 9 } }); // Niveau de compression max
        
        archive.on('error', (err) => {
            res.status(500).send({ error: err.message });
        });

        // On connecte l'archive directement à la réponse HTTP
        archive.pipe(res);

        // On ajoute tout le dossier de lot dans l'archive
        archive.directory(batchFolderPath, false);

        // On finalise l'archive (déclenche l'envoi final)
        archive.finalize();
        
        console.log(`📦 Extraction réussie : ${jsonFiles.length} fichiers archivés dans ${batchFolderName}.`);
    });
});

// --- NOUVELLE ROUTE : SAUVEGARDE TOTALE (URGENCE / BACKUP) ---
// Cette route télécharge TOUT depuis le début, sans rien modifier au serveur.
app.get('/api/admin/extract-all', checkAuth, (req, res) => {
    
    const timestamp = Date.now();
    
    // Prépare le téléchargement du ZIP
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="sauvegarde_COMPLETE_${timestamp}.zip"`);

    const archive = archiver('zip', { zlib: { level: 9 } });
    
    archive.on('error', (err) => {
        console.error("Erreur lors de la sauvegarde totale :", err);
        res.status(500).send({ error: err.message });
    });

    // Connecte l'archive au téléchargement
    archive.pipe(res);

    // On ajoute l'intégralité du dossier data (Nouveaux JSON + Dossier Archives)
    // Le "false" évite de créer un dossier parent "data" dans le zip
    archive.directory(dataFolder, false);

    // Lance la création du zip et le téléchargement
    archive.finalize();
    
    console.log(`🚑 Sauvegarde TOTALE demandée et téléchargée !`);
});

// ==========================================

// 6. LANCEMENT DU SERVEUR
// On laisse Railway injecter son propre port mystère, sinon on utilise 8080
const PORT = process.env.PORT || 8080;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Serveur actif et ouvert sur le port ${PORT}`);
});