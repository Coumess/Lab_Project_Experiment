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
            
            // On convertit les données en format lisible (JSON)
            const contenu = JSON.stringify(donnees.resultats, null, 2);
            
            // On sauvegarde ça dans un fichier
            fs.writeFileSync(`resultats_${participantId}.json`, contenu);
            
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