import React, { useState } from 'react';
import { 
  FileText, 
  Layers, 
  Trash2, 
  RotateCw, 
  BookOpen,
  PlusCircle,
  FilePlus,
  ArrowUp,
  ArrowDown
} from 'lucide-react';

interface SidebarProps {
  numPages: number;
  currentPage: number;
  onSelectPage: (page: number) => void;
  onRotatePage: (pageIndex: number) => void;
  onDeletePage: (pageIndex: number) => void;
  onAddBlankPage: (afterPageIndex: number) => void;
  onAppendPdf: () => void;
  onMovePageUp: (pageIndex: number) => void;
  onMovePageDown: (pageIndex: number) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  numPages,
  currentPage,
  onSelectPage,
  onRotatePage,
  onDeletePage,
  onAddBlankPage,
  onAppendPdf,
  onMovePageUp,
  onMovePageDown,
}) => {
  const [activeTab, setActiveTab] = useState<'thumbnails' | 'outline'>('thumbnails');

  return (
    <aside className="w-64 bg-[#181818] border-r border-[#333] flex flex-col shrink-0 select-none">
      {/* Top Tabs */}
      <div className="h-10 bg-[#1e1e1e] border-b border-[#333] flex items-center justify-between px-2">
        <div className="flex items-center gap-1">
          <button
            onClick={() => setActiveTab('thumbnails')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-semibold transition-colors ${activeTab === 'thumbnails' ? 'bg-[#2d2d2d] text-white' : 'text-slate-400 hover:text-slate-200'}`}
          >
            <Layers size={13} />
            <span>Pages ({numPages})</span>
          </button>
          <button
            onClick={() => setActiveTab('outline')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-semibold transition-colors ${activeTab === 'outline' ? 'bg-[#2d2d2d] text-white' : 'text-slate-400 hover:text-slate-200'}`}
          >
            <BookOpen size={13} />
            <span>Outline</span>
          </button>
        </div>

        {/* Global Action: Insert Another PDF */}
        <button
          onClick={onAppendPdf}
          className="flex items-center gap-1 px-2 py-1 rounded bg-blue-600/30 hover:bg-blue-600/50 text-blue-300 border border-blue-500/40 text-[11px] font-bold transition-all shadow-sm"
          title="Merge / Insert another PDF file into this document"
        >
          <FilePlus size={12} />
          <span>Merge PDF</span>
        </button>
      </div>

      {/* Pages Thumbnails List & Per-Page Actions */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {activeTab === 'thumbnails' ? (
          Array.from({ length: numPages }, (_, i) => i + 1).map((pageNum) => {
            const pageIndex = pageNum - 1;
            const isSelected = currentPage === pageNum;

            return (
              <div
                key={pageNum}
                className={`p-2.5 rounded-xl transition-all border group relative ${isSelected ? 'bg-[#222738] border-blue-500 shadow-md ring-1 ring-blue-500/40' : 'bg-[#202020] border-[#333] hover:border-slate-500'}`}
              >
                {/* Thumbnail Preview Area */}
                <div 
                  onClick={() => onSelectPage(pageNum)}
                  className="aspect-[1/1.414] bg-white rounded-lg flex flex-col items-center justify-center text-slate-800 font-bold text-xs shadow-inner cursor-pointer relative overflow-hidden"
                >
                  <FileText size={24} className="text-slate-400 group-hover:scale-110 transition-transform" />
                  <span className="text-[10px] text-slate-500 font-mono mt-1">Page {pageNum}</span>
                </div>

                {/* Page Controls Bar (Reorder, Rotate, Delete, Insert Blank) */}
                <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-[#333]/80">
                  <div className="flex items-center gap-0.5">
                    <button
                      onClick={() => onMovePageUp(pageIndex)}
                      disabled={pageIndex === 0}
                      className="p-1 rounded hover:bg-[#333] text-slate-400 hover:text-white disabled:opacity-20"
                      title="Move Page Up"
                    >
                      <ArrowUp size={12} />
                    </button>
                    <button
                      onClick={() => onMovePageDown(pageIndex)}
                      disabled={pageIndex === numPages - 1}
                      className="p-1 rounded hover:bg-[#333] text-slate-400 hover:text-white disabled:opacity-20"
                      title="Move Page Down"
                    >
                      <ArrowDown size={12} />
                    </button>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => onRotatePage(pageIndex)}
                      className="p-1 rounded hover:bg-[#333] text-slate-400 hover:text-white"
                      title="Rotate this page 90°"
                    >
                      <RotateCw size={12} />
                    </button>
                    <button
                      onClick={() => onAddBlankPage(pageIndex)}
                      className="p-1 rounded hover:bg-[#333] text-emerald-400 hover:text-emerald-300"
                      title="Insert Blank Page After"
                    >
                      <PlusCircle size={12} />
                    </button>
                    <button
                      onClick={() => onDeletePage(pageIndex)}
                      disabled={numPages <= 1}
                      className="p-1 rounded hover:bg-red-900/40 text-red-400 hover:text-red-300 disabled:opacity-20"
                      title="Delete this page"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="p-4 text-xs text-slate-400 font-mono text-center">
            No embedded bookmarks in this document.
          </div>
        )}
      </div>

      {/* Bottom Quick Action: Add Blank Page at end */}
      <div className="p-2 border-t border-[#333] bg-[#1a1a1a]">
        <button
          onClick={() => onAddBlankPage(numPages - 1)}
          className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-[#252526] hover:bg-[#303030] text-slate-200 hover:text-white text-xs font-semibold border border-[#383838] transition-colors"
        >
          <PlusCircle size={14} className="text-emerald-400" />
          <span>Add Blank Page at End</span>
        </button>
      </div>
    </aside>
  );
};
