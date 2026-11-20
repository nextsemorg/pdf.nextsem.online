import React from 'react';
import { 
  FilePlus, 
  Scissors, 
  Minimize2, 
  FileEdit, 
  FileText, 
  Image, 
  RotateCw, 
  ShieldCheck, 
  KeyRound, 
  Stamp, 
  Layers, 
  Sparkles,
  ArrowRight,
  Eye
} from 'lucide-react';

export type ToolType = 
  | 'editor'
  | 'merge' 
  | 'split' 
  | 'compress' 
  | 'pdfToImg' 
  | 'imgToPdf' 
  | 'rotate' 
  | 'protect' 
  | 'unlock' 
  | 'watermark' 
  | 'pageNumbers' 
  | 'organize';

interface ToolCard {
  id: ToolType;
  title: string;
  desc: string;
  icon: any;
  color: string;
  badge?: string;
}

const TOOLS: ToolCard[] = [
  {
    id: 'merge',
    title: 'Merge PDF',
    desc: 'Combine multiple PDFs in the order you want with the easiest PDF merger available.',
    icon: FilePlus,
    color: '#e53e3e',
  },
  {
    id: 'split',
    title: 'Split PDF',
    desc: 'Separate one page or a whole set for easy conversion into independent PDF files.',
    icon: Scissors,
    color: '#dd6b20',
  },
  {
    id: 'compress',
    title: 'Compress PDF',
    desc: 'Reduce file size while optimizing for maximal PDF quality.',
    icon: Minimize2,
    color: '#38a169',
  },
  {
    id: 'editor',
    title: 'Edit PDF',
    desc: 'Add text, images, shapes or freehand annotations to a PDF document. Edit size, font, and color.',
    icon: FileEdit,
    color: '#3182ce',
    badge: 'POPULAR'
  },
  {
    id: 'pdfToImg',
    title: 'PDF to JPG',
    desc: 'Extract all images contained in a PDF or convert each page to a high-res JPG image.',
    icon: Image,
    color: '#d69e2e',
  },
  {
    id: 'imgToPdf',
    title: 'JPG to PDF',
    desc: 'Convert JPG images to PDF in seconds. Easily adjust orientation and margins.',
    icon: FileText,
    color: '#805ad5',
  },
  {
    id: 'watermark',
    title: 'Watermark',
    desc: 'Stamp an image or text over your PDF in seconds. Choose typography, transparency and position.',
    icon: Stamp,
    color: '#e53e3e',
  },
  {
    id: 'rotate',
    title: 'Rotate PDF',
    desc: 'Rotate your PDFs the way you need them. You can even rotate multiple PDFs at once!',
    icon: RotateCw,
    color: '#319795',
  },
  {
    id: 'protect',
    title: 'Protect PDF',
    desc: 'Protect PDF files with a password. Encrypt PDF documents to prevent unauthorized access.',
    icon: KeyRound,
    color: '#c53030',
  },
  {
    id: 'organize',
    title: 'Organize PDF',
    desc: 'Sort, add and delete PDF pages. Drag and drop the page thumbnails to reorder pages.',
    icon: Layers,
    color: '#4a5568',
  },
];

interface ToolHubViewProps {
  onSelectTool: (tool: ToolType) => void;
  onOpenDirectEditor: () => void;
}

export const ToolHubView: React.FC<ToolHubViewProps> = ({ onSelectTool, onOpenDirectEditor }) => {
  return (
    <div className="min-h-screen bg-[#121316] text-slate-100 flex flex-col font-sans selection:bg-red-600 selection:text-white">
      {/* Top Header */}
      <header className="h-16 bg-[#1a1b20] border-b border-[#2d2e36] px-6 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-red-600 to-rose-500 flex items-center justify-center font-black text-white text-xl shadow-lg shadow-red-600/30">
              ♥
            </div>
            <div className="font-black text-lg tracking-tight">
              <span className="text-white">NextSem</span>
              <span className="text-red-500 ml-1">PDF</span>
            </div>
          </div>
          <span className="text-[11px] font-mono px-2.5 py-0.5 rounded-full bg-red-950/80 text-red-300 border border-red-800/40 ml-2 font-bold">
            All-in-One Desktop Suite
          </span>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onOpenDirectEditor}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-bold text-xs shadow-md shadow-red-600/30 transition-all active:scale-95 cursor-pointer"
          >
            <FileEdit size={15} />
            <span>Open Acrobat Editor</span>
          </button>
        </div>
      </header>

      {/* Hero Banner */}
      <section className="text-center py-12 px-4 max-w-4xl mx-auto space-y-3">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
          Every tool you need to work with PDFs in one place
        </h1>
        <p className="text-sm sm:text-base text-slate-400 max-w-2xl mx-auto">
          Every tool you need to use PDFs, at your fingertips. All are 100% offline, free and easy to use! Merge, split, compress, convert, rotate, unlock and watermark PDFs with just a few clicks.
        </p>
      </section>

      {/* iLovePDF Tool Grid */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 pb-16 flex-1 w-full">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {TOOLS.map((tool) => {
            const Icon = tool.icon;
            return (
              <div
                key={tool.id}
                onClick={() => onSelectTool(tool.id)}
                className="p-5 rounded-2xl bg-[#1a1b22] hover:bg-[#22242d] border border-[#2d2e38] hover:border-red-500/50 transition-all duration-200 cursor-pointer group flex flex-col justify-between shadow-lg relative overflow-hidden"
              >
                {tool.badge && (
                  <span className="absolute top-3 right-3 text-[9px] font-mono font-black px-2 py-0.5 rounded bg-red-600 text-white shadow">
                    {tool.badge}
                  </span>
                )}

                <div className="space-y-3">
                  <div 
                    className="w-12 h-12 rounded-xl flex items-center justify-center text-white shadow-md group-hover:scale-110 transition-transform"
                    style={{ backgroundColor: tool.color }}
                  >
                    <Icon size={24} />
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-white group-hover:text-red-400 transition-colors">
                      {tool.title}
                    </h3>
                    <p className="text-xs text-slate-400 mt-1.5 leading-relaxed line-clamp-3">
                      {tool.desc}
                    </p>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-[#2a2b34] flex items-center justify-between text-xs font-semibold text-slate-400 group-hover:text-white">
                  <span>Use Tool</span>
                  <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform text-red-500" />
                </div>
              </div>
            );
          })}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-[#262730] bg-[#101114] py-6 text-center text-xs text-slate-500">
        NextSem PDF Editor • The Complete Offline PDF Software for Windows PC
      </footer>
    </div>
  );
};
