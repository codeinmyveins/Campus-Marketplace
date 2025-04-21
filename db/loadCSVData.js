const pool = require('./database');
const copyFrom = require('pg-copy-streams').from;
const fs = require('fs');
const path = require('path');

async function hasDataLoaded(client, dataId) {
    const result = await client.query(
      "SELECT 1 FROM data_flags WHERE id = $1 LIMIT 1",
      [dataId]
    );
    return result.rowCount > 0;
}
  
async function setDataLoadedFlag(client, dataId) {
    await client.query("INSERT INTO data_flags(id) VALUES ($1)", [dataId]);
}
  
async function loadCSVData(tableName, columnNames, csvfile, dataId) {
    const client = await pool.connect();
    try {
        const alreadyLoaded = await hasDataLoaded(client, dataId);
        if (alreadyLoaded) {
            // console.log("Data already loaded. Skipping.");
            client.release();
            return;
        }
  
        const stream = client.query(copyFrom(`
            COPY ${tableName}${columnNames? "("+columnNames+")" : ""}
            FROM STDIN WITH (FORMAT csv, HEADER true, DELIMITER ',')
        `));
        
        const fileStream = fs.createReadStream(path.join(__dirname, "./list/", csvfile));
        fileStream.pipe(stream)
         .on('finish', async () => {
            // console.log('Data copied successfully.');
            await setDataLoadedFlag(client, dataId);
            client.release();
        })
        .on('error', (err) => {
            console.error('Stream error:', err);
            client.release();
        });
  
    } catch (err) {
        console.error('Error loading CSV:', err);
        client.release();
    }
}
  
module.exports = loadCSVData;