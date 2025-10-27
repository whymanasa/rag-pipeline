# RAG Pipeline - Bengaluru Restaurant Guide

A Retrieval-Augmented Generation (RAG) application that helps users find restaurants in Bengaluru using AI-powered semantic search.

## 🚀 Features

- **AI-Powered Search**: Ask questions in natural language to find restaurants
- **Semantic Search**: Uses Pinecone vector database for intelligent restaurant recommendations
- **Context-Aware Answers**: Powered by Azure OpenAI for accurate, detailed responses
- **Modern UI**: Built with React + Vite for a smooth user experience

## 🏗️ Architecture

```
Frontend (React) → Backend (Express) → Pinecone (Vector DB) → Azure OpenAI (Generation)
```

### Technology Stack

- **Frontend**: React, Vite, TailwindCSS
- **Backend**: Node.js, Express
- **Vector Database**: Pinecone
- **LLM**: Azure OpenAI
- **Embeddings**: Pinecone's llama-text-embed-v2 model

## 📋 Prerequisites

- Node.js 18+ 
- Pinecone API key
- Azure OpenAI API credentials

## 🛠️ Setup

### 1. Clone and Install

```bash
# Install frontend dependencies
npm install

# Install backend dependencies
cd backend
npm install
```

### 2. Environment Variables

Create a `.env` file in the `backend/` directory:

```env
# Pinecone Configuration
PINECONE_API_KEY=your_pinecone_api_key
PINECONE_INDEX_NAME=banglore-restaurant

# Azure OpenAI Configuration
AZURE_OPENAI_ENDPOINT=https://your-resource.openai.azure.com
AZURE_OPENAI_KEY=your_azure_openai_key
AZURE_OPENAI_DEPLOYMENT_NAME=your_deployment_name
AZURE_OPENAI_API_VERSION=2024-02-15-preview
```

### 3. Data Ingestion (One-time)

Load restaurant data into Pinecone:

```bash
cd backend
node ingest.mjs
```

### 4. Run the Application

**Terminal 1 - Backend:**
```bash
cd backend
node server.mjs
```

**Terminal 2 - Frontend:**
```bash
npm run dev
```

Visit http://localhost:5173 to use the application!

## 📁 Project Structure

```
rag-pipeline/
├── src/                    # Frontend React app
│   ├── components/
│   │   ├── ChatInput.jsx
│   │   └── MessageList.jsx
│   ├── App.jsx
│   └── main.jsx
├── backend/
│   ├── server.mjs         # Express API server
│   ├── ingest.mjs         # Data ingestion script
│   └── ready_for_pinecone_10k.csv
└── README.md
```

## 🔄 How It Works

1. **User Query**: User asks a question about restaurants in Bengaluru
2. **Embedding**: Query is converted to a vector using Pinecone's embedding model
3. **Vector Search**: Pinecone searches for similar restaurant data
4. **Context Retrieval**: Top 10 most relevant restaurant entries are retrieved
5. **Answer Generation**: Azure OpenAI generates a contextual answer
6. **Response**: User receives detailed restaurant recommendations

## 🤝 Contributing

Feel free to submit issues or pull requests!

## 📝 License

MIT
