// Helper script to get the correct Pinecone index host
// Run this to see what your actual index host should be

import { Pinecone } from '@pinecone-database/pinecone';
import 'dotenv/config';

async function getIndexInfo() {
  try {
    const pc = new Pinecone();
    const indexName = process.env.PINECONE_INDEX_NAME;
    
    if (!indexName || !process.env.PINECONE_API_KEY) {
      console.error('Missing PINECONE_INDEX_NAME or PINECONE_API_KEY in .env');
      process.exit(1);
    }
    
    console.log('Fetching index information...\n');
    
    // Try to get index info
    const index = pc.index(indexName);
    
    // List all indexes to verify connection
    const indexes = await pc.listIndexes();
    console.log('Available indexes:', indexes.indexes?.map(idx => idx.name));
    
    const targetIndex = indexes.indexes?.find(idx => idx.name === indexName);
    
    if (targetIndex) {
      console.log('\n✅ Found your index!');
      console.log('Index Name:', targetIndex.name);
      console.log('Index Dimension:', targetIndex.dimension);
      console.log('Index Metric:', targetIndex.metric);
      
      // For serverless indexes, the host format is typically:
      // {index-name}-{uuid}.svc.{region}.pinecone.io
      console.log('\n💡 Recommended PINECONE_INDEX_HOST format:');
      
      // The host is typically derived from the index name
      // You can find the exact host in the Pinecone dashboard under your index's details
      console.log(`https://${indexName}.svc.us-east-1.pinecone.io`);
      console.log('OR without https://:');
      console.log(`${indexName}.svc.us-east-1.pinecone.io`);
      
      console.log('\n⚠️  Note: The actual host may have a UUID suffix.');
      console.log('Please check your Pinecone dashboard for the exact host URL.');
      
    } else {
      console.error('\n❌ Index not found!');
      console.error('Make sure PINECONE_INDEX_NAME matches your index name.');
    }
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error('\nMake sure:');
    console.error('1. Your PINECONE_API_KEY is correct');
    console.error('2. Your PINECONE_INDEX_NAME exists');
    console.error('3. Your environment is set correctly in .env');
  }
}

getIndexInfo();

