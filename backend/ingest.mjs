// Import necessary tools
import fs from 'fs';
import csv from 'csv-parser';
import { Pinecone } from '@pinecone-database/pinecone';
import 'dotenv/config'; // Loads .env file

// --- Configuration ---
const CSV_FILE_PATH = 'ready_for_pinecone_10k.csv'; // Use the smaller file
const BATCH_SIZE = 96; // Recommended batch size for upsertRecords with text
const TEXT_FIELD_NAME = 'description'; // The name of the column in your CSV

// --- Main Function ---
const main = async () => {
    try {
        // 1. --- INITIALIZE PINECONE ---
        const pc = new Pinecone();
        const indexName = process.env.PINECONE_INDEX_NAME;
        const indexHost = process.env.PINECONE_INDEX_HOST; // Get host from .env

        if (!indexName || !indexHost || !process.env.PINECONE_API_KEY) {
            throw new Error("Missing Pinecone credentials (API Key, Index Name, or Index Host) in .env file.");
        }

        // Get the specific index client, potentially using the host if needed by your SDK version
        // Note: Newer SDK versions might infer the host, but including it aligns with the doc example
        const index = pc.index(indexName); // Host might be automatically handled by newer clients

        // We will upsert to the default namespace
        const namespace = index.namespace("__default__");

        console.log(`Connected to Pinecone index: ${indexName}`);

        // 2. --- SETUP ---
        let batch = [];
        let counter = 0;
        const rowsToProcess = [];

        // 3. --- READ THE CSV INTO MEMORY ---
        console.log(`Reading ${CSV_FILE_PATH}...`);
        await new Promise((resolve, reject) => {
            fs.createReadStream(CSV_FILE_PATH)
                .pipe(csv())
                .on('data', (row) => {
                    if (row && row[TEXT_FIELD_NAME]) {
                         rowsToProcess.push(row[TEXT_FIELD_NAME]);
                    } else {
                         console.warn("Skipping empty or invalid row:", row);
                    }
                })
                .on('end', () => {
                    console.log(`Finished reading ${rowsToProcess.length} valid rows.`);
                    resolve();
                })
                .on('error', reject);
        });

        // 4. --- PROCESS ROWS IN BATCHES USING upsertRecords ---
        console.log(`Starting ingestion using Pinecone's integrated embedding via upsertRecords...`);

        for (let i = 0; i < rowsToProcess.length; i += BATCH_SIZE) {
            const textBatch = rowsToProcess.slice(i, i + BATCH_SIZE);

            // 5. --- PREPARE RECORDS FOR upsertRecords ---
            // Format: { id: "...", text: "...", metadata: {...} }
            // Using upsertRecords method which handles text-to-vector conversion automatically
            const recordsToUpsert = textBatch.map((text, indexInBatch) => {
                const recordId = `vec-${counter + indexInBatch}`; // Generate unique ID
                return {
                    id: recordId,
                    text: text  // Use 'text' field for upsertRecords
                    // Removed metadata for now to avoid the parsing error
                };
            });

            // 6. --- UPLOAD BATCH VIA upsertRecords ---
            // Use upsertRecords method which handles text-to-vector conversion
            await namespace.upsertRecords(recordsToUpsert);


            counter += recordsToUpsert.length;
            const batchNum = Math.ceil(counter / BATCH_SIZE);
            console.log(`Upserted batch ${batchNum} (Total vectors: ${counter})`);
        }


        console.log(`--- INGESTION COMPLETE ---`);
        console.log(`Successfully processed ${rowsToProcess.length} rows and upserted ${counter} records to the '${indexName}' index.`);

    } catch (error) {
        console.error('An error occurred during ingestion:', error);
         if (error.response) {
            try {
                const errorBody = await error.response.text();
                console.error('API Error details:', errorBody);
            } catch (e) {
                console.error('Could not parse error response body.');
            }
         } else {
             console.error('Full error object:', error); // Log the full error if it's not an API response error
         }
    }
};

// Run the main function
main();
