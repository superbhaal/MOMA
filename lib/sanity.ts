const PROJECT_ID = process.env.EXPO_PUBLIC_SANITY_PROJECT_ID!;
const DATASET = process.env.EXPO_PUBLIC_SANITY_DATASET || 'production';
const API_VERSION = '2024-01-01';

const SANITY_API_URL = `https://${PROJECT_ID}.api.sanity.io/v${API_VERSION}/data/query/${DATASET}`;

export async function sanityFetch<T>(query: string, params?: Record<string, string>): Promise<T> {
  const searchParams = new URLSearchParams({ query });
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      searchParams.set(`$${key}`, `"${value}"`);
    });
  }

  const response = await fetch(`${SANITY_API_URL}?${searchParams.toString()}`);
  const data = await response.json();
  return data.result as T;
}
