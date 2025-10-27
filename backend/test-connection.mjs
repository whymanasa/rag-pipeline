// Simple test script to verify backend connectivity
// Run this while the backend server is NOT running to test the endpoint

import fetch from 'node-fetch';

const testQuery = "What are the best restaurants in Bangalore?";

console.log('Testing backend connection...\n');
console.log('Test Query:', testQuery);
console.log('Endpoint: http://localhost:4000/api/chat\n');

try {
  const response = await fetch('http://localhost:4000/api/chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query: testQuery }),
  });

  console.log('Status Code:', response.status);
  console.log('Status Text:', response.statusText);

  if (!response.ok) {
    const errorText = await response.text();
    console.error('\nError Response:', errorText);
    process.exit(1);
  }

  const data = await response.json();
  console.log('\n✅ Connection successful!');
  console.log('\nResponse:', JSON.stringify(data, null, 2));

} catch (error) {
  console.error('\n❌ Connection failed:', error.message);
  console.error('\nMake sure:');
  console.error('1. Backend server is running (cd backend && node server.mjs)');
  console.error('2. Environment variables are set in backend/.env');
  console.error('3. All required services (Pinecone, Azure OpenAI) are configured');
  process.exit(1);
}

