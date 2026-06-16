export type ObservabilityPage = {
  id: string;
  system_id: string;
  path: string;
  url: string;
  title?: string;
  journey?: string;
  referrer?: string;
  session_id?: string;
  user_agent?: string;
  created_at: string;
};

export type ObservabilitySystem = {
  id: string;
  name: string;
  public_key?: string;
  connected: boolean;
  first_seen_at: string;
  last_seen_at?: string;
  activePages: number;
  journeys: number;
  pages: ObservabilityPage[];
  recentEvents: ObservabilityPage[];
};

export async function getSystems(): Promise<ObservabilitySystem[]> {
  const response = await fetch('/api/systems');
  if (!response.ok) throw new Error('Failed to load systems');
  const data = await response.json();
  return data.systems || [];
}
