import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { CaseProvider } from "./context/CaseContext";
import { Navbar } from "./components/layout/Navbar";
import { Sidebar } from "./components/layout/Sidebar";

import { LoginPage } from "./pages/LoginPage";
import { CaseDashboardPage } from "./pages/CaseDashboardPage";
import { EvidencePage } from "./pages/EvidencePage";
import { EvidenceDetailPage } from "./pages/EvidenceDetailPage";
import { EntitiesPage } from "./pages/EntitiesPage";
import { GraphPage } from "./pages/GraphPage";
import { TimelinePage } from "./pages/TimelinePage";
import { AiWorkspacePage } from "./pages/AiWorkspacePage";
import { ReviewQueuePage } from "./pages/ReviewQueuePage";
import { AuditPage } from "./pages/AuditPage";
import { CasesPage } from "./pages/CasesPage";
import { LimitationsPage } from "./pages/LimitationsPage";

const queryClient = new QueryClient();

const AuthenticatedLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col antialiased">
      <Navbar />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-y-auto bg-slate-950">{children}</main>
      </div>
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <CaseProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route
                path="/"
                element={
                  <AuthenticatedLayout>
                    <CaseDashboardPage />
                  </AuthenticatedLayout>
                }
              />
              <Route
                path="/cases"
                element={
                  <AuthenticatedLayout>
                    <CasesPage />
                  </AuthenticatedLayout>
                }
              />
              <Route
                path="/evidence"
                element={
                  <AuthenticatedLayout>
                    <EvidencePage />
                  </AuthenticatedLayout>
                }
              />
              <Route
                path="/evidence/:id"
                element={
                  <AuthenticatedLayout>
                    <EvidenceDetailPage />
                  </AuthenticatedLayout>
                }
              />
              <Route
                path="/entities"
                element={
                  <AuthenticatedLayout>
                    <EntitiesPage />
                  </AuthenticatedLayout>
                }
              />
              <Route
                path="/graph"
                element={
                  <AuthenticatedLayout>
                    <GraphPage />
                  </AuthenticatedLayout>
                }
              />
              <Route
                path="/timeline"
                element={
                  <AuthenticatedLayout>
                    <TimelinePage />
                  </AuthenticatedLayout>
                }
              />
              <Route
                path="/analysis"
                element={
                  <AuthenticatedLayout>
                    <AiWorkspacePage />
                  </AuthenticatedLayout>
                }
              />
              <Route
                path="/review"
                element={
                  <AuthenticatedLayout>
                    <ReviewQueuePage />
                  </AuthenticatedLayout>
                }
              />
              <Route
                path="/audit"
                element={
                  <AuthenticatedLayout>
                    <AuditPage />
                  </AuthenticatedLayout>
                }
              />
              <Route
                path="/limitations"
                element={
                  <AuthenticatedLayout>
                    <LimitationsPage />
                  </AuthenticatedLayout>
                }
              />
            </Routes>
          </BrowserRouter>
        </CaseProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;
