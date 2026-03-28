const https = require('https');
const fs = require('fs');
const path = require('path');

// Load environment variables from .env.local
const envPath = path.join(__dirname, '.env.local');
if (fs.existsSync(envPath)) {
    fs.readFileSync(envPath, 'utf-8').split('\n').forEach(line => {
        const [key, ...vals] = line.split('=');
        if (key && vals.length) process.env[key.trim()] = vals.join('=').trim();
    });
}

const projectId = process.env.FIREBASE_PROJECT_ID;

if (!projectId) {
    console.error('Missing FIREBASE_PROJECT_ID in .env.local');
    process.exit(1);
}

https.get(`https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/userPosts?pageSize=1`, (resp) => {
  let data = '';
  resp.on('data', (chunk) => { data += chunk; });
  resp.on('end', () => {
    const post = JSON.parse(data).documents[0];
    console.log("Found post:", post.name);
    if (post.fields.postPhotos && post.fields.postPhotos.arrayValue.values.length > 0) {
      const storagePath = post.fields.postPhotos.arrayValue.values[0].stringValue;
      console.log("Raw storage path:", storagePath);

      let cleanPath = storagePath;
      if (cleanPath.startsWith('gs://')) {
          cleanPath = cleanPath.split('/').slice(3).join('/');
      }

      const encodedPath = cleanPath.split('/').map(encodeURIComponent).join('%2F');
      const photoUrl = `https://firebasestorage.googleapis.com/v0/b/${projectId}.appspot.com/o/${encodedPath}?alt=media`;
      console.log("Constructed photo URL:", photoUrl);

      // Let's test if the URL actually resolves
      https.get(photoUrl, (imgResp) => {
          console.log("Image URL response status:", imgResp.statusCode);
      }).on("error", (err) => {
          console.log("Error fetching image URL:", err.message);
      });

    }
  });
});
