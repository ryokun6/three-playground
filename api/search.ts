export const config = {
  runtime: "edge",
};

export default async function handler(request: Request): Promise<Response> {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("query");

  if (!query) {
    return new Response(
      JSON.stringify({ error: "Query parameter is required" }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  const encodedQuery = encodeURIComponent(query);
  const INVIDIOUS_INSTANCES = [
    "https://invidious.nerdvpn.de",
    "https://vid.puffyan.us",
    "https://yewtu.be",
  ];

  for (const instance of INVIDIOUS_INSTANCES) {
    try {
      const response = await fetch(
        `${instance}/api/v1/search?q=${encodedQuery}&type=video`
      );

      if (!response.ok) continue;

      const data = await response.json();
      return new Response(JSON.stringify(data), {
        headers: { "Content-Type": "application/json" },
      });
    } catch (e) {
      console.warn(`Failed to fetch from ${instance}:`, e);
      continue;
    }
  }

  return new Response(
    JSON.stringify({ error: "Failed to fetch from all instances" }),
    {
      status: 500,
      headers: { "Content-Type": "application/json" },
    }
  );
}
