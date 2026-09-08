import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { CreateCaseModal } from "../components/cases/CreateCaseModal";
import { api } from "../api/client";
import { InvestigationCaseDto } from "../types";

// Mock the API client
vi.mock("../api/client", () => ({
  api: {
    createCase: vi.fn(),
    getCases: vi.fn(),
  },
}));

// Mock react-router-dom
const mockNavigate = vi.fn();
vi.mock("react-router-dom", () => ({
  useNavigate: () => mockNavigate,
}));

// Mock CaseContext
const mockRefreshCases = vi.fn();
const mockSetActiveCase = vi.fn();

vi.mock("../context/CaseContext", () => ({
  useCase: () => ({
    cases: [],
    activeCase: null,
    setActiveCase: mockSetActiveCase,
    refreshCases: mockRefreshCases,
    isLoading: false,
  }),
}));

const mockCreatedCaseDto: InvestigationCaseDto = {
  id: "case-uuid-1234",
  caseNumber: "EG-2026-TEST02",
  title: "Operation Lighthouse",
  description:
    "Synthetic investigation created to validate EvidenceGraph case creation, case isolation, persistence, and audit behavior.",
  status: "Open",
  priority: "Medium",
  classification: "Cybercrime / Fraud",
  jurisdiction: "Ontario Cybercrime Unit",
  tags: ["test", "case-creation", "cybercrime"],
  totalEvidenceCount: 0,
  totalEntitiesCount: 0,
  totalRelationshipsCount: 0,
  unresolvedConflictsCount: 0,
  createdAt: "2026-09-08T00:00:00Z",
  updatedAt: "2026-09-08T00:00:00Z",
  openedAt: "2026-09-08T00:00:00Z",
};

describe("CreateCaseModal Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRefreshCases.mockResolvedValue([]);
  });

  it("does not render when isOpen is false", () => {
    const { container } = render(
      <CreateCaseModal isOpen={false} onClose={vi.fn()} />
    );
    expect(container.firstChild).toBeNull();
  });

  it("renders properly when isOpen is true", () => {
    render(<CreateCaseModal isOpen={true} onClose={vi.fn()} />);

    expect(
      screen.getByText("Create New Investigation Case Workspace")
    ).toBeInTheDocument();
    expect(screen.getByPlaceholderText("EG-2026-0051")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Operation Glasshouse")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /create case/i })
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /cancel/i })).toBeInTheDocument();
  });

  it("calls onClose when Cancel button is clicked", () => {
    const handleClose = vi.fn();
    render(<CreateCaseModal isOpen={true} onClose={handleClose} />);

    fireEvent.click(screen.getByRole("button", { name: /cancel/i }));
    expect(handleClose).toHaveBeenCalledTimes(1);
    expect(api.createCase).not.toHaveBeenCalled();
  });

  it("validates required fields and shows error when blank", async () => {
    render(<CreateCaseModal isOpen={true} onClose={vi.fn()} />);

    // Click submit with empty form
    fireEvent.click(screen.getByRole("button", { name: /create case/i }));

    // Should show error for missing Case Number
    expect(await screen.findByText(/Case Number is required/i)).toBeInTheDocument();
    expect(api.createCase).not.toHaveBeenCalled();
  });

  it("renders tag preview chips as user types comma-separated tags", () => {
    render(<CreateCaseModal isOpen={true} onClose={vi.fn()} />);

    const tagsInput = screen.getByPlaceholderText("test, case-creation, cybercrime");
    fireEvent.change(tagsInput, {
      target: { value: "test, case-creation, cybercrime" },
    });

    expect(screen.getByText("#test")).toBeInTheDocument();
    expect(screen.getByText("#case-creation")).toBeInTheDocument();
    expect(screen.getByText("#cybercrime")).toBeInTheDocument();
  });

  it("submits the exact payload matching requirements and updates case list", async () => {
    vi.mocked(api.createCase).mockResolvedValueOnce(mockCreatedCaseDto);
    const handleCaseCreated = vi.fn();

    render(
      <CreateCaseModal
        isOpen={true}
        onClose={vi.fn()}
        onCaseCreated={handleCaseCreated}
      />
    );

    // Fill in Case Number
    fireEvent.change(screen.getByPlaceholderText("EG-2026-0051"), {
      target: { value: "  EG-2026-TEST02  " },
    });

    // Fill in Title
    fireEvent.change(screen.getByPlaceholderText("Operation Glasshouse"), {
      target: { value: "  Operation Lighthouse  " },
    });

    // Fill in Description
    fireEvent.change(
      screen.getByPlaceholderText(
        "Brief summary of investigative scope, suspected entities, target objectives..."
      ),
      {
        target: {
          value:
            "Synthetic investigation created to validate EvidenceGraph case creation, case isolation, persistence, and audit behavior.",
        },
      }
    );

    // Fill in Jurisdiction
    fireEvent.change(
      screen.getByPlaceholderText("Ontario Cybercrime Unit"),
      {
        target: { value: "  Ontario Cybercrime Unit  " },
      }
    );

    // Fill in Tags
    fireEvent.change(
      screen.getByPlaceholderText("test, case-creation, cybercrime"),
      {
        target: { value: "test, case-creation, cybercrime, " },
      }
    );

    // Submit form
    fireEvent.click(screen.getByRole("button", { name: /create case/i }));

    await waitFor(() => {
      expect(api.createCase).toHaveBeenCalledWith({
        caseNumber: "EG-2026-TEST02",
        title: "Operation Lighthouse",
        description:
          "Synthetic investigation created to validate EvidenceGraph case creation, case isolation, persistence, and audit behavior.",
        priority: "Medium",
        classification: "Cybercrime / Fraud",
        jurisdiction: "Ontario Cybercrime Unit",
        tags: ["test", "case-creation", "cybercrime"],
      });
    });

    expect(mockRefreshCases).toHaveBeenCalledTimes(1);
    expect(handleCaseCreated).toHaveBeenCalledWith(mockCreatedCaseDto);

    // Verify success view
    expect(
      await screen.findByText(/Case Created Successfully/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/0 Evidence Items/i)
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Open Case/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Stay on All Cases/i })
    ).toBeInTheDocument();
  });

  it("handles 'Open Case' button in success view", async () => {
    vi.mocked(api.createCase).mockResolvedValueOnce(mockCreatedCaseDto);
    const handleClose = vi.fn();

    render(<CreateCaseModal isOpen={true} onClose={handleClose} />);

    // Fill required fields
    fireEvent.change(screen.getByPlaceholderText("EG-2026-0051"), {
      target: { value: "EG-2026-TEST02" },
    });
    fireEvent.change(screen.getByPlaceholderText("Operation Glasshouse"), {
      target: { value: "Operation Lighthouse" },
    });
    fireEvent.change(
      screen.getByPlaceholderText(
        "Brief summary of investigative scope, suspected entities, target objectives..."
      ),
      { target: { value: "Valid description" } }
    );
    fireEvent.change(
      screen.getByPlaceholderText("Ontario Cybercrime Unit"),
      { target: { value: "Ontario Cybercrime Unit" } }
    );

    fireEvent.click(screen.getByRole("button", { name: /create case/i }));

    const openCaseBtn = await screen.findByRole("button", { name: /Open Case/i });
    fireEvent.click(openCaseBtn);

    expect(mockSetActiveCase).toHaveBeenCalledWith(mockCreatedCaseDto);
    expect(handleClose).toHaveBeenCalled();
    expect(mockNavigate).toHaveBeenCalledWith("/");
  });

  it("displays API error message when API call fails", async () => {
    vi.mocked(api.createCase).mockRejectedValueOnce(
      new Error("Case number EG-2026-TEST02 is already in use.")
    );

    render(<CreateCaseModal isOpen={true} onClose={vi.fn()} />);

    // Fill required fields
    fireEvent.change(screen.getByPlaceholderText("EG-2026-0051"), {
      target: { value: "EG-2026-TEST02" },
    });
    fireEvent.change(screen.getByPlaceholderText("Operation Glasshouse"), {
      target: { value: "Operation Lighthouse" },
    });
    fireEvent.change(
      screen.getByPlaceholderText(
        "Brief summary of investigative scope, suspected entities, target objectives..."
      ),
      { target: { value: "Valid description" } }
    );
    fireEvent.change(
      screen.getByPlaceholderText("Ontario Cybercrime Unit"),
      { target: { value: "Ontario Cybercrime Unit" } }
    );

    fireEvent.click(screen.getByRole("button", { name: /create case/i }));

    expect(
      await screen.findByText("Case number EG-2026-TEST02 is already in use.")
    ).toBeInTheDocument();
  });

  it("shows custom classification input when 'Other' is selected", async () => {
    vi.mocked(api.createCase).mockResolvedValueOnce(mockCreatedCaseDto);

    render(<CreateCaseModal isOpen={true} onClose={vi.fn()} />);

    // Select 'Other' classification
    fireEvent.change(screen.getByDisplayValue("Cybercrime / Fraud"), {
      target: { value: "Other" },
    });

    const customInput = screen.getByPlaceholderText("e.g. Counter-Espionage / Maritime Security");
    expect(customInput).toBeInTheDocument();

    // Fill required fields
    fireEvent.change(screen.getByPlaceholderText("EG-2026-0051"), {
      target: { value: "EG-2026-TEST02" },
    });
    fireEvent.change(screen.getByPlaceholderText("Operation Glasshouse"), {
      target: { value: "Operation Lighthouse" },
    });
    fireEvent.change(
      screen.getByPlaceholderText(
        "Brief summary of investigative scope, suspected entities, target objectives..."
      ),
      { target: { value: "Valid description" } }
    );
    fireEvent.change(
      screen.getByPlaceholderText("Ontario Cybercrime Unit"),
      { target: { value: "Ontario Cybercrime Unit" } }
    );
    fireEvent.change(customInput, {
      target: { value: "Counter-Espionage" },
    });

    fireEvent.click(screen.getByRole("button", { name: /create case/i }));

    await waitFor(() => {
      expect(api.createCase).toHaveBeenCalledWith(
        expect.objectContaining({
          classification: "Counter-Espionage",
        })
      );
    });
  });

  it("closes modal on X button and Escape key press", () => {
    const handleClose = vi.fn();
    const { unmount } = render(<CreateCaseModal isOpen={true} onClose={handleClose} />);

    // Click X button
    fireEvent.click(screen.getByLabelText("Close modal"));
    expect(handleClose).toHaveBeenCalledTimes(1);

    // Press Escape
    fireEvent.keyDown(window, { key: "Escape" });
    expect(handleClose).toHaveBeenCalledTimes(2);

    unmount();
  });
});
