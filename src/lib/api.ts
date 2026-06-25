export type ComponentUsage = {
  name: string;
  count: number;
  pages: string[];
  systems: string[];
  variants: string[];
  versions: string[];
};

export type DesignDebt = {
  id: string;
  system_id: string;
  page_event_id?: string;
  page_path: string;
  type: string;
  severity: "low" | "medium" | "high";
  title: string;
  description?: string;
  value?: number;
  created_at: string;
};

export type ComponentRegistryItem = {
  id: string;
  name: string;
  category?: string;
  status?: string;
  owner?: string;
  maturity?: string;
  version?: string;
  description?: string;
};

export type ObservabilityPage = {
  id: string;
  system_id: string;
  path: string;
  url: string;
  title?: string;
  display_title?: string;
  page_title?: string;
  document_title?: string;
  meta_title?: string;
  og_title?: string;
  twitter_title?: string;
  h1?: string;
  canonical_url?: string;
  hostname?: string;
  origin?: string;
  journey?: string;
  referrer?: string;
  session_id?: string;
  user_agent?: string;
  created_at: string;
  environment?: string;
  script_version?: string;
  heading_count?: number;
  button_count?: number;
  link_count?: number;
  form_count?: number;
  image_count?: number;
  section_count?: number;
  input_count?: number;
  ds_component_count?: number;
  tracked_component_count?: number;
  untracked_button_count?: number;
  untracked_form_count?: number;
  ds_readiness?: "low" | "medium" | "high";
  readiness_score?: number;
  confidence_score?: number;
  viewport_width?: number;
  viewport_height?: number;
  device_type?: string;
  load_time_ms?: number;
  dom_ready_time_ms?: number;
  navigation_type?: string;
  components?: ComponentUsage[];
  debt?: DesignDebt[];
};

export type ObservabilitySystem = {
  id: string;
  canonicalKey?: string;
  rawSystemIds?: string[];
  name: string;
  public_key?: string;
  connected: boolean;
  isCurrentlyConnected?: boolean;
  activeWindowMinutes?: number;
  aliasCount?: number;
  aliases?: Array<{
    id: string;
    name: string;
    publicKey?: string;
    firstSeenAt?: string;
    lastSeenAt?: string;
    active?: boolean;
  }>;
  first_seen_at: string;
  last_seen_at?: string;
  sourceHost?: string | null;
  sourceOrigin?: string | null;
  sourceUrl?: string | null;
  lastPage?: string | null;
  lastTitle?: string | null;
  lastDocumentTitle?: string | null;
  lastH1?: string | null;
  lastCanonicalUrl?: string | null;
  lastJourney?: string | null;
  lastReferrer?: string | null;
  environment?: string | null;
  scriptVersion?: string | null;
  deviceType?: string | null;
  viewport?: string | null;
  loadTimeMs?: number | null;
  activePages: number;
  journeys: number;
  totalDsComponents?: number;
  totalTrackedComponents?: number;
  dsReadiness?: "low" | "medium" | "high";
  readinessScore?: number;
  debtScore?: number;
  impactScore?: number;
  confidenceScore?: number;
  adoptionScore?: number;
  scoreReasons?: string[];
  componentUsage?: ComponentUsage[];
  designDebt?: DesignDebt[];
  pages: ObservabilityPage[];
  recentEvents: ObservabilityPage[];
};

export type SystemsResponse = {
  systems: ObservabilitySystem[];
  activeSystems: ObservabilitySystem[];
  registry: ComponentRegistryItem[];
  globalComponents: ComponentUsage[];
  designDebt: DesignDebt[];
  scores: {
    adoptionScore: number;
    readinessScore: number;
    debtScore: number;
    confidenceScore: number;
  };
};

export async function getSystems(): Promise<SystemsResponse> {
  const response = await fetch("/api/systems");
  if (!response.ok) throw new Error("Failed to load systems");
  const data = await response.json();

  return {
    systems: data.systems || [],
    activeSystems: data.activeSystems || [],
    registry: data.registry || [],
    globalComponents: data.globalComponents || [],
    designDebt: data.designDebt || [],
    scores: data.scores || { adoptionScore: 0, readinessScore: 0, debtScore: 0, confidenceScore: 0 }
  };
}
