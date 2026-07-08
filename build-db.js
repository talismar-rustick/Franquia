const fs = require('fs');
const path = require('path');

const directoryPath = __dirname;
const portalPath = path.join(directoryPath, 'Portal');

// Create Portal directory if it doesn't exist
if (!fs.existsSync(portalPath)) {
    fs.mkdirSync(portalPath);
}

const db = [];

fs.readdir(directoryPath, (err, files) => {
    if (err) {
        console.error('Error reading directory:', err);
        return;
    }

    const htmlFiles = files.filter(file => file.endsWith('.html') && file !== 'index.html');
    
    htmlFiles.forEach(file => {
        const filePath = path.join(directoryPath, file);
        const content = fs.readFileSync(filePath, 'utf8');
        const franchiseName = file.replace('.html', '').trim();
        
        // Find all rows (<tr>...</tr>)
        const rowRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
        let match;
        
        const stores = [];

        while ((match = rowRegex.exec(content)) !== null) {
            const rowContent = match[1];
            
            // Extract all td contents
            const tdRegex = /<td[^>]*>(.*?)<\/td>/gi;
            const tds = [];
            let tdMatch;
            while ((tdMatch = tdRegex.exec(rowContent)) !== null) {
                tds.push(tdMatch[1].trim());
            }

            if (tds.length >= 3) {
                // Remove HTML tags inside tds if any
                const id = tds[0].replace(/<[^>]*>/g, '').trim();
                const name = tds[1].replace(/<[^>]*>/g, '').trim();
                const city = tds[2].replace(/<[^>]*>/g, '').trim();

                // Check if ID looks like a 24 char hex string
                if (id && id.length === 24 && /^[0-9a-f]+$/i.test(id)) {
                    stores.push({ id, name, city });
                }
            }
        }

        if (stores.length > 0) {
            db.push({
                franchise: franchiseName,
                stores: stores
            });
        }
    });

    const dataJsContent = `const franquiasData = ${JSON.stringify(db, null, 2)};`;
    
    const dataFilePath = path.join(portalPath, 'data.js');
    fs.writeFileSync(dataFilePath, dataJsContent);
    
    console.log(`Successfully generated data.js in Portal folder with ${db.length} franchises.`);
});
