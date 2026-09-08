import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { CasesPage } from "../pages/CasesPage";
import { InvestigationCaseDto } from "../types";

const mockNavigate = vi.fn();
vi.mock("react-router-dom", () => ({
  useNavigate: () => mockNavigate,
}));

const mockSetActiveCase = vi.fn();
const mockCases: InvestigationCaseDto[] = [
  {
    id: "case-1",
    caseNumber: "EG-2026-0042",
    title: "Operation Northstar",
    description: "Multi-jurisdictional cryptocurrency laundering operation.",
    status: "Active",
    priority: "High",
    classification: "Financial Crime",
    jurisdiction: "Metropolitan Police Cyber Division",
    tags: ["crypto", "laundering"],
    totalEvidenceCount: 50,
    totalEntitiesCount: 15,
    totalRelationshipsCount: 7,
    unresolvedConflictsCount: 1,
    createdAt: "2026-09-01T00:00:00Z",
    updatedAt: "2026-09-01T00:00:00Z",
    openedAt: "2026-09-01T00:00:00Z",
  },
  {
    id: "case-2",
    caseNumber: "EG-2026-0051",
    title: "Operation Glasshouse",
    description: "Corporate espionage investigation.",
    status: "Open",
    priority: "Medium",
    classification: "Cybercrime / Fraud",
    jurisdiction: "Ontario Cybercrime Unit",
    tags: ["espionage"],
    totalEvidenceCount: 0,
    totalEntitiesCount: 0,
    totalRelationshipsCount: 0,
    unresolvedConflictsCount: 0,
    createdAt: "2026-09-02T00:00:00Z",
    updatedAt: "2026-09-02T00:00:00Z",
    openedAt: "2026-09-02T00:00:00Z",
  },
];

vi.mock("../context/CaseContext", () => ({
  useCase: () => ({
    cases: mockCases,
    activeCase: mockCases[0],
    setActiveCase: mockSetActiveCase,
    refreshCases: vi.fn().mockResolvedValue(mockCases),
    isLoading: false,
  }),
}));

describe("CasesPage Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders page header and New Case button", () => {
    render(<CasesPage />);

    expect(screen.getByText("Investigation Case Workspaces")).toBeInTheDocument();
    const newCaseBtn = screen.getByRole("button", { name: /New Case/i });
    expect(newCaseBtn).toBeInTheDocument();
  });

  it("displays cases with exact evidence counts preserving zero counts", () => {
    render(<CasesPage />);

    expect(screen.getByText("EG-2026-0042")).toBeInTheDocument();
    expect(screen.getByText("Operation Northstar")).toBeInTheDocument();
    expect(screen.getByText("50 Evidence Items")).toBeInTheDocument();

    expect(screen.getByText("EG-2026-0051")).toBeInTheDocument();
    expect(screen.getByText("Operation Glasshouse")).toBeInTheDocument();
    // Zero evidence count must display '0 Evidence Items' and NOT a non-zero fallback
    expect(screen.getByText("0 Evidence Items")).toBeInTheDocument();
  });

  it("opens CreateCaseModal when New Case button is clicked", () => {
    render(<CasesPage />);

    const newCaseBtn = screen.getByRole("button", { name: /New Case/i });
    fireEvent.click(newCaseBtn);

    expect(
      screen.getByText("Create New Investigation Case Workspace")
    ).toBeInTheDocument();
  });

  it("navigates when switching or opening workspace", () => {
    render(<CasesPage />);

    const switchBtn = screen.getAllByRole("button", { name: /Open Workspace|Switch Case/i })[0];
    fireEvent.click(switchBtn);

    expect(mockSetActiveCase).toHaveBeenCalledWith(mockCases[0]);
    expect(mockNavigate).toHaveBeenCalledWith("/");
  });
});
