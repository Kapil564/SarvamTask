import fs from 'fs';

const env = fs.readFileSync('.env', 'utf8');
const keyMatch = env.match(/VITE_GEMINI_API_KEY="?(.*?)"?(\n|$)/);
const key = keyMatch ? keyMatch[1] : null;

if (!key) {
  console.error("No key found");
  process.exit(1);
}

fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${key}`)
  .then(res => res.json())
  .then(data => {
    console.log("Available models supporting generateContent:");
    if (data.models) {
      data.models.forEach(m => {
        if (m.supportedGenerationMethods && m.supportedGenerationMethods.includes("generateContent")) {
          console.log(m.name);
        }
      });
    } else {
      console.log(data);
    }
  })
  .catch(console.error);
