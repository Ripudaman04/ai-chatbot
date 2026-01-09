export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ reply: "Method Not Allowed" });
  }

  try {
    const { message, history } = req.body;

    if (!message) {
      return res.status(400).json({ reply: "No message received" });
    }

    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      return res.status(500).json({ reply: "Missing API key" });
    }

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${key}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: history?.length
            ? history
            : [{ role: "user", parts: [{ text: message }] }],
        }),
      }
    );

    const data = await response.json();

    return res.status(200).json({
      reply:
        data?.candidates?.[0]?.content?.parts?.[0]?.text ||
        "No response from Gemini",
    });
  } catch (err) {
    return res.status(500).json({ reply: err.message });
  }
}
