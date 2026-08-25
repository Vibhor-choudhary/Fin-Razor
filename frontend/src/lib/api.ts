const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export interface Session {
  id: string;
  user_id: string;
  cart_value: number;
  initial_status: string;
  final_status: string;
  at_risk: boolean;
  created_at: string;
  updated_at: string;
  intervention_type?: string | null;
  intervention_status?: string | null;
  confidence?: number | null;
  latest_error_code?: string | null;
}

export interface Metrics {
  data_mode: string;
  batch_id: string | null;
  control_sessions: number;
  control_successful: number;
  baseline_conversion: number;
  treatment_sessions: number;
  treatment_successful: number;
  agent_conversion: number;
  recovery_lift: number;
  interventions_applied: number;
  false_positives: number;
  false_positive_cost_inr: number;
  abstentions: number;
  unresolvable: number;
  created_at: string | null;
  abstain_rate: number;
  unresolvable_rate: number;
  verified_sandbox_recovered_amount: number;
  simulated_nudge_recovered_amount: number;
  total_modeled_recovered_amount: number;
  metric_provenance: {
    verified_sandbox_recovered_amount: string;
    simulated_nudge_recovered_amount: string;
    total_modeled_recovered_amount: string;
  };
}

export interface Event {
  id: string;
  session_id: string;
  type: string;
  timestamp: string;
  metadata: any;
  has_raw_payload: boolean;
}

export interface Intervention {
  id: string;
  session_id: string;
  type: string;
  outcome: string;
  confidence_score: number;
  agent_reasoning: string | null;
  sentry_event_id: string | null;
  applied_at: string;
}

export interface SessionDetailResponse {
  data_mode: string;
  session: Session;
  events: Event[];
  intervention: Intervention | null;
}

export interface Log {
  id: string;
  session_id: string;
  type: string;
  confidence_score: number;
  outcome: string;
  agent_reasoning: string | null;
  sentry_event_id: string | null;
  applied_at: string;
  details: string;
}

export interface LabScenario {
  id: string;
  label: string;
  description: string;
  expected_class: 'success' | 'terminal_failure' | 'customer_action' | string;
  policy_posture: string;
}

export interface LabScenariosResponse {
  environment: string;
  read_only: boolean;
  scenarios: LabScenario[];
}

export interface LabRunRequest {
  scenario_id: string;
  amount_inr: number;
}

export interface LabRunResponse {
  run_id: string;
  session_id: string;
  initial_payment: {
    payment_id: string;
    status: string;
    error_code: string | null;
    error_message: string | null;
  };
  agent: {
    available: boolean;
    proposal: 'retry' | 'nudge' | 'none' | null;
    confidence: number | null;
    reasoning: string | null;
  };
  guardrail: {
    result: 'allowed' | 'blocked' | 'not_evaluated';
    reason: string;
  };
  bounded_action: {
    type: 'retry' | 'nudge' | 'none' | 'abstain';
    executed: boolean;
    one_action_limit: number;
  };
  final_outcome: {
    status: string;
    payment_id: string | null;
    provenance: 'sandbox_verified' | 'simulated_outcome' | 'no_action';
  };
  links: {
    replay: string;
    audit: string;
  };
}

export const api = {
  getSessions: async (params?: Record<string, string>): Promise<{ data_mode: string, sessions: Session[], total: number }> => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    const res = await fetch(`${API_URL}/api/sessions${qs}`);
    if (!res.ok) throw new Error('Failed to fetch sessions');
    return res.json();
  },
  
  getSession: async (id: string): Promise<SessionDetailResponse> => {
    const res = await fetch(`${API_URL}/api/sessions/${id}`);
    if (!res.ok) throw new Error('Failed to fetch session details');
    return res.json();
  },
  
  getMetrics: async (): Promise<Metrics> => {
    const res = await fetch(`${API_URL}/api/metrics`);
    if (!res.ok) throw new Error('Failed to fetch metrics');
    return res.json();
  },
  
  getLogs: async (params?: Record<string, string>): Promise<{ data_mode: string, logs: Log[], total: number }> => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    const res = await fetch(`${API_URL}/api/logs${qs}`);
    if (!res.ok) throw new Error('Failed to fetch logs');
    return res.json();
  },

  getLabScenarios: async (): Promise<LabScenariosResponse> => {
    const res = await fetch(`${API_URL}/api/lab/scenarios`);
    if (!res.ok) throw new Error('Failed to fetch lab scenarios');
    return res.json();
  },

  runLabScenario: async (payload: LabRunRequest): Promise<LabRunResponse> => {
    const res = await fetch(`${API_URL}/api/lab/runs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Failed to execute lab run' }));
      throw new Error(err.detail || 'Lab execution failed');
    }
    return res.json();
  },

  // Paginates through all sessions since backend caps limit at 100
  getAllSessions: async (filterParams?: Record<string, string>): Promise<Session[]> => {
    const PAGE = 100;
    let offset = 0;
    let all: Session[] = [];
    while (true) {
      const params = { ...filterParams, limit: String(PAGE), offset: String(offset) };
      const qs = '?' + new URLSearchParams(params).toString();
      const res = await fetch(`${API_URL}/api/sessions${qs}`);
      if (!res.ok) break;
      const data = await res.json();
      const page: Session[] = data.sessions ?? [];
      all = all.concat(page);
      if (page.length < PAGE) break;
      offset += PAGE;
    }
    return all;
  },
};

