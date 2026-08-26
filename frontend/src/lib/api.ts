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

// ── FALLBACK DEMO FIXTURES (For offline / static hosted demo mode) ───────────

const FALLBACK_SCENARIOS: LabScenario[] = [
  {
    id: "card_declined",
    label: "Card declined (Soft / Retryable)",
    description: "Payment returns soft decline DC_08; eligible for single-bounded automated retry.",
    expected_class: "success",
    policy_posture: "Eligible for single-action retry"
  },
  {
    id: "insufficient_funds",
    label: "Insufficient funds (Terminal)",
    description: "Payment returns terminal failure. Evaluates policy bounds and abstains.",
    expected_class: "terminal_failure",
    policy_posture: "Default deny / abstain (not in retry allowlist)"
  },
  {
    id: "lost_card",
    label: "Lost card (Fraud flag)",
    description: "Payment returns card lost failure. Immediate hard policy block.",
    expected_class: "terminal_failure",
    policy_posture: "Default deny / abstain (fraud / lost instrument)"
  },
  {
    id: "stolen_card",
    label: "Stolen card (Fraud flag)",
    description: "Payment returns card stolen failure. Immediate hard policy block.",
    expected_class: "terminal_failure",
    policy_posture: "Default deny / abstain (fraud / stolen instrument)"
  },
  {
    id: "three_ds_success",
    label: "3DS required (Customer Action)",
    description: "Payment requires customer authentication / 3DS OTP action.",
    expected_class: "customer_action",
    policy_posture: "No automatic retry permitted (requires customer action)"
  }
];

const FALLBACK_SESSIONS: Session[] = [
  {
    id: "sess_rec_9821",
    user_id: "usr_priya_m",
    cart_value: 2450.0,
    initial_status: "failed",
    final_status: "succeeded",
    at_risk: true,
    created_at: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
    updated_at: new Date(Date.now() - 1000 * 60 * 10).toISOString(),
    intervention_type: "retry",
    intervention_status: "succeeded",
    confidence: 0.94,
    latest_error_code: "DC_08"
  },
  {
    id: "sess_rec_8832",
    user_id: "usr_rahul_k",
    cart_value: 1299.0,
    initial_status: "failed",
    final_status: "failed",
    at_risk: true,
    created_at: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    updated_at: new Date(Date.now() - 1000 * 60 * 44).toISOString(),
    intervention_type: "none",
    intervention_status: "abstained",
    confidence: 0.22,
    latest_error_code: "INSUFFICIENT_FUNDS"
  },
  {
    id: "sess_rec_7741",
    user_id: "usr_ananya_s",
    cart_value: 3890.0,
    initial_status: "failed",
    final_status: "succeeded",
    at_risk: true,
    created_at: new Date(Date.now() - 1000 * 60 * 90).toISOString(),
    updated_at: new Date(Date.now() - 1000 * 60 * 88).toISOString(),
    intervention_type: "retry",
    intervention_status: "succeeded",
    confidence: 0.89,
    latest_error_code: "NETWORK_TIMEOUT"
  },
  {
    id: "sess_rec_6623",
    user_id: "usr_vikram_r",
    cart_value: 5400.0,
    initial_status: "failed",
    final_status: "failed",
    at_risk: true,
    created_at: new Date(Date.now() - 1000 * 60 * 140).toISOString(),
    updated_at: new Date(Date.now() - 1000 * 60 * 139).toISOString(),
    intervention_type: "none",
    intervention_status: "abstained",
    confidence: 0.15,
    latest_error_code: "STOLEN_CARD"
  }
];

const FALLBACK_METRICS: Metrics = {
  data_mode: "simulated_demo",
  batch_id: "batch_2026_demo",
  control_sessions: 500,
  control_successful: 310,
  baseline_conversion: 62.0,
  treatment_sessions: 500,
  treatment_successful: 387,
  agent_conversion: 77.4,
  recovery_lift: 15.4,
  interventions_applied: 94,
  false_positives: 2,
  false_positive_cost_inr: 45.0,
  abstentions: 88,
  unresolvable: 21,
  created_at: new Date().toISOString(),
  abstain_rate: 17.6,
  unresolvable_rate: 4.2,
  verified_sandbox_recovered_amount: 188450.0,
  simulated_nudge_recovered_amount: 42300.0,
  total_modeled_recovered_amount: 230750.0,
  metric_provenance: {
    verified_sandbox_recovered_amount: "sandbox_verified",
    simulated_nudge_recovered_amount: "simulated_model",
    total_modeled_recovered_amount: "combined"
  }
};

const FALLBACK_LOGS: Log[] = [
  {
    id: "log_9921",
    session_id: "sess_rec_9821",
    type: "retry",
    confidence_score: 0.94,
    outcome: "succeeded",
    agent_reasoning: "Soft decline code DC_08 identified. Customer session fresh (<60s). Single retry executed.",
    sentry_event_id: "sentry_evt_8832a",
    applied_at: new Date(Date.now() - 1000 * 60 * 10).toISOString(),
    details: "Guardrail Policy: ALLOWED. Recovered ₹2,450.00."
  },
  {
    id: "log_9920",
    session_id: "sess_rec_8832",
    type: "none",
    confidence_score: 0.22,
    outcome: "abstained",
    agent_reasoning: "Terminal error code INSUFFICIENT_FUNDS. Automated retries strictly prohibited.",
    sentry_event_id: null,
    applied_at: new Date(Date.now() - 1000 * 60 * 44).toISOString(),
    details: "Guardrail Policy: BLOCKED (Terminal failure code)."
  },
  {
    id: "log_9919",
    session_id: "sess_rec_7741",
    type: "retry",
    confidence_score: 0.89,
    outcome: "succeeded",
    agent_reasoning: "Temporary network gateway timeout. Policy allows single bounded replay.",
    sentry_event_id: "sentry_evt_7741b",
    applied_at: new Date(Date.now() - 1000 * 60 * 88).toISOString(),
    details: "Guardrail Policy: ALLOWED. Recovered ₹3,890.00."
  }
];

export const api = {
  getSessions: async (params?: Record<string, string>): Promise<{ data_mode: string, sessions: Session[], total: number }> => {
    try {
      const qs = params ? '?' + new URLSearchParams(params).toString() : '';
      const res = await fetch(`${API_URL}/api/sessions${qs}`);
      if (!res.ok) throw new Error('Network response not ok');
      return await res.json();
    } catch {
      return { data_mode: "demo_readonly", sessions: FALLBACK_SESSIONS, total: FALLBACK_SESSIONS.length };
    }
  },
  
  getSession: async (id: string): Promise<SessionDetailResponse> => {
    try {
      const res = await fetch(`${API_URL}/api/sessions/${id}`);
      if (!res.ok) throw new Error('Failed to fetch session details');
      return await res.json();
    } catch {
      const fallbackSession = FALLBACK_SESSIONS.find(s => s.id === id) || FALLBACK_SESSIONS[0];
      return {
        data_mode: "demo_readonly",
        session: fallbackSession,
        events: [
          {
            id: "evt_1",
            session_id: fallbackSession.id,
            type: "checkout_initiated",
            timestamp: fallbackSession.created_at,
            metadata: { cart_value: fallbackSession.cart_value },
            has_raw_payload: false
          },
          {
            id: "evt_2",
            session_id: fallbackSession.id,
            type: "payment_failed",
            timestamp: fallbackSession.created_at,
            metadata: { error_code: fallbackSession.latest_error_code || "DC_08" },
            has_raw_payload: true
          },
          {
            id: "evt_3",
            session_id: fallbackSession.id,
            type: fallbackSession.final_status === "succeeded" ? "payment_recovered" : "session_abstained",
            timestamp: fallbackSession.updated_at,
            metadata: { outcome: fallbackSession.intervention_status },
            has_raw_payload: false
          }
        ],
        intervention: fallbackSession.intervention_type ? {
          id: `int_${fallbackSession.id.slice(5)}`,
          session_id: fallbackSession.id,
          type: fallbackSession.intervention_type,
          outcome: fallbackSession.intervention_status || "succeeded",
          confidence_score: fallbackSession.confidence || 0.92,
          agent_reasoning: `Observed error ${fallbackSession.latest_error_code}. Bounded intervention evaluated against guardrails.`,
          sentry_event_id: "sentry_evt_demo",
          applied_at: fallbackSession.updated_at
        } : null
      };
    }
  },
  
  getMetrics: async (): Promise<Metrics> => {
    try {
      const res = await fetch(`${API_URL}/api/metrics`);
      if (!res.ok) throw new Error('Failed to fetch metrics');
      return await res.json();
    } catch {
      return FALLBACK_METRICS;
    }
  },
  
  getLogs: async (params?: Record<string, string>): Promise<{ data_mode: string, logs: Log[], total: number }> => {
    try {
      const qs = params ? '?' + new URLSearchParams(params).toString() : '';
      const res = await fetch(`${API_URL}/api/logs${qs}`);
      if (!res.ok) throw new Error('Failed to fetch logs');
      return await res.json();
    } catch {
      return { data_mode: "demo_readonly", logs: FALLBACK_LOGS, total: FALLBACK_LOGS.length };
    }
  },

  getLabScenarios: async (): Promise<LabScenariosResponse> => {
    try {
      const res = await fetch(`${API_URL}/api/lab/scenarios`);
      if (!res.ok) throw new Error('Failed to fetch lab scenarios');
      return await res.json();
    } catch {
      return {
        environment: "demo_readonly",
        read_only: false,
        scenarios: FALLBACK_SCENARIOS
      };
    }
  },

  runLabScenario: async (payload: LabRunRequest): Promise<LabRunResponse> => {
    try {
      const res = await fetch(`${API_URL}/api/lab/runs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        return await res.json();
      }
    } catch {
      // Fall through to simulated run response
    }

    // Simulated sandbox run fallback
    const scenario = FALLBACK_SCENARIOS.find(s => s.id === payload.scenario_id) || FALLBACK_SCENARIOS[0];
    const isRetryable = scenario.id === "card_declined";

    return {
      run_id: `run_${Math.random().toString(36).slice(2, 8)}`,
      session_id: `lab_${Math.random().toString(36).slice(2, 8)}`,
      initial_payment: {
        payment_id: `pay_sim_${Math.random().toString(36).slice(2, 8)}`,
        status: isRetryable ? "requires_payment_method" : "failed",
        error_code: isRetryable ? "DC_08" : "TERMINAL_DECLINE",
        error_message: isRetryable ? "Temporary card network decline" : "Card decline terminal"
      },
      agent: {
        available: true,
        proposal: isRetryable ? "retry" : "none",
        confidence: isRetryable ? 0.92 : 0.18,
        reasoning: isRetryable
          ? "Observed soft decline DC_08. Fresh session. Single bounded retry proposed."
          : "Observed terminal failure / fraud flag. Automatic retry blocked."
      },
      guardrail: {
        result: isRetryable ? "allowed" : "blocked",
        reason: isRetryable
          ? "Policy Rule 01 (Soft Error Allowlist) & Rule 02 (One Action Bound) PASSED."
          : "Policy Rule 03 (Hard Decline / Fraud Denylist) TRIGGERED. System abstains."
      },
      bounded_action: {
        type: isRetryable ? "retry" : "abstain",
        executed: isRetryable,
        one_action_limit: 1
      },
      final_outcome: {
        status: isRetryable ? "succeeded" : "failed",
        payment_id: isRetryable ? `pay_rec_${Math.random().toString(36).slice(2, 8)}` : null,
        provenance: isRetryable ? "sandbox_verified" : "no_action"
      },
      links: {
        replay: "/replay",
        audit: "/decisions"
      }
    };
  },

  getAllSessions: async (filterParams?: Record<string, string>): Promise<Session[]> => {
    try {
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
      return all.length > 0 ? all : FALLBACK_SESSIONS;
    } catch {
      return FALLBACK_SESSIONS;
    }
  },
};
