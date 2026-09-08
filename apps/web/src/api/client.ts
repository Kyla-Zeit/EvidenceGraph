import {
  UserDto,
  AuthResponse,
  InvestigationCaseDto,
  CreateCaseRequest,
  EvidenceItemDto,
  EvidenceChunkDto,
  EntityDto,
  EntityMentionDto,
  RelationshipDto,
  InvestigativeEventDto,
  ContradictionCandidateDto,
  AuditEventDto,
  AuditVerificationResultDto,
  IntegrityVerificationResultDto,
  AiAnalysisRunDto,
  GraphDataDto
} from "../types";

const API_BASE = "/api/v1";

function getAuthHeader(): HeadersInit {
  const token = localStorage.getItem("evidencegraph_token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function request<T>(url: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeader(),
      ...options.headers,
    },
  });

  if (!res.ok) {
    let errorMsg = `HTTP Error ${res.status}`;
    try {
      const data = await res.json();
      if (data.message) errorMsg = data.message;
      else if (data.title) errorMsg = data.title;
    } catch {
      // fallback
    }
    throw new Error(errorMsg);
  }

  return res.json();
}

export const api = {
  // Auth
  login: (email: string, password: string) =>
    request<AuthResponse>(`${API_BASE}/auth/login`, {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),
  getMe: () => request<UserDto>(`${API_BASE}/auth/me`),

  // Cases
  getCases: () => request<InvestigationCaseDto[]>(`${API_BASE}/cases`),
  getCase: (id: string) => request<InvestigationCaseDto>(`${API_BASE}/cases/${id}`),
  createCase: (data: CreateCaseRequest) =>
    request<InvestigationCaseDto>(`${API_BASE}/cases`, {
      method: "POST",
      body: JSON.stringify(data),
    }),

  // Evidence
  getEvidenceList: (caseId: string) =>
    request<EvidenceItemDto[]>(`${API_BASE}/cases/${caseId}/evidence`),
  getEvidence: (caseId: string, id: string) =>
    request<EvidenceItemDto>(`${API_BASE}/cases/${caseId}/evidence/${id}`),
  verifyEvidenceIntegrity: (caseId: string, id: string) =>
    request<IntegrityVerificationResultDto>(
      `${API_BASE}/cases/${caseId}/evidence/${id}/verify-integrity`,
      { method: "POST" }
    ),
  getEvidenceChunks: (caseId: string, id: string) =>
    request<EvidenceChunkDto[]>(`${API_BASE}/cases/${caseId}/evidence/${id}/chunks`),

  // Entities
  getEntities: (caseId: string, type?: string, status?: string) => {
    const params = new URLSearchParams();
    if (type) params.append("type", type);
    if (status) params.append("status", status);
    return request<EntityDto[]>(`${API_BASE}/cases/${caseId}/entities?${params.toString()}`);
  },
  getEntity: (caseId: string, id: string) =>
    request<EntityDto>(`${API_BASE}/cases/${caseId}/entities/${id}`),
  confirmEntity: (caseId: string, id: string) =>
    request<{ message: string; entityId: string }>(
      `${API_BASE}/cases/${caseId}/entities/${id}/confirm`,
      { method: "POST" }
    ),
  rejectEntity: (caseId: string, id: string) =>
    request<{ message: string; entityId: string }>(
      `${API_BASE}/cases/${caseId}/entities/${id}/reject`,
      { method: "POST" }
    ),
  getEntityMentions: (caseId: string, id: string) =>
    request<EntityMentionDto[]>(`${API_BASE}/cases/${caseId}/entities/${id}/mentions`),

  // Relationships
  getRelationships: (caseId: string) =>
    request<RelationshipDto[]>(`${API_BASE}/cases/${caseId}/relationships`),
  confirmRelationship: (caseId: string, id: string) =>
    request<{ message: string; id: string }>(
      `${API_BASE}/cases/${caseId}/relationships/${id}/confirm`,
      { method: "POST" }
    ),

  // Graph
  getGraph: (caseId: string) => request<GraphDataDto>(`${API_BASE}/cases/${caseId}/graph`),
  rebuildGraph: (caseId: string) =>
    request<{ success: boolean; nodesProjected: number; relationshipsProjected: number; message: string }>(
      `${API_BASE}/cases/${caseId}/graph/rebuild`,
      { method: "POST" }
    ),
  findConnection: (caseId: string, source: string, target: string, maxDepth = 5) =>
    request<{ found: boolean; nodePath: string[]; edgePath: any[]; pathLength: number }>(
      `${API_BASE}/cases/${caseId}/graph/path?source=${source}&target=${target}&maxDepth=${maxDepth}`
    ),
  getGraphAnalytics: (caseId: string) =>
    request<any>(`${API_BASE}/cases/${caseId}/graph/analytics`),

  // Timeline
  getEvents: (caseId: string) =>
    request<InvestigativeEventDto[]>(`${API_BASE}/cases/${caseId}/timeline/events`),
  getContradictions: (caseId: string) =>
    request<ContradictionCandidateDto[]>(`${API_BASE}/cases/${caseId}/timeline/contradictions`),

  // AI Analysis
  runAiQuery: (caseId: string, question: string, provider?: string) =>
    request<AiAnalysisRunDto>(`${API_BASE}/cases/${caseId}/analysis/query`, {
      method: "POST",
      body: JSON.stringify({ question, provider }),
    }),
  getAiRuns: (caseId: string) =>
    request<AiAnalysisRunDto[]>(`${API_BASE}/cases/${caseId}/analysis/runs`),

  // Audit
  getAuditEvents: (caseId?: string, take = 100) => {
    const url = caseId
      ? `${API_BASE}/audit/events?caseId=${caseId}&take=${take}`
      : `${API_BASE}/audit/events?take=${take}`;
    return request<AuditEventDto[]>(url);
  },
  verifyGlobalAuditChain: () =>
    request<AuditVerificationResultDto>(`${API_BASE}/audit/verify`),
  verifyCaseAuditChain: (caseId: string) =>
    request<AuditVerificationResultDto>(`${API_BASE}/audit/cases/${caseId}/verify`),
};
