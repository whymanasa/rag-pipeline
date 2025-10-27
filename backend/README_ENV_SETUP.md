# Environment Variables Setup for RAG Pipeline

## Backend Environment Variables

Create a `.env` file in the `backend/` directory with the following variables:

### Pinecone Configuration

```env
# Your Pinecone API key (found in Pinecone dashboard under API Keys)
PINECONE_API_KEY=your_api_key_here

# Your index name (e.g., "banglore-restaurants")
PINECONE_INDEX_NAME=your_index_name_here

# Your index host (found in Pinecone dashboard under your index's details)
# Format: https://{index-name}-xxxxx.svc.{region}.pinecone.io
# OR: {index-name}-xxxxx.svc.{region}.pinecone.io (without https://)
PINECONE_INDEX_HOST=https://your-index-name-xxxxx.svc.us-east-1.pinecone.io
```

### Azure OpenAI Configuration

```env
# Your Azure OpenAI endpoint
AZURE_OPENAI_ENDPOINT=https://your-resource-name.openai.azure.com

# Your Azure OpenAI API key
AZURE_OPENAI_KEY=your_azure_api_key_here

# Your deployment name (e.g., "gpt-4" or "gpt-35-turbo")
AZURE_OPENAI_DEPLOYMENT_NAME=your_deployment_name

# API version (recommended: 2024-02-15-preview)
AZURE_OPENAI_API_VERSION=2024-02-15-preview
```

## How to Find Your Pinecone Index Host

1. Go to [Pinecone Dashboard](https://app.pinecone.io/)
2. Select your index
3. Look for "Host" or "Index URL" in the index details
4. Copy the full host URL

Example of correct format:
- `https://banglore-restaurants-12345.svc.us-east-1-aws.pinecone.io`
- `https://my-index-67890.svc.us-west-2-aws.pinecone.io`

## Common Issues and Solutions

### Issue 1: Double https:// in URL
**Symptom**: `https://https//...`  
**Solution**: Remove `https://` from the beginning of `PINECONE_INDEX_HOST` or ensure it's there only once.

### Issue 2: Invalid host format
**Symptom**: `aped-4627-b74a` or similar malformed domain  
**Solution**: Copy the exact host from Pinecone dashboard.

### Issue 3: DNS not found (ENOTFOUND)
**Solution**: Verify the host is correct and contains a valid region identifier like `us-east-1`.

## Example .env File

```env
# Pinecone
PINECONE_API_KEY=pcsk_xxxxxxxxxxxxxxxxxxxxx
PINECONE_INDEX_NAME=banglore-restaurants
PINECONE_INDEX_HOST=https://banglore-restaurants-p50bcsl.svc.us-east-1-aws.pinecone.io

# Azure OpenAI
AZURE_OPENAI_ENDPOINT=https://my-resource.openai.azure.com
AZURE_OPENAI_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
AZURE_OPENAI_DEPLOYMENT_NAME=gpt-35-turbo
AZURE_OPENAI_API_VERSION=2024-02-15-preview
```

## Important Notes

- The index host should include your actual index ID and region
- The region identifier is important (e.g., `us-east-1`, `us-west-2`)
- Make sure there are no extra spaces or quotes around the values
- Do NOT commit the `.env` file to git (it should be in `.gitignore`)

