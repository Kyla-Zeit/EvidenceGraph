import React, { createContext, useContext, useState, useEffect } from "react";
import { InvestigationCaseDto } from "../types";
import { api } from "../api/client";

interface CaseContextType {
  activeCase: InvestigationCaseDto | null;
  setActiveCase: (c: InvestigationCaseDto | null) => void;
  cases: InvestigationCaseDto[];
  refreshCases: () => Promise<InvestigationCaseDto[]>;
  isLoading: boolean;
}

const CaseContext = createContext<CaseContextType | undefined>(undefined);

export const CaseProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cases, setCases] = useState<InvestigationCaseDto[]>([]);
  const [activeCase, setActiveCase] = useState<InvestigationCaseDto | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const refreshCases = async (): Promise<InvestigationCaseDto[]> => {
    setIsLoading(true);
    try {
      const list = await api.getCases();
      setCases(list);
      if (list.length > 0 && !activeCase) {
        // Default to Operation Northstar if available
        const northstar = list.find((c) => c.caseNumber === "EG-2026-0042") || list[0];
        setActiveCase(northstar);
      }
      return list;
    } catch (e) {
      console.error("Failed to load cases", e);
      return [];
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshCases();
  }, []);

  return (
    <CaseContext.Provider value={{ activeCase, setActiveCase, cases, refreshCases, isLoading }}>
      {children}
    </CaseContext.Provider>
  );
};

export const useCase = () => {
  const context = useContext(CaseContext);
  if (!context) throw new Error("useCase must be used within a CaseProvider");
  return context;
};
