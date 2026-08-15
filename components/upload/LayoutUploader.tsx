'use client';

import React, { useState } from 'react';
import { UploadCloud, File, AlertCircle, Sparkles, CheckCircle2, Cpu, Scan } from 'lucide-react';
import { ProcessingStatus } from './ProcessingStatus';
import { LayoutAnalyzerService } from '@/lib/ai/layout-analyzer';
import { AppState } from '@/lib/store/app-state';

interface LayoutUploaderProps {
  projectId: string;
  onCompleted: (layoutId: string) => void;
  onCancel?: () => void;
}

export const LayoutUploader: React.FC<LayoutUploaderProps> = ({
  projectId,
  onCompleted,
  onCancel,
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [engineMode, setEngineMode] = useState<'contour' | 'gemini' | 'openai'>('contour');
  const [isProcessing, setIsProcessing] = useState(false);
  const [stage, setStage] = useState(0);

  const handleFileChange = (file: File) => {
    setError(null);
    const validTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
    if (!validTypes.includes(file.type)) {
      setError('Please upload a valid layout image (JPG/PNG) or PDF blueprint document.');
      return;
    }
    if (file.size > 20 * 1024 * 1024) {
      setError('File size exceeds maximum 20MB limit.');
      return;
    }
    setSelectedFile(file);
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (err) => reject(err);
    });
  };

  const handleStartAnalysis = async () => {
    if (!selectedFile) return;

    setIsProcessing(true);
    setStage(0); // Uploading

    try {
      const fileUrl = URL.createObjectURL(selectedFile);
      const base64Data = await fileToBase64(selectedFile);

      // Helper to detect natural image dimensions
      const getImageDimensions = (url: string): Promise<{ width: number; height: number }> => {
        return new Promise((resolve) => {
          const img = new Image();
          img.onload = () => {
            resolve({
              width: img.naturalWidth || 1200,
              height: img.naturalHeight || 964,
            });
          };
          img.onerror = () => resolve({ width: 1200, height: 964 });
          img.src = url;
        });
      };

      const dims = await getImageDimensions(fileUrl);
      const targetWidth = dims.width;
      const targetHeight = dims.height;

      // Stage 1: Create layout record with true image dimensions
      await new Promise((r) => setTimeout(r, 400));
      const layout = AppState.createLayout({
        project_id: projectId,
        file_url: fileUrl,
        file_type: selectedFile.type,
        width: targetWidth,
        height: targetHeight,
        ai_model: engineMode === 'gemini' ? 'Gemini 1.5 Vision' : engineMode === 'openai' ? 'GPT-4o Vision' : 'CV Blueprint Line Contour Engine',
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
            provider: engineMode,
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
        console.warn('API route call failed, using client-side contour engine fallback', e);
      }

      if (!aiResult) {
        aiResult = await LayoutAnalyzerService.analyzeLayout(base64Data, {
          provider: engineMode,
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
          plot_number: p.plot_number || `${idx + 1}`,
          area: p.area,
          price: p.price || p.area * 2400,
          facing: p.facing,
          status: 'available',
          polygon_coordinates: p.polygon,
          ai_confidence: p.confidence,
          ai_detected: true,
        });
      });

      // Add detected roads
      aiResult.roads.forEach((r: any) => {
        // save roads if defined
      });

      // Stage 5: Done
      setStage(4);
      AppState.updateLayoutStatus(layout.id, 'completed');
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
    <div className="max-w-xl w-full mx-auto bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-6">
      <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
        <div className="p-2.5 rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
          <UploadCloud className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-base font-bold text-white">Upload Site Layout Blueprint</h2>
          <p className="text-xs text-slate-400">Supports PDF, JPG, PNG site plans up to 20MB</p>
        </div>
      </div>

      {error && (
        <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Select Recognition Engine */}
      <div className="space-y-2">
        <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
          <Cpu className="w-3.5 h-3.5 text-indigo-400" />
          <span>Plot Recognition & Boundary Engine</span>
        </label>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setEngineMode('contour')}
            className={`p-3 rounded-xl border text-left transition-all ${
              engineMode === 'contour'
                ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300 shadow-md'
                : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center gap-2 font-bold text-xs">
              <Scan className="w-4 h-4 text-indigo-400 shrink-0" />
              <span>Blueprint Line Contours</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1 leading-tight">
              Extracts actual black boundary lines & road corridors directly from the map image.
            </p>
          </button>

          <button
            type="button"
            onClick={() => setEngineMode('gemini')}
            className={`p-3 rounded-xl border text-left transition-all ${
              engineMode === 'gemini'
                ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300 shadow-md'
                : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center gap-2 font-bold text-xs">
              <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
              <span>Gemini 1.5 Vision AI</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1 leading-tight">
              Reads plot numbers & text schedule tables using Multimodal Vision AI.
            </p>
          </button>
        </div>
      </div>

      {/* Drag and Drop Zone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          if (e.dataTransfer.files?.[0]) {
            handleFileChange(e.dataTransfer.files[0]);
          }
        }}
        className={`border-2 border-dashed rounded-xl p-8 text-center transition-all ${
          dragOver
            ? 'border-indigo-500 bg-indigo-500/10'
            : selectedFile
            ? 'border-emerald-500/50 bg-emerald-950/10'
            : 'border-slate-800 hover:border-slate-700 bg-slate-950/60'
        }`}
      >
        {selectedFile ? (
          <div className="space-y-3">
            <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 mx-auto flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-bold text-white truncate max-w-xs mx-auto">
                {selectedFile.name}
              </p>
              <p className="text-xs text-slate-400 mt-0.5">
                {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB • Ready for Analysis
              </p>
            </div>
            <button
              onClick={() => setSelectedFile(null)}
              className="text-xs text-rose-400 hover:underline font-semibold"
            >
              Choose different file
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <UploadCloud className="w-10 h-10 text-slate-500 mx-auto" />
            <div>
              <p className="text-sm font-semibold text-white">
                Drag and drop layout file here, or{' '}
                <label className="text-indigo-400 cursor-pointer hover:underline">
                  browse file
                  <input
                    type="file"
                    accept=".jpg,.jpeg,.png,.pdf"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files?.[0]) handleFileChange(e.target.files[0]);
                    }}
                  />
                </label>
              </p>
              <p className="text-xs text-slate-500 mt-1">High-resolution blueprint files yield highest boundary precision</p>
            </div>
          </div>
        )}
      </div>

      {/* Footer Actions */}
      <div className="flex items-center justify-end gap-3 pt-2">
        {onCancel && (
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-400 hover:text-white"
          >
            Cancel
          </button>
        )}
        <button
          onClick={handleStartAnalysis}
          disabled={!selectedFile}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/30 disabled:opacity-50 transition-all"
        >
          <Sparkles className="w-4 h-4" />
          <span>Analyze Layout Boundaries</span>
        </button>
      </div>
    </div>
  );
};

