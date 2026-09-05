const BASE = process.env.NEXT_PUBLIC_API_BASE ?? "http://127.0.0.1:8000";

function extraHeaders(): Record<string, string> {
  const headers: Record<string, string> = {};
  try {
    const xai = sessionStorage.getItem("termpilot.xai.key");
    if (xai) headers["X-XAI-Key"] = xai;
  } catch {
    /* private mode */
  }
  return headers;
}

async function req<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${BASE}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...extraHeaders(),
      ...(init?.headers ?? {}),
    },
  });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `${response.status}`);
  }
  return (await response.json()) as T;
}

export const api = {
  health: () => req<{ status: string; grok: string; mode: string; time: string }>("/health"),
  tower: () => req<TowerResponse>("/tower"),
  reset: () => req<{ status: string }>("/demo/reset", { method: "POST" }),
  command: (text: string, simulateLmsOutage = false) =>
    req<CommandResult>("/command", {
      method: "POST",
      body: JSON.stringify({ text, simulate_lms_outage: simulateLmsOutage }),
    }),
  obligations: () => req<{ items: Obligation[] }>("/obligations"),
  obligation: (id: string) => req<ObligationDetail>(`/obligations/${id}`),
  conflicts: () => req<{ items: ConflictItem[] }>("/conflicts"),
  resolve: (id: string, resolution: string) =>
    req(`/conflicts/${id}/resolve`, {
      method: "POST",
      body: JSON.stringify({ resolution }),
    }),
  sources: () => req<SourcesResponse>("/sources"),
  plans: () => req<{ plan: Plan | null }>("/plans"),
  approvals: () => req<{ items: Approval[] }>("/approvals"),
  approve: (id: string) => req(`/approvals/${id}/approve`, { method: "POST" }),
  reject: (id: string) => req(`/approvals/${id}/reject`, { method: "POST" }),
  apply: (id: string) => req(`/calendar/apply?approval_id=${id}`, { method: "POST" }),
  rollback: (id: string) => req(`/calendar/rollback?approval_id=${id}`, { method: "POST" }),
  calendar: () => req<{ items: CalendarItem[] }>("/calendar"),
  runs: () => req<{ items: AgentRun[] }>("/agent-runs"),
  audit: () => req<{ items: AuditEvent[] }>("/audit-events"),
  graph: () => req<{ nodes: GraphNode[]; edges: GraphEdge[] }>("/graph"),
  impact: () => req<ImpactBundle>("/metrics/impact"),
  monitor: () => req("/monitor/run", { method: "POST" }),
  complete: (id: string) => req(`/obligations/${id}/complete`, { method: "POST" }),
  workspace: () => req<WorkspaceBundle>("/workspace"),
  connect: (id: string) => req(`/connectors/${id}/connect`, { method: "POST" }),
  disconnect: (id: string) => req(`/connectors/${id}/disconnect`, { method: "POST" }),
  connectAll: (ids?: string[]) =>
    req<{ one_click: boolean; count: number; connected: { id: string; connected: boolean }[] }>(
      "/connectors/connect-all",
      { method: "POST", body: JSON.stringify({ ids: ids ?? null }) },
    ),
  oauthStart: (id: string) =>
    req<{
      id: string;
      oauth_ready: boolean;
      production_url: string | null;
      docs_url: string | null;
      authorize_url: string | null;
      setup: string | null;
      env: string[];
    }>(`/connectors/${id}/oauth/start`),
  draftMessage: (to_address: string, subject: string, body: string, channel = "email") =>
    req<{ message_id: string; approval_id: string; sent: boolean }>("/workspace/messages/draft", {
      method: "POST",
      body: JSON.stringify({ to_address, subject, body, channel }),
    }),
  sendMessage: (id: string) => req(`/workspace/messages/${id}/send`, { method: "POST" }),
  organiseNotes: () => req("/workspace/notes/organise", { method: "POST" }),
  runWorkflow: (name: string) => req(`/workspace/workflows/${name}/run`, { method: "POST" }),
  draftConflictEmail: (id: string) => req(`/conflicts/${id}/draft-email`, { method: "POST" }),
  voiceLanguages: () =>
    req<{ mvp: { code: string; display_name: string }[]; claim: string }>("/voicebridge/languages"),
  voiceTurn: (text: string, language = "auto", transcript_confidence = 1, source = "typed") =>
    req("/voicebridge/turn", {
      method: "POST",
      body: JSON.stringify({ text, language, transcript_confidence, source }),
    }),
  voiceTurns: () =>
    req<{
      items: {
        id: string;
        language: string;
        source: string;
        transcript: string;
        display_text: string;
        intent: string;
        audio_retained: boolean;
      }[];
    }>("/voicebridge/turns"),
  deleteVoiceTranscripts: () => req("/voicebridge/transcripts", { method: "DELETE" }),
  worldClock: () =>
    req<{ items: { zone: string; label: string; time: string; date: string }[] }>("/world-clock"),
  fx: (amount: number, base: string, quote: string) =>
    req<{
      base: string;
      quote: string;
      rate: number | null;
      amount: number;
      converted: number | null;
      as_of: string | null;
      source: string;
      stale: boolean;
    }>(`/fx?amount=${amount}&base=${base}&quote=${quote}`),
  me: () =>
    req<{
      user_id: string;
      username?: string;
      display_name: string;
      email?: string;
      timezone: string;
      role: string;
      plan?: string;
    }>("/me"),
  collaborate: () =>
    req<{
      peers: { code: string; name: string; context: string }[];
      items: { id: string; to_name: string; task_title: string; state: string }[];
    }>("/collaborate"),
  invite: (to_code: string, obligation_id: string | null, note: string) =>
    req("/collaborate/invite", {
      method: "POST",
      body: JSON.stringify({ to_code, obligation_id, note }),
    }),
  weather: () =>
    req<{
      place: string;
      source: string;
      days: { date: string; tmax: number; tmin: number; rain: number; code: number; label: string }[];
    }>("/weather"),
  feeds: () => req<FeedsResponse>("/feeds"),
  llmCatalog: () => req<LlmCatalog>("/llm/catalog"),
  llmResolve: (model_id: string) =>
    req<{ ok: boolean; id?: string; label?: string; provider?: string; reason?: string; fallback?: string }>(
      `/llm/resolve?model_id=${encodeURIComponent(model_id)}`,
      { method: "POST" },
    ),
  exportData: (destination: string, target = "") =>
    req<{ destination: string; state: string; row_count?: number; payload_hash?: string; csv?: string; items?: unknown[] }>(
      "/export",
      { method: "POST", body: JSON.stringify({ destination, target }) },
    ),
  cookieBanner: () => req<{ note: string; necessary: string; analytics: string; export: string }>("/privacy/cookies"),
  saveCookies: (body: { analytics: boolean; export: boolean }) =>
    req("/privacy/cookies", { method: "POST", body: JSON.stringify(body) }),
  formatText: (text: string) => req<{ text: string }>("/data/format", { method: "POST", body: JSON.stringify({ text }) }),
  mailbox: () => req<MailboxDesk>("/mailbox"),
  mailboxCleanup: () =>
    req<{ archived: string[]; kept: string[]; counts: { archived_now: number; kept_p0_p1: number }; smtp: boolean }>(
      "/mailbox/cleanup",
      { method: "POST" },
    ),
  mailboxDraft: (id: string) =>
    req<{ message_id: string; approval_id: string; sent: boolean; mail_id: string }>("/mailbox/" + id + "/draft", {
      method: "POST",
    }),
  grokbotTools: () =>
    req<{
      engine: string;
      product: string;
      claim: string;
      writes_without_approval: boolean;
      spoken_yes_writes: boolean;
      tools: { id: string; label: string; view: string; kind: string; writes: boolean }[];
    }>("/grokbot/tools"),
};

export const DEMO_COMMAND =
  "TermPilot, reconcile my academic and recruiting commitments for the next 14 days. Show conflicts, build a realistic plan around my 20-hour weekly limit, and ask before changing my calendar.";

export type TowerResponse = {
  tower: {
    mode: string;
    readiness: string;
    now: string;
    timezone: string;
    horizon_days: number;
    last_reconciliation_at: string | null;
    grok_state: string;
    monitoring_enabled: boolean;
    verified_obligations: number;
    open_conflicts: number;
    pending_approvals: number;
    high_risk_obligations: number;
    plan_feasible: boolean | null;
    plan_risk: string | null;
    source_coverage: Record<string, string>;
    last_sync: Record<string, string | null>;
  };
  attention: AttentionItem[];
};

export type AttentionItem = {
  id: string;
  severity: string;
  kind: string;
  title: string;
  required_decision: string;
  evidence_status: string;
  recommended_action: string;
  object_id: string;
};

export type Obligation = {
  obligation_id: string;
  title: string;
  course_or_context: string;
  type: string;
  due_at: string | null;
  estimated_minutes: number;
  priority: string;
  status: string;
  source_type: string;
  source_reference: string;
  source_observed_at: string;
  source_authority: string;
  confidence: number;
  verification_state: string;
  date_precision: string;
};

export type Claim = {
  id: string;
  value: string;
  source_type: string;
  source_authority: string;
  observed_at: string;
  confidence: number;
  evidence_excerpt: string;
  discarded: boolean;
};

export type ObligationDetail = {
  obligation: Obligation;
  claims: Claim[];
  plan_blocks: PlanBlock[];
};

export type ConflictItem = {
  id: string;
  obligation_id: string;
  title: string;
  field_name: string;
  reason_code: string;
  recommended_action: string;
  resolution: string | null;
  clarification_draft: string | null;
  claim_a: Claim;
  claim_b: Claim;
};

export type SourcesResponse = {
  connections: {
    id: string;
    source_type: string;
    label: string;
    health: string;
    permission_state: string;
    last_success_at: string | null;
    last_error_code: string | null;
    last_error_message: string | null;
    degraded_mode: string | null;
  }[];
  observations: {
    id: string;
    source_type: string;
    source_reference: string;
    source_authority: string;
    observed_at: string;
    excerpt: string;
    injection_flagged: boolean;
  }[];
};

export type PlanBlock = {
  id: string;
  plan_id: string;
  obligation_id: string | null;
  kind: string;
  title: string;
  start_at: string;
  end_at: string;
  state: string;
  reason: string;
};

export type Plan = {
  id: string;
  feasible: boolean;
  risk_level: string;
  explanation: string;
  unscheduled: { obligation_id: string; title: string; reason: string }[];
  violated_soft: string[];
  unsatisfied_hard: string[];
  horizon_start: string;
  horizon_end: string;
  blocks: PlanBlock[];
};

export type Approval = {
  id: string;
  action_type: string;
  target_system: string;
  reason: string;
  diff: {
    create: { id: string; title: string; start_at: string; end_at: string }[];
    message?: { id: string; to: string; subject: string; body: string };
  };
  state: string;
  reversible: boolean;
  expires_at: string;
  applied_at: string | null;
};

export type CalendarItem = {
  id: string;
  title: string;
  start_at: string;
  end_at: string;
  kind: string;
  written_by_termpilot: boolean;
};

export type AgentRun = {
  id: string;
  request_id: string;
  agent: string;
  assignment: string;
  state: string;
  source_inspected: string | null;
  tool_name: string | null;
  output_artifact: string | null;
  handover_to: string | null;
  error_or_uncertainty: string | null;
  duration_ms: number;
  started_at: string;
};

export type AuditEvent = {
  id: string;
  correlation_id: string;
  agent: string | null;
  event_type: string;
  result: string;
  policy_check: string | null;
  approval_state: string | null;
  summary: string;
  created_at: string;
  object_type: string | null;
  object_id: string | null;
};

export type GraphNode = { id: string; kind: string; label: string; state: string };
export type GraphEdge = { from: string; to: string; rel: string };

export type CommandResult = {
  request_id: string;
  delegated_tasks: { bot: string; task: string }[];
  unresolved_uncertainties: string[];
  proposed_actions: { approval_id?: string; state?: string }[];
  approval_state: string;
  final_status: string;
};

export type ImpactBundle = {
  demo: Record<string, unknown>;
  system_test: { disclaimer: string; rows: unknown[] };
  pilot: { disclaimer: string; sessions: unknown[] };
};

export type ConnectorCard = {
  id: string;
  source_type: string;
  label: string;
  kind: string;
  capability: string;
  health: string;
  permission_state: string;
  last_success_at: string | null;
  connected: boolean;
  oauth: string;
  one_click?: boolean;
  auto_reconnect?: boolean;
  oauth_ready?: boolean;
  docs_url?: string | null;
  authorize_url?: string | null;
  production_url?: string | null;
  env?: string[];
  setup?: string | null;
};

export type Meeting = {
  id: string;
  title: string;
  start_at: string;
  end_at: string;
  join_url: string | null;
  provider: string;
};

export type WorkspaceNote = {
  id: string;
  source: string;
  title: string;
  body: string;
  tags: string[];
  organised: boolean;
};

export type WorkspaceMessage = {
  id: string;
  channel: string;
  to: string;
  subject: string;
  state: string;
  approval_id: string | null;
  sent_at: string | null;
};

export type WorkflowSpec = {
  name: string;
  title: string;
  graph: string[];
  description: string;
};

export type WorkspaceBundle = {
  live: boolean;
  now: string;
  connectors: ConnectorCard[];
  meetings: Meeting[];
  calendar: { days: { date: string; label: string; meetings: Meeting[] }[] };
  notes: WorkspaceNote[];
  messages: WorkspaceMessage[];
  workflows: WorkflowSpec[];
  workflow_runs: { id: string; name: string; state: string; graph: { bot: string }[]; result: Record<string, unknown> }[];
};

export type FeedItem = {
  id: string;
  title: string;
  summary: string;
  url: string | null;
  published: string | null;
  channel: string;
  source_label: string;
  source_kind: string;
  stale: boolean;
  priority: string;
  university_gated?: boolean;
  from?: string;
  reminder?: boolean;
};

export type FeedReminder = {
  id: string;
  kind: string;
  title: string;
  due_at: string | null;
  priority: string;
  source_label: string;
  channel: string;
  url?: string | null;
};

export type FeedLink = {
  id: string;
  group: string;
  title: string;
  url: string;
  note: string;
};

export type FeedsResponse = {
  now: string;
  role_note: string;
  crisis_note: string;
  university_authorised: boolean;
  university_lock: string | null;
  university_gate: string;
  stale: boolean;
  pulled: { live_sources: number; sources: { id: string; ok: boolean; kind: string; stale?: boolean }[] };
  items: FeedItem[];
  reminders: FeedReminder[];
  directory: FeedLink[];
  channels: string[];
};

export type ViewId =
  | "chat"
  | "tower"
  | "obligations"
  | "timeline"
  | "conflicts"
  | "sources"
  | "agents"
  | "approvals"
  | "evidence"
  | "impact"
  | "settings"
  | "workspace"
  | "calendar"
  | "workflows"
  | "news"
  | "mailbox"
  | "help";

export type MailItem = {
  id: string;
  from: string;
  to: string;
  subject: string;
  excerpt: string;
  priority: string;
  category: string;
  state: string;
  suggested_action: string;
  observed_at: string;
  archived_at: string | null;
};

export type MailboxDesk = {
  authorised: boolean;
  can_send: boolean;
  student_email: string;
  smtp: boolean;
  note: string;
  hierarchy: { order: string; fn: string; priority: string; note: string }[];
  counts: { inbox: number; archived: number; p0: number; p1: number; p2: number; p3: number };
  alerts: MailItem[];
  clutter: MailItem[];
  items: MailItem[];
};

export type LlmModel = {
  id: string;
  label: string;
  blurb: string;
  provider: string;
  route: string;
  locked: boolean;
  badge?: string;
};

export type LlmCatalog = {
  native: string;
  grok_state: string;
  openrouter: boolean;
  note: string;
  modes: { id: string; label: string; does: string }[];
  tools: { id: string; label: string; locked: boolean; badge?: string; does: string }[];
  models: LlmModel[];
};
