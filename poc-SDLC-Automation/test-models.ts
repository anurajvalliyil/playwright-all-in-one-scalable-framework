import "dotenv/config";

fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${process.env.ANTIGRAVITY_API_KEY}`)
  .then(res => res.json())
  .then(data => {
    const models = data.models.map((m: any) => m.name);
    console.log(models);
  })
  .catch(console.error);
