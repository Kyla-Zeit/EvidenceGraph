import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { App } from "../App";

describe("EvidenceGraph Frontend Core", () => {
  it("renders login screen initially without token", () => {
    localStorage.clear();
    render(<App />);
    expect(screen.getByRole("heading", { name: /EVIDENCE GRAPH/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Sign In to Case Workspace/i })).toBeInTheDocument();
  });
});
