import { createContext, useContext, useState, useCallback, ReactNode, useEffect } from 'react';

export type CropType = 'maize' | 'beans';
export type DeficiencyType = 'nitrogen' | 'phosphorus' | 'potassium' | 'healthy';
export type SeverityLevel = 'low' | 'moderate' | 'severe' | 'critical';

export interface ScanResult {
  id: string;
  imageData: string;
  cropType: CropType;
  deficiency: DeficiencyType;
  confidence: number;
  severity: SeverityLevel;
  riskLevel: string;
  timestamp: number;
  recommendations: string[];
  treatmentSteps: string[];
  preventionMeasures: string[];
}

interface ScanContextType {
  currentResult: ScanResult | null;
  history: ScanResult[];
  isScanning: boolean;
  addScan: (result: ScanResult) => void;
  deleteScan: (id: string) => void;
  clearHistory: () => void;
  getFilteredHistory: (crop?: CropType, deficiency?: DeficiencyType) => ScanResult[];
  setCurrentResult: (result: ScanResult | null) => void;
  setIsScanning: (v: boolean) => void;
  exportHistory: () => string;
}

const ScanContext = createContext<ScanContextType>({
  currentResult: null,
  history: [],
  isScanning: false,
  addScan: () => {},
  deleteScan: () => {},
  clearHistory: () => {},
  getFilteredHistory: () => [],
  setCurrentResult: () => {},
  setIsScanning: () => {},
  exportHistory: () => '',
});

export function ScanProvider({ children }: { children: ReactNode }) {
  const [currentResult, setCurrentResult] = useState<ScanResult | null>(null);
  const [history, setHistory] = useState<ScanResult[]>(() => {
    const saved = localStorage.getItem('npk_history');
    return saved ? JSON.parse(saved) : [];
  });
  const [isScanning, setIsScanning] = useState(false);

  useEffect(() => {
    localStorage.setItem('npk_history', JSON.stringify(history));
  }, [history]);

  const addScan = useCallback((result: ScanResult) => {
    setHistory(prev => [result, ...prev]);
    setCurrentResult(result);
  }, []);

  const deleteScan = useCallback((id: string) => {
    setHistory(prev => prev.filter(s => s.id !== id));
  }, []);

  const clearHistory = useCallback(() => {
    setHistory([]);
  }, []);

  const getFilteredHistory = useCallback((crop?: CropType, deficiency?: DeficiencyType) => {
    return history.filter(s => {
      if (crop && s.cropType !== crop) return false;
      if (deficiency && s.deficiency !== deficiency) return false;
      return true;
    });
  }, [history]);

  const exportHistory = useCallback(() => {
    return JSON.stringify(history, null, 2);
  }, [history]);

  return (
    <ScanContext.Provider value={{
      currentResult, history, isScanning,
      addScan, deleteScan, clearHistory,
      getFilteredHistory, setCurrentResult,
      setIsScanning, exportHistory,
    }}>
      {children}
    </ScanContext.Provider>
  );
}

export function useScan() {
  return useContext(ScanContext);
}
