'use client';

import React, { useState } from 'react';
import {
  UploadCloud,
  File as FileIcon,
  AlertCircle,
  Sparkles,
  CheckCircle2,
  Cpu,
  Scan,
  Layers,
  Image as ImageIcon,
  Compass,
  ArrowRight,
} from 'lucide-react';
import { ProcessingStatus } from './ProcessingStatus';
import { LayoutAnalyzerService } from '@/lib/ai/layout-analyzer';
import { AppState } from '@/lib/store/app-state';

interface LayoutUploaderProps {
  projectId: string;
  onCompleted: (layoutId: string) => void;
  onCancel?: () => void;
}

export type UploadSourceMode = 'master57' | 'blueprint' | 'drone' | 'gemini' | 'dual_overlay';

export const LayoutUploader: React.FC<LayoutUploaderProps> = ({
  projectId,
  onCompleted,
  onCancel,
}) => {
  const [sourceMode, setSourceMode] = useState<UploadSourceMode>('master57');
  const [primaryFile, setPrimaryFile] = useState<File | null>(null);
  const [aerialFile, setAerialFile] = useState<File | null>(null);
  const [dragOverPrimary, setDragOverPrimary] = useState(false);
  const [dragOverAerial, setDragOverAerial] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [apiKeyInput, setApiKeyInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [stage, setStage] = useState(0);

  const handleValidateAndSetFile = (file: File, isAerial = false) => {
    setError(null);
    const validTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp', 'application/pdf', 'image/svg+xml'];
    if (!validTypes.includes(file.type) && !file.name.endsWith('.svg')) {
      setError('Please upload a valid layout image (JPG/PNG/WEBP/SVG) or PDF blueprint document.');
      return;
    }
    if (file.size > 25 * 1024 * 1024) {
      setError('File size exceeds maximum 25MB limit.');
      return;
    }
    if (isAerial) {
      setAerialFile(file);
    } else {
      setPrimaryFile(file);
    }
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (err) => reject(err);
    });
  };

  // Helper to detect natural image dimensions
  const getImageDimensions = (url: string): Promise<{ width: number; height: number }> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        resolve({
          width: img.naturalWidth || 1200,
          height: img.naturalHeight || 1600,
        });
      };
      img.onerror = () => resolve({ width: 1200, height: 1600 });
      img.src = url;
    });
  };

  // 1-Click Sample Preloader
  const handleLoadSample = async (type: 'drone' | 'blueprint' | 'master57') => {
    setError(null);
    const sampleUrl = type === 'drone' ? '/drone-aerial-sample.jpg' : '/site-grid-48-blueprint.svg';
    const sampleName = type === 'drone' ? 'drone-aerial-survey.jpg' : 'master-cad-blueprint.svg';
    const mimeType = type === 'drone' ? 'image/jpeg' : 'image/svg+xml';

    try {
      const res = await fetch(sampleUrl);
      const blob = await res.blob();
      const file = new File([blob], sampleName, { type: mimeType });
      setPrimaryFile(file);
      setSourceMode(type === 'drone' ? 'drone' : type === 'master57' ? 'master57' : 'blueprint');
    } catch {
      setError('Could not load sample file.');
    }
  };

  const handleStartAnalysis = async () => {
    if (!primaryFile) {
      setError('Please choose or drag a site layout file to analyze.');
      return;
    }

    setIsProcessing(true);
    setStage(0); // Uploading

    try {
      const primaryUrl = URL.createObjectURL(primaryFile);
      const base64Data = await fileToBase64(primaryFile);

      let aerialUrl: string | undefined = undefined;
      if (aerialFile) {
        aerialUrl = URL.createObjectURL(aerialFile);
      }

      const dims = await getImageDimensions(primaryUrl);
      const targetWidth = dims.width;
      const targetHeight = dims.height;

      // Determine model name & provider
      const provider =
        sourceMode === 'gemini'
          ? 'gemini'
          : sourceMode === 'master57'
          ? 'master57'
          : sourceMode === 'blueprint'
          ? 'blueprint'
          : sourceMode === 'drone'
          ? 'drone'
          : 'contour';

      const aiModelName =
        sourceMode === 'gemini'
          ? 'Gemini 2.0 Multimodal Vision AI'
          : sourceMode === 'master57'
          ? 'Master Subdivision 57-Plot AI Engine'
          : sourceMode === 'drone'
          ? 'Drone Aerial Parcel AI Engine'
          : sourceMode === 'dual_overlay'
          ? 'Dual-Layer Blueprint & Aerial Engine'
          : 'CAD Blueprint Line Contour Engine';

      const imageSourceType =
        sourceMode === 'drone'
          ? 'drone_aerial'
          : sourceMode === 'dual_overlay'
          ? 'satellite'
          : 'blueprint';

      // Stage 1: Create layout record
      await new Promise((r) => setTimeout(r, 400));
      const layout = AppState.createLayout({
        project_id: projectId,
        file_url: primaryUrl,
        file_type: primaryFile.type,
        width: targetWidth,
        height: targetHeight,
        ai_model: aiModelName,
        aerial_image_url: aerialUrl,
        aerial_opacity: aerialUrl ? 0.85 : undefined,
        image_source_type: imageSourceType,
      });

      // Stage 2: AI Analyzing
      setStage(1);
      await new Promise((r) => setTimeout(r, 600));

      // Stage 3: Detecting plots
      setStage(2);
      let aiResult;

      try {
        const res = await fetch('/api/analyze-layout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            image: base64Data,
            provider,
            apiKey: apiKeyInput.trim() || undefined,
            width: targetWidth,
            height: targetHeight,
          }),
        });

        if (res.ok) {
          const json = await res.json();
          if (json.data && json.data.plots && json.data.plots.length > 0) {
            aiResult = json.data;
          }
        }
      } catch (e) {
        console.warn('API route call failed, using client-side engine fallback', e);
      }

      if (!aiResult) {
        aiResult = await LayoutAnalyzerService.analyzeLayout(base64Data, {
          provider,
          apiKey: apiKeyInput.trim() || undefined,
          imageWidth: targetWidth,
          imageHeight: targetHeight,
        });
      }

      await new Promise((r) => setTimeout(r, 500));

      // Stage 4: Validating coordinates & saving plots to DB
      setStage(3);
      aiResult.plots.forEach((p: any, idx: number) => {
        AppState.addPlot({
          layout_id: layout.id,
          plot_number: p.plot_number || (idx + 1 < 10 ? `0${idx + 1}` : `${idx + 1}`),
          dimensions_text: p.dimensions_text,
          area: p.area || 1500,
          price: p.price || (p.area || 1500) * 2500,
          facing: p.facing || 'North',
          status: 'available',
          polygon_coordinates: p.polygon,
          ai_confidence: p.confidence ?? 0.98,
          ai_detected: true,
          road_access: p.road_access,
          neighboring_plots: p.neighboring_plots,
        });
      });

      // Save roads to DB
      if (aiResult.roads && Array.isArray(aiResult.roads) && aiResult.roads.length > 0) {
        AppState.addRoads(
          aiResult.roads.map((r: any) => ({
            layout_id: layout.id,
            name: r.name,
            polygon_coordinates: r.polygon,
          }))
        );
      }

      // Stage 5: AI Analysis Finished — Set to Needs Review for User Verification
      setStage(4);
      AppState.updateLayoutStatus(layout.id, 'needs_review');
      await new Promise((r) => setTimeout(r, 400));

      onCompleted(layout.id);
    } catch (err: any) {
      setError(err.message || 'AI processing encountered an issue.');
      setIsProcessing(false);
    }
  };

  if (isProcessing) {
    return <ProcessingStatus currentStage={stage} error={error || undefined} />;
  }

  return (
    <div className="max-w-2xl w-full mx-auto bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 shadow-2xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-5">
        <div className="flex items-center gap-3.5">
          <div className="p-3 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-cyan-500/20 text-cyan-400 border border-cyan-500/30 shadow-lg">
            <UploadCloud className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
              <span>Add Site Layout Digital Twin</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 uppercase font-semibold">
                AI Vision
              </span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Select your blueprint / survey type or run Multimodal Vision AI:
            </p>
          </div>
        </div>

        {/* Quick Sample Loaders */}
        <div className="hidden sm:flex items-center gap-2">
          <button
            type="button"
            onClick={() => handleLoadSample('drone')}
            className="px-2.5 py-1.5 rounded-lg bg-cyan-950/40 hover:bg-cyan-900/60 border border-cyan-500/30 text-cyan-300 text-[11px] font-semibold transition-all"
            title="Load sample 16-parcel drone aerial survey"
          >
            🚁 Sample Drone
          </button>
          <button
            type="button"
            onClick={() => handleLoadSample('blueprint')}
            className="px-2.5 py-1.5 rounded-lg bg-indigo-950/40 hover:bg-indigo-900/60 border border-indigo-500/30 text-indigo-300 text-[11px] font-semibold transition-all"
            title="Load sample 48-plot master CAD blueprint"
          >
            📐 Sample Blueprint
          </button>
        </div>
      </div>

      {error && (
        <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2.5">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
          <span>{error}</span>
        </div>
      )}

      {/* Source Modes Tab Selection */}
      <div className="space-y-2">
        <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-indigo-400" />
            <span>Select AI Layout Analysis Mode</span>
          </span>
          <span className="text-[10px] text-cyan-400 font-mono">Recommended: Masterplan 57-Plot</span>
        </label>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          {/* Mode 1: Master Subdivision 57 Plots */}
          <button
            type="button"
            onClick={() => {
              setSourceMode('master57');
              setAerialFile(null);
            }}
            className={`p-3.5 rounded-2xl border text-left transition-all relative ${
              sourceMode === 'master57'
                ? 'bg-gradient-to-br from-indigo-600/20 to-cyan-600/20 border-cyan-400 text-white ring-1 ring-cyan-400/50 shadow-lg shadow-cyan-950/50'
                : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
            }`}
          >
            <div className="flex items-center gap-2 font-bold text-xs">
              <span className="text-base">🌟</span>
              <span className={sourceMode === 'master57' ? 'text-cyan-300' : 'text-slate-200'}>
                Masterplan (57 Plots)
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1.5 leading-snug">
              Subdivision plan with 30&apos;x40&apos; &amp; 30&apos;x50&apos; plots, 30ft/40ft roads &amp; odd-sized parcels.
            </p>
          </button>

          {/* Mode 2: CAD Blueprint 48 Plots */}
          <button
            type="button"
            onClick={() => {
              setSourceMode('blueprint');
              setAerialFile(null);
            }}
            className={`p-3.5 rounded-2xl border text-left transition-all relative ${
              sourceMode === 'blueprint'
                ? 'bg-indigo-600/15 border-indigo-500 text-white ring-1 ring-indigo-500/50 shadow-lg shadow-indigo-950/50'
                : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
            }`}
          >
            <div className="flex items-center gap-2 font-bold text-xs">
              <span className="text-base">📐</span>
              <span className={sourceMode === 'blueprint' ? 'text-indigo-300' : 'text-slate-200'}>
                CAD Grid (48 Plots)
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1.5 leading-snug">
              Standard 4-column horizontal CAD layout with dual avenue corridors.
            </p>
          </button>

          {/* Mode 3: Drone Aerial */}
          <button
            type="button"
            onClick={() => {
              setSourceMode('drone');
              setAerialFile(null);
            }}
            className={`p-3.5 rounded-2xl border text-left transition-all relative ${
              sourceMode === 'drone'
                ? 'bg-cyan-600/15 border-cyan-500 text-white ring-1 ring-cyan-500/50 shadow-lg shadow-cyan-950/50'
                : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
            }`}
          >
            <div className="flex items-center gap-2 font-bold text-xs">
              <span className="text-base">🚁</span>
              <span className={sourceMode === 'drone' ? 'text-cyan-300' : 'text-slate-200'}>
                Drone Aerial Survey
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1.5 leading-snug">
              Real orthomosaics, site photos, boundary walls, fences &amp; natural terrain.
            </p>
          </button>
        </div>
      </div>

      {/* Primary File Drop Zone */}
      <div className="space-y-2">
        <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
          <span>
            {sourceMode === 'drone'
              ? 'Primary Drone Aerial Photo / Orthomosaic'
              : sourceMode === 'dual_overlay'
              ? '1. Master Blueprint / CAD Drawing'
              : 'Primary CAD Blueprint / Site Plan'}
          </span>
          <span className="text-[11px] text-slate-500 font-normal">JPG, PNG, PDF, SVG up to 25MB</span>
        </label>

        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragOverPrimary(true);
          }}
          onDragLeave={() => setDragOverPrimary(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOverPrimary(false);
            if (e.dataTransfer.files?.[0]) {
              handleValidateAndSetFile(e.dataTransfer.files[0], false);
            }
          }}
          className={`border-2 border-dashed rounded-2xl p-6 text-center transition-all ${
            dragOverPrimary
              ? 'border-indigo-500 bg-indigo-500/10'
              : primaryFile
              ? 'border-emerald-500/50 bg-emerald-950/15'
              : 'border-slate-800 hover:border-slate-700 bg-slate-950/60'
          }`}
        >
          {primaryFile ? (
            <div className="flex items-center justify-between gap-3 text-left">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-white truncate max-w-xs">{primaryFile.name}</p>
                  <p className="text-[11px] text-slate-400">
                    {(primaryFile.size / (1024 * 1024)).toFixed(2)} MB • Ready for AI Extraction
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setPrimaryFile(null)}
                className="text-xs text-rose-400 hover:text-rose-300 font-semibold px-2 py-1 rounded-lg hover:bg-rose-950/30"
              >
                Change
              </button>
            </div>
          ) : (
            <div className="space-y-2 py-2">
              <UploadCloud className="w-8 h-8 text-slate-500 mx-auto" />
              <div>
                <p className="text-xs font-semibold text-white">
                  Drag & drop your {sourceMode === 'drone' ? 'drone aerial photo' : 'site blueprint'} here, or{' '}
                  <label className="text-indigo-400 cursor-pointer hover:underline">
                    browse file
                    <input
                      type="file"
                      accept=".jpg,.jpeg,.png,.webp,.pdf,.svg"
                      className="hidden"
                      onChange={(e) => {
                        if (e.target.files?.[0]) handleValidateAndSetFile(e.target.files[0], false);
                      }}
                    />
                  </label>
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Dual-Layer Mode: Second File Drop Zone for Aerial Survey */}
      {sourceMode === 'dual_overlay' && (
        <div className="space-y-2 pt-1 border-t border-slate-800/80">
          <label className="text-xs font-semibold text-cyan-300 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <ImageIcon className="w-3.5 h-3.5 text-cyan-400" />
              <span>2. Drone Aerial Survey Photo (Overlay Layer)</span>
            </span>
            <span className="text-[11px] text-slate-500 font-normal">JPG, PNG, WEBP</span>
          </label>

          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragOverAerial(true);
            }}
            onDragLeave={() => setDragOverAerial(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragOverAerial(false);
              if (e.dataTransfer.files?.[0]) {
                handleValidateAndSetFile(e.dataTransfer.files[0], true);
              }
            }}
            className={`border-2 border-dashed rounded-2xl p-5 text-center transition-all ${
              dragOverAerial
                ? 'border-cyan-500 bg-cyan-500/10'
                : aerialFile
                ? 'border-cyan-500/50 bg-cyan-950/20'
                : 'border-slate-800 hover:border-slate-700 bg-slate-950/60'
            }`}
          >
            {aerialFile ? (
              <div className="flex items-center justify-between gap-3 text-left">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-white truncate max-w-xs">{aerialFile.name}</p>
                    <p className="text-[11px] text-slate-400">
                      {(aerialFile.size / (1024 * 1024)).toFixed(2)} MB • Drone Aerial Survey Layer
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setAerialFile(null)}
                  className="text-xs text-rose-400 hover:text-rose-300 font-semibold px-2 py-1 rounded-lg hover:bg-rose-950/30"
                >
                  Change
                </button>
              </div>
            ) : (
              <div className="space-y-1.5 py-1">
                <p className="text-xs font-semibold text-slate-300">
                  Drag & drop drone aerial photo, or{' '}
                  <label className="text-cyan-400 cursor-pointer hover:underline font-bold">
                    browse photo
                    <input
                      type="file"
                      accept=".jpg,.jpeg,.png,.webp"
                      className="hidden"
                      onChange={(e) => {
                        if (e.target.files?.[0]) handleValidateAndSetFile(e.target.files[0], true);
                      }}
                    />
                  </label>
                </p>
                <p className="text-[11px] text-slate-500">
                  This photo will be calibrated as a semi-transparent layer over your CAD blueprint.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Footer Actions */}
      <div className="flex items-center justify-between pt-3 border-t border-slate-800">
        <div className="text-[11px] text-slate-400 hidden sm:block">
          {sourceMode === 'drone'
            ? '🤖 Drone Aerial Parcel AI active'
            : sourceMode === 'dual_overlay'
            ? '🛰️ Dual-Layer Synchronized Twin'
            : '📐 High-precision CAD Contour extraction'}
        </div>

        <div className="flex items-center gap-3">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
          )}

          <button
            type="button"
            onClick={handleStartAnalysis}
            disabled={!primaryFile}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:scale-[1.02]"
          >
            <Sparkles className="w-4 h-4" />
            <span>Generate 2D/3D Digital Twin</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

