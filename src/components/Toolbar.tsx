import React from 'react';
import { 
  FolderOpen, 
  Save, 
  Printer, 
  ZoomIn, 
  ZoomOut, 
  RotateCw, 
  Highlighter, 
  Pencil, 
  Type, 
  FileSignature, 
  Stamp, 
  Square, 
  Hand, 
  MousePointer,
  ChevronLeft,
  ChevronRight,
  Eraser
} from 'lucide-react';
import { ToolMode, PdfDocumentState } from '../types/pdf';

interface ToolbarProps {
  docState: PdfDocumentState | null;
  toolMode: ToolMode;
  setToolMode: (mode: ToolMode) => void;
  activeColor: string;
  setActiveColor: (color: string) => void;
  onOpenPdf: () => void;
  onSavePdf: () => void;
  onPrint: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onRotate: () => void;
  onPrevPage: () => void;
  onNextPage: () => void;
}

export const Toolbar: React.FC<ToolbarProps> = ({
  docState,
  toolMode,
  setToolMode,
  activeColor,
  setActiveColor,
  onOpenPdf,
  onSavePdf,
  onPrint,
  onZoomIn,
  onZoomOut,
  onRotate,
  onPrevPage,
  onNextPage,
}) => {
  const colors = ['#facc15', '#4ade80', '#f43f5e', '#60a5fa', '#000000'];

  return (
    <header className="h-14 bg-[#1e1e1e] border-b border-[#333] px-3 flex items-center justify-between shrink-0 select-none">
      {/* Brand & File Actions */}
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-2 mr-3 pr-3 border-r border-[#333]">
          <div className="w-8 h-8 rounded-lg bg-[#ed2224] flex items-center justify-center font-black text-white text-base shadow-md shadow-red-900/30">
            P
          </div>
          <span className="font-bold text-sm tracking-wide text-white hidden sm:inline">
            NextSem <span className="text-red-500 font-extrabold">PDF</span>
          </span>
        </div>

        <button
          onClick={onOpenPdf}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-[#2a2a2a] hover:bg-[#353535] text-slate-200 hover:text-white text-xs font-semibold transition-colors"
          title="Open PDF Document"
        >
          <FolderOpen size={15} />
          <span>Open</span>
        </button>

        <button
          onClick={onSavePdf}
          disabled={!docState}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white text-xs font-semibold transition-colors shadow-sm"
          title="Save Flattened PDF"
        >
          <Save size={15} />
          <span>Save As</span>
        </button>

        <button
          onClick={onPrint}
          disabled={!docState}
          className="p-1.5 rounded hover:bg-[#333] disabled:opacity-40 text-slate-300 hover:text-white transition-colors"
          title="Print Document"
        >
          <Printer size={16} />
        </button>
      </div>

      {/* Annotation & Editing Tools */}
      <div className="flex items-center gap-1 bg-[#252526] p-1 rounded-lg border border-[#333]">
        <button
          onClick={() => setToolMode('select')}
          className={`p-1.5 rounded transition-colors ${toolMode === 'select' ? 'bg-[#37373d] text-white shadow' : 'text-slate-400 hover:text-slate-200'}`}
          title="Select / Move"
        >
          <MousePointer size={16} />
        </button>
        <button
          onClick={() => setToolMode('pan')}
          className={`p-1.5 rounded transition-colors ${toolMode === 'pan' ? 'bg-[#37373d] text-white shadow' : 'text-slate-400 hover:text-slate-200'}`}
          title="Hand Tool (Pan)"
        >
          <Hand size={16} />
        </button>

        <div className="w-[1px] h-5 bg-[#3a3a3a] mx-1" />

        <button
          onClick={() => setToolMode('highlight')}
          className={`p-1.5 rounded transition-colors ${toolMode === 'highlight' ? 'bg-[#37373d] text-yellow-400 shadow' : 'text-slate-400 hover:text-slate-200'}`}
          title="Highlight Text"
        >
          <Highlighter size={16} />
        </button>
        <button
          onClick={() => setToolMode('draw')}
          className={`p-1.5 rounded transition-colors ${toolMode === 'draw' ? 'bg-[#37373d] text-blue-400 shadow' : 'text-slate-400 hover:text-slate-200'}`}
          title="Freehand Pencil / Pen"
        >
          <Pencil size={16} />
        </button>
        <button
          onClick={() => setToolMode('text')}
          className={`p-1.5 rounded transition-colors ${toolMode === 'text' ? 'bg-[#37373d] text-emerald-400 shadow' : 'text-slate-400 hover:text-slate-200'}`}
          title="Add Text"
        >
          <Type size={16} />
        </button>
        <button
          onClick={() => setToolMode('signature')}
          className={`p-1.5 rounded transition-colors ${toolMode === 'signature' ? 'bg-[#37373d] text-purple-400 shadow' : 'text-slate-400 hover:text-slate-200'}`}
          title="Sign Document"
        >
          <FileSignature size={16} />
        </button>
        <button
          onClick={() => setToolMode('stamp')}
          className={`p-1.5 rounded transition-colors ${toolMode === 'stamp' ? 'bg-[#37373d] text-red-400 shadow' : 'text-slate-400 hover:text-slate-200'}`}
          title="Stamps (Approved, Confidential)"
        >
          <Stamp size={16} />
        </button>
        <button
          onClick={() => setToolMode('shape')}
          className={`p-1.5 rounded transition-colors ${toolMode === 'shape' ? 'bg-[#37373d] text-pink-400 shadow' : 'text-slate-400 hover:text-slate-200'}`}
          title="Add Rectangle / Shapes"
        >
          <Square size={16} />
        </button>
        <button
          onClick={() => setToolMode('erase')}
          className={`p-1.5 rounded transition-colors ${toolMode === 'erase' ? 'bg-[#37373d] text-red-400 shadow' : 'text-slate-400 hover:text-slate-200'}`}
          title="Eraser"
        >
          <Eraser size={16} />
        </button>

        {/* Color Palette Selector */}
        <div className="flex items-center gap-1 ml-2 pl-2 border-l border-[#3a3a3a]">
          {colors.map((c) => (
            <button
              key={c}
              onClick={() => setActiveColor(c)}
              className={`w-4 h-4 rounded-full border transition-transform ${activeColor === c ? 'scale-125 border-white ring-2 ring-blue-500/50' : 'border-transparent hover:scale-110'}`}
              style={{ backgroundColor: c }}
            />
          ))}
        </div>
      </div>

      {/* Navigation & Zoom */}
      <div className="flex items-center gap-2">
        {docState && (
          <div className="flex items-center gap-1.5 bg-[#252526] px-2 py-1 rounded text-xs font-mono text-slate-300 border border-[#333]">
            <button 
              onClick={onPrevPage} 
              disabled={docState.currentPage <= 1}
              className="hover:text-white disabled:opacity-30"
            >
              <ChevronLeft size={14} />
            </button>
            <span>{docState.currentPage} / {docState.numPages}</span>
            <button 
              onClick={onNextPage} 
              disabled={docState.currentPage >= docState.numPages}
              className="hover:text-white disabled:opacity-30"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        )}

        <div className="flex items-center gap-1 bg-[#252526] p-1 rounded border border-[#333]">
          <button 
            onClick={onZoomOut} 
            className="p-1 text-slate-300 hover:text-white"
            title="Zoom Out"
          >
            <ZoomOut size={15} />
          </button>
          <span className="text-xs font-mono px-1 min-w-[42px] text-center text-slate-300">
            {docState ? Math.round(docState.zoom * 100) : 100}%
          </span>
          <button 
            onClick={onZoomIn} 
            className="p-1 text-slate-300 hover:text-white"
            title="Zoom In"
          >
            <ZoomIn size={15} />
          </button>
        </div>

        <button
          onClick={onRotate}
          className="p-1.5 rounded bg-[#252526] hover:bg-[#333] text-slate-300 hover:text-white border border-[#333]"
          title="Rotate Clockwise (90°)"
        >
          <RotateCw size={15} />
        </button>
      </div>
    </header>
  );
};
