export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Only POST method is allowed' });
  }

  const { manufacturerCode, description } = req.body;

  if (!manufacturerCode || !description) {
    return res.status(400).json({ error: 'Missing manufacturerCode or description' });
  }

  const prompt = `
You are an assistant helping match retail product listings.
Based on the data provided below, find product page URLs and prices from the following retailers:
Home Depot, Lowe's, Amazon, Tractor Supply, McCoy's Building Supply.

Respond ONLY in JSON using this exact structure:
{
  "HDURL": { "url": "URL here", "price": "$00.00" },
  "LURL": { "url": "URL here", "price": "$00.00" },
  "AMZNURL": { "url": "URL here", "price": "$00.00" },
  "TSCURL": { "url": "URL here", "price": "$00.00" },
  "MCURL": { "url": "URL here", "price": "$00.00" },
  "OTHERURL": { "url": "URL here", "price": "$00.00" }
}
Leave fields empty if not found.

Manufacturer Code: ${manufacturerCode}
Description: ${description}
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
      return res.status(500).json({ error: "Failed to parse AI response", raw: content });
    }
  } catch (error) {
    console.error("🚨 AI Request Failed:", error);
    return res.status(500).json({ error: "Server error while contacting AI" });
  }
}
