import { setOnchainKitConfig } from "@coinbase/onchainkit";
import { getTokens } from "@coinbase/onchainkit/api";

export async function GET({ params }: { params: Promise<{ page: string }> }) {
  const { page } = await params;
  setOnchainKitConfig({ apiKey: "BASE_API_KEY" });
  const tokens = await getTokens({ limit: "100", page: page });
  return Response.json({ data: tokens });
}
