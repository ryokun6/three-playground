import type { VercelRequest, VercelResponse } from "@vercel/node";

export const handler = async (req: VercelRequest, res: VercelResponse) => {
  const { query } = req.query;

  const INVIDIOUS_INSTANCES = [
    "https://invidious.snopyta.org",
    "https://vid.puffyan.us",
    "https://invidious.kavin.rocks",
  ];

  for (const instance of INVIDIOUS_INSTANCES) {
    try {
      const response = await fetch(
        `${instance}/api/v1/search?q=${query}&type=video`
      );

      if (!response.ok) continue;

      const data = await response.json();
      return res.status(200).json(data);
    } catch (e) {
      console.warn(`Failed to fetch from ${instance}:`, e);
      continue;
    }
  }

  return res.status(500).json({ error: "Failed to fetch from all instances" });
};

export default handler;
