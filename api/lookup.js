// /api/lookup.js
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).send("Only POST allowed");

  const { manufacturerCode, description } = req.body;

  const prompt = `
Find matching product URLs and prices based on:
Manufacturer Code: ${manufacturerCode}
Description: ${description}

Search the following retailers: Home Depot, Lowe's, Amazon, Tractor Supply, and McCoy's Building Supply.
Return a JSON like:
{
  "HDURL": {"url": "...", "price": "..."},
  "LURL": {"url": "...", "price": "..."},
  ...
}`;

  const openaiRes = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: "gpt-4-turbo",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.3
    })
  });

  const data = await openaiRes.json();

  const content = data.choices?.[0]?.message?.content;
  try {
    const json = JSON.parse(content);
    return res.status(200).json(json);
  } catch (e) {
    return res.status(500).json({ error: "Failed to parse AI response", raw: content });
  }
}
