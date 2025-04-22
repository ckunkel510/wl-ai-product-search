export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Only POST method is allowed' });
  }

  const { manufacturerCode, description } = req.body;

  if (!manufacturerCode || !description) {
    return res.status(400).json({ error: 'Missing manufacturerCode or description' });
  }

 const prompt = `
You are a product matching assistant.

Your job is to search across these websites and return the most likely matching product links with prices:
- Home Depot
- Lowe's
- Amazon
- Tractor Supply
- McCoy's Building Supply

The product is:
- Description: ${description}
- Manufacturer Code: ${manufacturerCode}

Search using keywords from the description and UPC/manufacturer code when available. If an exact match is not found, provide the closest relevant product that matches brand and type.

Return only this JSON (no markdown, no commentary):

{
  "HDURL": { "url": "https://...", "price": "$00.00" },
  "LURL": { "url": "https://...", "price": "$00.00" },
  "AMZNURL": { "url": "https://...", "price": "$00.00" },
  "TSCURL": { "url": "https://...", "price": "$00.00" },
  "MCURL": { "url": "https://...", "price": "$00.00" },
  "OTHERURL": { "url": "https://...", "price": "$00.00" }
}

Leave fields empty only if no relevant or similar product can be found.
`;



  try {
    const aiRes = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "gpt-4",
        messages: [
          { role: "system", content: "You are a helpful assistant that formats answers strictly in JSON." },
          { role: "user", content: prompt }
        ],
        temperature: 0.3
      })
    });

    const json = await aiRes.json();
    const content = json.choices?.[0]?.message?.content;

    console.log("🧠 Raw AI Response:", content); // DEBUG LOG

    try {
      const parsed = JSON.parse(content);
      return res.status(200).json(parsed);
    } catch (err) {
      return res.status(200).json({
  HDURL: { url: "", price: "" },
  LURL: { url: "", price: "" },
  AMZNURL: { url: "", price: "" },
  TSCURL: { url: "", price: "" },
  MCURL: { url: "", price: "" },
  OTHERURL: { url: content, price: "" }
});

    }
  } catch (error) {
    console.error("🚨 AI Request Failed:", error);
    return res.status(500).json({ error: "Server error while contacting AI" });
  }
}
