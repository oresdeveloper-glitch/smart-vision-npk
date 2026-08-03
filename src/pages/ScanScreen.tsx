import { useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { useScan, CropType } from '../contexts/ScanContext';
import { runCNNPrediction, processImage, detectCrop, trainCrop } from '../services/mlService';
import { getRecommendation } from '../data/recommendations';
import { validateImage } from '../utils/imageValidation';
import { Button } from '../components/ui/Button';
import {
  Upload, Image, X, Camera, AlertCircle, CheckCircle2,
  ScanLine, Droplets, Wind, AlertTriangle, Sprout,
} from 'lucide-react';

export default function ScanScreen() {
  const { t } = useLanguage();
  const { addScan, setCurrentResult } = useScan();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const [imageData, setImageData] = useState<string | null>(null);
  const [cropType, setCropType] = useState<CropType | null>(null);
  const [detectConfidence, setDetectConfidence] = useState(0);
  const [detecting, setDetecting] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState('');
  const [progress, setProgress] = useState(0);

  const handleFile = useCallback(async (file: File) => {
    setError('');
    setCropType(null);
    const validation = validateImage(file);
    if (!validation.valid) { setError(validation.error || 'Invalid file'); return; }
    setProgress(20);
    const reader = new FileReader();
    reader.onload = async () => {
      const data = reader.result as string;
      setImageData(data);
      setProgress(40);
      const processed = await processImage(data);
      setImageData(processed);
      setProgress(60);
      setDetecting(true);
      try {
        const detection = await detectCrop(processed);
        if (!detection.valid) {
          setError(detection.error || 'This does not look like a crop leaf.');
          setImageData(null);
          setProgress(0);
        } else {
          setCropType(detection.cropType);
          setDetectConfidence(detection.confidence);
          setProgress(80);
        }
      } catch {
        setCropType('maize');
        setDetectConfidence(0);
        setProgress(80);
      } finally {
        setDetecting(false);
      }
    };
    reader.readAsDataURL(file);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const handleAnalyze = async () => {
    if (!imageData || !cropType) return;
    setAnalyzing(true); setError('');
    setProgress(70);
    try {
      const prediction = await runCNNPrediction(imageData, cropType);
      setProgress(90);
      trainCrop(imageData, cropType);
      const rec = getRecommendation(prediction.deficiency, cropType);
      const result = {
        id: 'scan_' + Date.now(),
        imageData,
        cropType,
        deficiency: prediction.deficiency,
        confidence: prediction.confidence,
        severity: prediction.severity,
        riskLevel: prediction.riskLevel,
        timestamp: Date.now(),
        recommendations: rec ? rec.fertilizers.en : [],
        treatmentSteps: rec ? rec.treatmentSteps.en : [],
        preventionMeasures: rec ? rec.preventionMeasures.en : [],
      };
      await new Promise(r => setTimeout(r, 300));
      addScan(result);
      setCurrentResult(result);
      setProgress(100);
      setTimeout(() => navigate('/results'), 400);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Analysis failed');
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-[var(--color-text-primary)]">{t('scanLeaf')}</h1>
        <p className="text-sm text-[var(--color-text-secondary)] mt-1">Upload a leaf image for AI-powered nutrient deficiency analysis</p>
      </div>

      {/* Drop Zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => !imageData && fileInputRef.current?.click()}
        className={`relative rounded-2xl border-2 border-dashed p-8 lg:p-12 text-center cursor-pointer transition-all ${
          dragOver
            ? 'border-green-500 bg-green-50 dark:bg-green-900/10'
            : imageData
              ? 'border-green-300 bg-green-50/50 dark:bg-green-900/5'
              : 'border-[var(--color-border)] hover:border-green-300 hover:bg-[var(--color-surface-hover)]'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
        />
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleFileSelect}
          className="hidden"
        />
        {imageData ? (
          <div className="space-y-4">
            <div className="relative inline-block">
              <img src={imageData} alt="Leaf preview" className="max-h-64 rounded-xl shadow-md mx-auto" />
              <button
                onClick={(e) => { e.stopPropagation(); setImageData(null); setCropType(null); setDetectConfidence(0); setProgress(0); setError(''); }}
                className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-rose-500 text-white flex items-center justify-center shadow-md hover:bg-rose-600 transition-all"
              >
                <X size={14} />
              </button>
            </div>
            <div className="flex items-center justify-center gap-2 text-sm text-green-600 dark:text-green-400 font-medium">
              <CheckCircle2 size={16} />
              Image loaded successfully
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-green-50 dark:bg-green-900/10 flex items-center justify-center mx-auto">
              <Upload size={28} className="text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-base font-semibold text-[var(--color-text-primary)]">
                Drop leaf image here
              </p>
              <p className="text-sm text-[var(--color-text-tertiary)] mt-1">
                or click to browse · Supports JPG, PNG · Max 10MB
              </p>
            </div>
            <div className="flex items-center justify-center gap-4 text-xs">
              <button onClick={(e) => { e.stopPropagation(); cameraInputRef.current?.click(); }} className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-green-500/10 text-green-600 dark:text-green-400 hover:bg-green-500/20 transition-all">
                <Camera size={12} /> Camera
              </button>
              <button onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }} className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 hover:bg-blue-500/20 transition-all">
                <Image size={12} /> Gallery
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Progress bar */}
      {progress > 0 && progress < 100 && !analyzing && (
        <div className="h-1.5 rounded-full bg-[var(--color-border)] overflow-hidden">
          <div className="h-full bg-gradient-to-r from-green-500 to-emerald-400 rounded-full transition-all duration-500 ease-out" style={{ width: `${progress}%` }} />
        </div>
      )}

      {/* Detecting crop */}
      {detecting && (
        <div className="text-center py-4">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-50 dark:bg-green-900/10 border border-green-200/50 dark:border-green-800/20">
            <div className="w-4 h-4 rounded-full border-2 border-green-500 border-t-transparent animate-spin" />
            <span className="text-sm text-green-700 dark:text-green-300 font-medium">Identifying crop type...</span>
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="flex items-start gap-3 p-4 rounded-xl bg-rose-50 dark:bg-rose-900/10 border border-rose-200 dark:border-rose-800/20">
          <AlertCircle size={18} className="text-rose-500 mt-0.5 shrink-0" />
          <p className="text-sm text-rose-700 dark:text-rose-300">{error}</p>
        </div>
      )}

      {/* Crop Detection / Analyze */}
      {imageData && !analyzing && !detecting && cropType && (
        <div className="card-premium p-5 space-y-4">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-green-50/60 dark:bg-green-900/10 border border-green-200/50 dark:border-green-800/20">
            <div className="w-9 h-9 rounded-lg bg-green-500/10 flex items-center justify-center text-green-600 dark:text-green-400">
              <Sprout size={18} />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-[var(--color-text-primary)]">
                {cropType === 'maize' ? 'Maize Detected' : 'Beans Detected'}
              </p>
              <p className="text-[11px] text-[var(--color-text-secondary)]">
                {cropType === 'maize' ? t('maize') : t('beans')} leaf · {detectConfidence.toFixed(0)}% confidence
              </p>
            </div>
          </div>

          <Button
            variant="primary"
            size="lg"
            icon={<ScanLine size={18} />}
            onClick={handleAnalyze}
            className="w-full"
          >
            Analyze Leaf
          </Button>
        </div>
      )}

      {/* Analyzing State */}
      {analyzing && (
        <div className="card-premium p-8 text-center space-y-4">
          <div className="relative w-20 h-20 mx-auto">
            <div className="absolute inset-0 rounded-full border-4 border-green-100 dark:border-green-900/30" />
            <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-green-500 animate-spin" />
            <div className="absolute inset-0 flex items-center justify-center">
              <ScanLine size={24} className="text-green-600 dark:text-green-400" />
            </div>
          </div>
          <div>
            <p className="text-base font-semibold text-[var(--color-text-primary)]">{t('analyzing')}</p>
            <p className="text-sm text-[var(--color-text-tertiary)] mt-1">{t('analyzingDesc')}</p>
          </div>
          <div className="max-w-xs mx-auto space-y-1.5">
            <div className="flex justify-between text-xs text-[var(--color-text-tertiary)]">
              <span>Processing image</span>
              <span>75%</span>
            </div>
            <div className="h-1.5 rounded-full bg-[var(--color-border)] overflow-hidden">
              <div className="h-full bg-gradient-to-r from-green-500 to-emerald-400 rounded-full animate-pulse" style={{ width: '75%' }} />
            </div>
          </div>
        </div>
      )}

      {/* Info cards */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { icon: Droplets, label: 'Nitrogen (N)', color: 'from-rose-500 to-pink-500', bg: 'bg-rose-50 dark:bg-rose-900/10 text-rose-600' },
          { icon: Wind, label: 'Phosphorus (P)', color: 'from-amber-400 to-orange-500', bg: 'bg-amber-50 dark:bg-amber-900/10 text-amber-600' },
          { icon: AlertTriangle, label: 'Potassium (K)', color: 'from-purple-500 to-violet-500', bg: 'bg-purple-50 dark:bg-purple-900/10 text-purple-600' },
        ].map(({ icon: Icon, label, bg }) => (
          <div key={label} className="card-premium p-3 text-center">
            <div className={`w-8 h-8 rounded-lg ${bg} flex items-center justify-center mx-auto mb-2`}>
              <Icon size={16} />
            </div>
            <p className="text-[10px] font-medium text-[var(--color-text-tertiary)]">{label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
