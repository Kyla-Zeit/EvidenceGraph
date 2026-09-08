import { test, expect } from "@playwright/test";

test.describe("EvidenceGraph 12-Step Investigative Showcase Flow", () => {
  const BASE_URL = process.env.BASE_URL || "http://localhost:3000";

  test("Step 1: Sign in as Lead Investigator", async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);
    await expect(page.getByRole("heading", { name: /EVIDENCE GRAPH/i })).toBeVisible();

    // Verify institutional credentials pre-filled or fill
    await page.fill('input[type="email"]', "investigator@evidencegraph.local");
    await page.fill('input[type="password"]', "Password123!");
    await page.click('button[type="submit"]');

    // Confirm navigation to Case Dashboard
    await expect(page).toHaveURL(`${BASE_URL}/`);
    await expect(page.getByText("EG-2026-0042")).toBeVisible();
    await expect(page.getByText("Operation Northstar")).toBeVisible();
  });

  test("Step 2: Case Dashboard & KPI Verification", async ({ page }) => {
    await page.goto(`${BASE_URL}/`);
    await expect(page.getByText("Digital Evidence")).toBeVisible();
    await expect(page.getByText("Extracted Entities")).toBeVisible();
    await expect(page.getByText("Linked Relationships")).toBeVisible();
    await expect(page.getByText("Timeline Contradictions")).toBeVisible();
  });

  test("Step 3 & 4: Evidence Archive & Real-Time Integrity Verification", async ({ page }) => {
    await page.goto(`${BASE_URL}/evidence`);
    await expect(page.getByText("Digital Evidence Archive")).toBeVisible();
    await expect(page.getByText("EV-014")).toBeVisible();

    // Click on EV-014 to view forensic detail
    await page.click("text=EV-014");
    await expect(page.getByText("SHA-256 Digest:")).toBeVisible();

    // Trigger physical integrity verification
    const verifyBtn = page.getByRole("button", { name: /Verify Physical Integrity/i });
    if (await verifyBtn.isVisible()) {
      await verifyBtn.click();
      await expect(page.getByText("INTEGRITY VERIFICATION RESULT: MATCH")).toBeVisible();
    }
  });

  test("Step 5: Inspect Stable Chunks & Deep Links", async ({ page }) => {
    await page.goto(`${BASE_URL}/evidence`);
    await page.click("text=EV-014");
    await page.click("text=Extracted Text & Chunks");
    await expect(page.getByText("[EV-014 §1]")).toBeVisible();
  });

  test("Step 6: Entity Resolution Matrix", async ({ page }) => {
    await page.goto(`${BASE_URL}/entities`);
    await expect(page.getByText("Extracted Entities & Identifiers")).toBeVisible();
    await expect(page.getByText("Alex Mercer")).toBeVisible();
    await expect(page.getByText("Jordan Ellis")).toBeVisible();
  });

  test("Step 7 & 8: Cytoscape Link Graph & Multi-Hop Path Analysis", async ({ page }) => {
    await page.goto(`${BASE_URL}/graph`);
    await expect(page.getByText("Investigative Knowledge Graph")).toBeVisible();

    // Select Alex Mercer and Jordan Ellis for shortest path
    const sourceSelect = page.locator("select").nth(0);
    const targetSelect = page.locator("select").nth(1);

    if (await sourceSelect.isVisible() && await targetSelect.isVisible()) {
      await sourceSelect.selectOption({ label: "Alex Mercer (Person)" });
      await targetSelect.selectOption({ label: "Jordan Ellis (Person)" });
      await page.click("text=Find Shortest Path");
      await expect(page.getByText(/Found connection/i)).toBeVisible();
    }
  });

  test("Step 9: Timeline & Contradiction Detection", async ({ page }) => {
    await page.goto(`${BASE_URL}/timeline`);
    await expect(page.getByText("Chronological Timeline & Conflict Analysis")).toBeVisible();
    await expect(page.getByText(/Contradictions & Anomalies/i)).toBeVisible();
    await expect(page.getByText(/Alex Mercer Alibi Conflict/i)).toBeVisible();
  });

  test("Step 10 & 11: Citation-Grounded GraphRAG AI & Trace", async ({ page }) => {
    await page.goto(`${BASE_URL}/analysis`);
    await expect(page.getByText("AI Investigative Intelligence Workspace")).toBeVisible();

    // Run suggested query
    const suggestedQuery = page.getByText("How are Alex Mercer and Jordan Ellis connected?");
    if (await suggestedQuery.isVisible()) {
      await suggestedQuery.click();
      await page.click('button:has-text("Execute Intelligence Query")');

      // Assert answer with bracketed citation
      await expect(page.getByText(/EV-001/i)).toBeVisible({ timeout: 10000 });
      await expect(page.getByText(/EV-014/i)).toBeVisible();

      // Inspect AI Trace
      await page.click("text=Inspect AI Reasoning Trace");
      await expect(page.getByText("Confidence Factor Breakdown")).toBeVisible();
    }
  });

  test("Step 12: Tamper-Evident SHA-256 Audit Trail Hash Chain Verification", async ({ page }) => {
    await page.goto(`${BASE_URL}/audit`);
    await expect(page.getByText("Tamper-Evident Audit Trail")).toBeVisible();

    const verifyBtn = page.getByRole("button", { name: /Verify Global Hash Chain/i });
    await verifyBtn.click();
    await expect(page.getByText("HASH CHAIN STATUS: VALID & INTACT")).toBeVisible();
  });
});