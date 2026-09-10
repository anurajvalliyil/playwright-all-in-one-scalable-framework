import "dotenv/config";

fetch("https://api.groq.com/openai/v1/models", {
  headers: { "Authorization": `Bearer ${process.env.GROQ_API_KEY}` }
})
  .then(res => res.json())
  .then(data => {
    const models = data.data.map((m: any) => m.id);
    console.log(models);
  })
  .catch(console.error);
