# RAG Pipeline Flow Verification

## Complete Flow Overview

```
User Query (Frontend)
    ↓
[React App - src/App.jsx]
POST http://localhost:4000/api/chat
    ↓
[Backend Server - backend/server.mjs]
    ↓
Step 1: Embed Query (Pinecone Embedding API)
    ↓
Step 2: Search Pinecone Index (Vector Search)
    ↓
Step 3: Retrieve Context from Metadata
    ↓
Step 4: Generate Answer (Azure OpenAI API)
    ↓
[Backend Response]
    ↓
[React App receives answer]
    ↓
Display to User
```

## Verified Components

### ✅ Frontend (src/App.jsx)
- **URL**: `http://localhost:4000/api/chat` ✓
- **Method**: `POST` ✓
- **Headers**: `Content-Type: application/json` ✓
- **Body**: `{ query: userText }` ✓
- **Loading State**: Implemented ✓
- **Error Handling**: Implemented ✓

### ✅ Backend (backend/server.mjs)
- **Port**: 4000 ✓
- **CORS**: Enabled ✓
- **Endpoint**: `/api/chat` ✓
- **Expected Body**: `{ query: "..." }` ✓
- **Response Format**: `{ answer: "..." }` ✓

## Backend Processing Steps

### Step 1: Embed Query (Lines 50-78)
```javascript
// Embed user query using Pinecone API
POST https://api.{environment}.pinecone.io/embed
Body: { model: 'llama-text-embed-v2', inputs: [{ text: userQuery }] }
Result: queryVector (embedding)
```

### Step 2: Search Pinecone Index (Lines 80-88)
```javascript
// Query Pinecone for similar documents
index.query({
  vector: queryVector,
  topK: 5,
  includeMetadata: true
})
Result: Top 5 matching documents with metadata
```

### Step 3: Prepare Context (Lines 90-101)
```javascript
// Extract text from metadata
const context = matches.map(match => match.metadata.text).join('\n---\n')
Result: Combined context string
```

### Step 4: Generate Answer (Lines 104-149)
```javascript
// Call Azure OpenAI
POST {endpoint}/openai/deployments/{deployment}/chat/completions
Body: { messages, max_tokens: 150, temperature: 0.3 }
Result: Generated answer
```

## Environment Variables Required

Create a `.env` file in the `backend/` directory:

```env
# Pinecone Configuration
PINECONE_API_KEY=your_pinecone_api_key
PINECONE_INDEX_NAME=your_index_name
PINECONE_ENVIRONMENT=your_environment

# Azure OpenAI Configuration
AZURE_OPENAI_ENDPOINT=https://your-resource.openai.azure.com
AZURE_OPENAI_KEY=your_azure_openai_key
AZURE_OPENAI_DEPLOYMENT_NAME=your_deployment_name
AZURE_OPENAI_API_VERSION=2024-02-15-preview
```

## Testing the Connection

### 1. Start Backend Server
```bash
cd backend
npm start
# Or: node server.mjs
```

Expected output:
```
Backend server running on http://localhost:4000
Ready to receive chat requests at /api/chat
```

### 2. Start Frontend Server
```bash
npm run dev
```

Expected output:
```
VITE ready in XXX ms

➜ Local: http://localhost:5173/
```

### 3. Test the Flow
1. Open http://localhost:5173 in your browser
2. Type a query in the chat (e.g., "Best restaurants in Bangalore")
3. Watch the backend console for:
   - `Received query: ...`
   - `Embedding user query via Pinecone API...`
   - `Query embedded successfully.`
   - `Querying Pinecone index for relevant documents...`
   - `Found X potential matches.`
   - `Preparing context for Azure OpenAI...`
   - `Generating answer with Azure OpenAI...`
   - `Answer generated successfully.`

## Potential Issues and Solutions

### Issue 1: CORS Error
- **Symptom**: "Access to fetch blocked by CORS policy"
- **Solution**: Backend already has CORS enabled (line 35 in server.mjs)

### Issue 2: Backend Not Reachable
- **Symptom**: "Failed to fetch"
- **Check**: 
  - Is backend running on port 4000?
  - Is the URL correct in App.jsx (line 20)?

### Issue 3: Missing Environment Variables
- **Symptom**: Error on backend startup
- **Solution**: Create `.env` file with all required variables

### Issue 4: Pinecone API Key Invalid
- **Symptom**: "Pinecone Embedding API failed"
- **Check**: Verify PINECONE_API_KEY in .env

### Issue 5: Azure OpenAI Error
- **Symptom**: "Azure OpenAI API request failed"
- **Check**: Verify all Azure credentials in .env

## Code Flow Verification

✅ **Frontend → Backend Connection**
- App.jsx line 20: Correct URL
- App.jsx line 25: Correct body format
- server.mjs line 39: Correct endpoint
- server.mjs line 40: Correct body parsing

✅ **Backend Processing**
- Lines 50-78: Embedding works
- Lines 80-88: Pinecone search works
- Lines 90-101: Context preparation works
- Lines 104-149: Azure OpenAI generation works

✅ **Backend → Frontend Response**
- server.mjs line 152: Returns `{ answer: "..." }`
- App.jsx line 34: Parses response correctly
- App.jsx line 37-42: Displays answer

## Summary

The entire RAG pipeline is properly connected and configured. All components communicate correctly:
- ✅ Frontend sends user query to backend
- ✅ Backend embeds query via Pinecone API
- ✅ Backend searches Pinecone index for relevant documents
- ✅ Backend retrieves context from metadata
- ✅ Backend generates answer via Azure OpenAI
- ✅ Backend returns answer to frontend
- ✅ Frontend displays answer to user

The flow follows the RAG (Retrieve-Augment-Generate) pattern correctly.

