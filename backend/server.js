const Fastify = require('fastify');
const cors = require('@fastify/cors');
const fs = require('fs'); // Pour écrire des fichiers sur votre ordinateur

// 1. Initialisation de Fastify (avec limite à 50 Mo native)
const fastify = Fastify({
    logger: true,
    bodyLimit: 50 * 1024 * 1024 
});

async function startServer() {
    try {
        // 2. Autoriser Live Server à envoyer des données au serveur
        await fastify.register(cors, { 
            origin: '*' 
        });

        // 3. Route pour sauvegarder les résultats de jsPsych
        fastify.post('/api/save-results', async (request, reply) => {
            const donnees = request.body;
            
            // Si le corps de la requête est vide, on le signale
            if (!donnees) {
                console.log("❌ Erreur : Aucune donnée reçue.");
                return reply.status(400).send({ error: "Aucune donnée" });
            }
            
            // On récupère l'ID du participant
            const participantId = donnees.participant_id || 'anonyme_' + Date.now();
            
            const filePath = 'backend/data/all_results.json';

            // Vérifie que le dossier data existe
            if (!fs.existsSync('backend/data')) {
                fs.mkdirSync('backend/data');
            }

            // Créer le fichier s'il n'existe pas
            if (!fs.existsSync(filePath)) {
                fs.writeFileSync(filePath, '[]');
            }

            // Lire les données existantes
            const existingData = JSON.parse(fs.readFileSync(filePath));

            // Ajouter le nouveau participant
            existingData.push({
                participant_id: participantId,
                resultats: donnees.resultats
            });

            // Réécrire le fichier proprement
            fs.writeFileSync(filePath, JSON.stringify(existingData, null, 2));
                        
            console.log(`✅ Succès : Données du participant ${participantId} sauvegardées !`);
            
            return { success: true, message: "Sauvegardé avec succès" };
        });

        // 4. Allumer le serveur
        await fastify.listen({ port: 3000 });
        console.log(`🚀 Serveur en ligne sur http://localhost:3000`);

    } catch (err) {
        fastify.log.error(err);
        process.exit(1);
    }
}

startServer();