import express from 'express';
import cors from 'cors';
import 'dotenv/config'; // Load environment variables
import { Pinecone } from '@pinecone-database/pinecone';
import fetch from 'node-fetch'; // For calling Azure OpenAI API

// --- Configuration ---
const PORT = process.env.PORT || 4000;
const TOP_K_RESULTS = 10; // How many relevant results to fetch from Pinecone

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
        
        // Construct the single, structured prompt for Azure OpenAI
        const fullPrompt = `You are an AI assistant specialized in restaurants in Bengaluru, India. Your knowledge is strictly limited to the information provided in the 'CONTEXT' section below. Do not use any outside knowledge or provide information not explicitly mentioned in the context.

CONTEXT:
---
${context}
---

QUESTION:
${userQuery}

INSTRUCTIONS:
1. **Analyze Context:** Carefully read the CONTEXT provided above.
2. **Answer from Context Only:** Answer the user's QUESTION using *only* the details found within the CONTEXT section. Do not infer or add external information.
3. **Direct & Specific Answer:** If the CONTEXT directly answers the QUESTION, provide a concise answer (aim for 2-4 sentences). Mention specific restaurant names, locations (areas), cuisines, costs, or popular dishes as found in the context.
4. **Partial Information:** If the CONTEXT provides some relevant information but doesn't fully answer the QUESTION, state clearly what you found and what's missing. Start your response like: "Based on the available data, I found that..."
5. **No Information:** If the CONTEXT does not contain *any* relevant information to answer the QUESTION, respond *only* with: "I couldn't find specific information about that in the provided restaurant data." Do not apologize or offer to search elsewhere.
6. **Multiple Matches:** If several restaurants in the CONTEXT match the query (e.g., multiple restaurants in an area), list the top 2-3 most relevant ones mentioned in the context.
7. **Clarity:** Use clear language. Mention restaurant names and areas distinctly.

ANSWER:`;

        const messages = [
            { role: "user", content: fullPrompt }
        ];

        const azureRequestBody = {
            messages: messages,
            max_tokens: 250,      // Increased for more detailed responses
            temperature: 0.2,     // Lower temperature for more focused, factual responses (optimal for RAG)
            top_p: 0.95,          // Nucleus sampling for better coherence
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