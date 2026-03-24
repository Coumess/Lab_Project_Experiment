const Fastify = require('fastify');
const cors = require('@fastify/cors');
const expressPlugin = require('@fastify/express');
const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs'); // Pour écrire des fichiers sur votre ordinateur

// 1. Initialisation de Fastify (avec limite à 50 Mo pour les grosses images)
const fastify = Fastify({
    logger: true,
    bodyLimit: 50 * 1024 * 1024 
});

async function startServer() {
    try {
        // 2. Autoriser Live Server (ou n'importe quel site) à envoyer des données au serveur
        await fastify.register(cors, { 
            origin: '*' // Accepte les requêtes de n'importe où
        });

        // 3. Ajouter la compatibilité Express
        await fastify.register(expressPlugin);

        // 4. Configurer Express pour lire les grosses données
        fastify.use(bodyParser.json({ limit: '50mb' }));

        // 5. Route pour sauvegarder les résultats de jsPsych
        fastify.post('/api/save-results', async (request, reply) => {
            const donnees = request.body;
            
            // On récupère l'ID du participant (envoyé par jsPsych)
            const participantId = donnees.participant_id || 'anonyme_' + Date.now();
            
            // On convertit les données en format lisible (JSON)
            const contenu = JSON.stringify(donnees.resultats, null, 2);
            
            // On sauvegarde ça dans un fichier sur votre ordinateur !
            fs.writeFileSync(`resultats_${participantId}.json`, contenu);
            
            console.log(`✅ Succès : Données du participant ${participantId} sauvegardées !`);
            
            return { success: true, message: "Sauvegardé avec succès" };
        });

        // 6. Allumer le serveur
        await fastify.listen({ port: 3000 });
        console.log(`🚀 Serveur en ligne sur http://localhost:3000`);

    } catch (err) {
        fastify.log.error(err);
        process.exit(1);
    }
}

startServer();