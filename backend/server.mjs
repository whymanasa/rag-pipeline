import express from 'express';
import cors from 'cors';
import 'dotenv/config'; // Load environment variables
import { Pinecone } from '@pinecone-database/pinecone';
import fetch from 'node-fetch'; // For calling Azure OpenAI API

// --- Configuration ---
const PORT = process.env.PORT || 4000;
const TOP_K_RESULTS = 5; // How many relevant results to fetch from Pinecone

// --- Initialize Pinecone ---
const pc = new Pinecone(); // API key automatically read from PINECONE_API_KEY
const pineconeIndexName = process.env.PINECONE_INDEX_NAME;
if (!pineconeIndexName || !process.env.PINECONE_API_KEY) {
    throw new Error("Missing Pinecone credentials (API Key or Index Name) in .env file.");
}
const index = pc.index(pineconeIndexName); // Client for Database API operations
// Note: Using SDK's built-in text query functionality (no need for manual embedding)

// --- Azure OpenAI Configuration ---
const azureOpenaiEndpoint = process.env.AZURE_OPENAI_ENDPOINT;
const azureOpenaiKey = process.env.AZURE_OPENAI_KEY;
const azureDeploymentName = process.env.AZURE_OPENAI_DEPLOYMENT_NAME;
const azureApiVersion = process.env.AZURE_OPENAI_API_VERSION;
if (!azureOpenaiEndpoint || !azureOpenaiKey || !azureDeploymentName || !azureApiVersion) {
    throw new Error("Missing Azure OpenAI credentials (Endpoint, Key, Deployment Name, or API Version) in .env file.");
}
const azureApiUrl = `${azureOpenaiEndpoint}/openai/deployments/${azureDeploymentName}/chat/completions?api-version=${azureApiVersion}`;

// --- Initialize Express App ---
const app = express();
// Configure CORS to allow requests ONLY from your frontend's origin
app.use(cors({
  origin: 'http://localhost:5173', // Your frontend's address
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type'],
}));
app.use(express.json()); // Allow server to read JSON request bodies

// --- API Endpoint: /api/chat ---
app.post('/api/chat', async (req, res) => {
    const userQuery = req.body.query;

    if (!userQuery) {
        return res.status(400).json({ error: 'Query is required' });
    }

    console.log(`[${new Date().toISOString()}] Received query: ${userQuery}`);

    try {
        // --- Step 1: Generate Embedding for User Query using Pinecone Inference API ---
        console.log("   Generating embedding for user query...");
        const embeddings = await pc.inference.embed(
            'llama-text-embed-v2',        // Model name matching your index
            [userQuery],                   // Array of texts to embed
            { inputType: 'passage', truncate: 'END' }
        );
        
        const queryVector = embeddings.data[0].values; // Extract the vector
        console.log("   Embedding generated successfully.");

        // --- Step 2: Query Pinecone Index with the embedding vector ---
        console.log("   Querying Pinecone index for relevant documents...");
        const queryResponse = await index.query({
            vector: queryVector,           // Use the generated embedding vector
            topK: TOP_K_RESULTS,          // Get the top N results
            includeMetadata: true         // Include metadata to retrieve stored text
        });
        console.log(`   Found ${queryResponse.matches?.length || 0} potential matches.`);

        // --- Step 3: Prepare Context (Augment) ---
        console.log("   Preparing context for Azure OpenAI...");
        const context = queryResponse.matches
            ?.map(match => match.metadata?.text || match.text) // Extract text from metadata or text field
            .filter(text => text)              // Remove any undefined/null entries
            .join('\n---\n');                  // Combine snippets into one block

        if (!context || context.trim() === "") {
             console.log("   No relevant context found in Pinecone.");
             // Send a specific message if no context was found
             return res.json({ answer: "I looked through the restaurant data, but couldn't find specific information related to your question." });
        }
        // console.log("   Context prepared:\n", context); // Uncomment for debugging

        // --- Step 4: Generate Answer (Azure OpenAI API via fetch) ---
        console.log("   Generating answer with Azure OpenAI...");
        const messages = [
            { role: "system", content: `You are a helpful assistant specialized in Bengaluru restaurants. Your knowledge is based *only* on the provided context snippets. Answer the user's question concisely using *only* information from the context. If the context doesn't contain the answer, clearly state that the provided data doesn't have that information.` },
            { role: "user", content: `Based on the following information:\n\nContext:\n${context}\n\n---\n\nAnswer this question: ${userQuery}` }
        ];

        const azureRequestBody = {
            messages: messages,
            max_tokens: 150,
            temperature: 0.3,
        };

        const azureResponse = await fetch(azureApiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'api-key': azureOpenaiKey, // Azure uses 'api-key' header
            },
            body: JSON.stringify(azureRequestBody),
        });

        if (!azureResponse.ok) {
            const errorBody = await azureResponse.text();
            throw new Error(`Azure OpenAI API request failed: ${azureResponse.status} ${errorBody}`);
        }

        const completionsResponse = await azureResponse.json();
        const generatedAnswer = completionsResponse.choices?.[0]?.message?.content?.trim();

        if (!generatedAnswer) {
             if (completionsResponse.error) {
                 console.error("   Azure OpenAI Error:", completionsResponse.error);
                 throw new Error(`Azure OpenAI returned an error: ${completionsResponse.error.message}`);
             }
            throw new Error('Azure OpenAI response did not contain an answer.');
        }
        console.log("   Answer generated successfully.");

        // --- Step 4: Send Response to Frontend ---
        res.json({ answer: generatedAnswer }); // Send the final answer

    } catch (error) {
        // --- Error Handling ---
        console.error(`[${new Date().toISOString()}] Error processing chat request:`, error.message);
        res.status(500).json({
            error: 'Sorry, something went wrong while processing your request.',
        });
    }
});

// --- Start Server ---
app.listen(PORT, () => {
    console.log(`Backend server running on http://localhost:${PORT}`);
    console.log(`Ready to receive chat requests at http://localhost:${PORT}/api/chat`);
});