import React, { useState } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import { PDFDocument, rgb, degrees } from 'pdf-lib';
import { Toolbar } from './components/Toolbar';
import { Sidebar } from './components/Sidebar';
import { PdfPageView } from './components/PdfPageView';
import { ToolHubView, ToolType } from './components/ToolHubView';
import { DedicatedToolModal } from './components/DedicatedToolModal';
import { ToolMode, PdfDocumentState, Annotation } from './types/pdf';
import { LayoutGrid } from 'lucide-react';

// Configure PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

declare global {
  interface Window {
    electronAPI?: {
      openPdf: () => Promise<{ filePath: string; fileName: string; data: number[] } | null>;
      savePdf: (payload: { data: number[]; defaultName: string }) => Promise<string | false>;
      print: () => void;
    };
  }
}

export default function App() {
  // Navigation mode: 'hub' (iLovePDF grid) | 'toolModal' | 'editor' (Acrobat editor)
  const [currentView, setCurrentView] = useState<'hub' | 'toolModal' | 'editor'>('hub');
  const [selectedTool, setSelectedTool] = useState<ToolType>('merge');

  // PDF & Editor state
  const [pdfData, setPdfData] = useState<Uint8Array | null>(null);
  const [pdfDoc, setPdfDoc] = useState<any>(null);
  const [docState, setDocState] = useState<PdfDocumentState | null>(null);
  const [toolMode, setToolMode] = useState<ToolMode>('select');
  const [activeColor, setActiveColor] = useState<string>('#facc15');
  const [annotations, setAnnotations] = useState<Annotation[]>([]);

  // Load PDF into PDF.js
  const loadPdfBytes = async (bytes: Uint8Array, name: string, path?: string, targetPage = 1) => {
    try {
      const loadingTask = pdfjsLib.getDocument({ data: bytes.slice(0) });
      const loadedDoc = await loadingTask.promise;
      setPdfData(bytes);
      setPdfDoc(loadedDoc);
      setDocState({
        fileName: name,
        filePath: path,
        numPages: loadedDoc.numPages,
        currentPage: targetPage,
        zoom: 1.25,
        rotation: 0
      });
      setCurrentView('editor');
    } catch (err) {
      console.error('Failed to load PDF:', err);
      alert('Error reading PDF document. Please verify the file.');
    }
  };

  // Open PDF handler
  const handleOpenPdf = async () => {
    if (window.electronAPI) {
      const result = await window.electronAPI.openPdf();
      if (result) {
        const bytes = new Uint8Array(result.data);
        await loadPdfBytes(bytes, result.fileName, result.filePath);
      }
    } else {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'application/pdf';
      input.onchange = async (e) => {
        const file = (e.target as HTMLInputElement).files?.[0];
        if (file) {
          const buffer = await file.arrayBuffer();
          await loadPdfBytes(new Uint8Array(buffer), file.name);
        }
      };
      input.click();
    }
  };

  // Page Organizers
  const handleDeletePage = async (pageIndex: number) => {
    if (!pdfData || !docState || docState.numPages <= 1) return;
    const confirmDelete = confirm(`Are you sure you want to remove Page ${pageIndex + 1}?`);
    if (!confirmDelete) return;

    try {
      const pdfLibDoc = await PDFDocument.load(pdfData);
      pdfLibDoc.removePage(pageIndex);
      const newPdfBytes = await pdfLibDoc.save();

      setAnnotations(prev => 
        prev
          .filter(a => a.pageIndex !== pageIndex)
          .map(a => a.pageIndex > pageIndex ? { ...a, pageIndex: a.pageIndex - 1 } : a)
      );

      const nextCurrentPage = Math.min(docState.currentPage, docState.numPages - 1);
      await loadPdfBytes(newPdfBytes, docState.fileName, docState.filePath, nextCurrentPage);
    } catch (err) {
      console.error('Failed to delete page:', err);
      alert('Error deleting page.');
    }
  };

  const handleAddBlankPage = async (afterPageIndex: number) => {
    if (!pdfData || !docState) return;

    try {
      const pdfLibDoc = await PDFDocument.load(pdfData);
      const insertAt = Math.min(Math.max(afterPageIndex + 1, 0), pdfLibDoc.getPageCount());
      pdfLibDoc.insertPage(insertAt, [595.28, 841.89]);
      const newPdfBytes = await pdfLibDoc.save();

      setAnnotations(prev => 
        prev.map(a => a.pageIndex >= insertAt ? { ...a, pageIndex: a.pageIndex + 1 } : a)
      );

      await loadPdfBytes(newPdfBytes, docState.fileName, docState.filePath, insertAt + 1);
    } catch (err) {
      console.error('Failed to add blank page:', err);
      alert('Error adding blank page.');
    }
  };

  const handleAppendPdf = async () => {
    if (!pdfData || !docState) return;

    const performMerge = async (incomingBytes: Uint8Array) => {
      try {
        const baseDoc = await PDFDocument.load(pdfData);
        const incomingDoc = await PDFDocument.load(incomingBytes);
        const copiedPages = await baseDoc.copyPages(incomingDoc, incomingDoc.getPageIndices());
        
        copiedPages.forEach(p => baseDoc.addPage(p));
        const mergedBytes = await baseDoc.save();

        await loadPdfBytes(mergedBytes, docState.fileName, docState.filePath, docState.currentPage);
      } catch (err) {
        console.error('Merge error:', err);
        alert('Could not merge incoming PDF.');
      }
    };

    if (window.electronAPI) {
      const result = await window.electronAPI.openPdf();
      if (result) {
        await performMerge(new Uint8Array(result.data));
      }
    } else {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'application/pdf';
      input.onchange = async (e) => {
        const file = (e.target as HTMLInputElement).files?.[0];
        if (file) {
          const buffer = await file.arrayBuffer();
          await performMerge(new Uint8Array(buffer));
        }
      };
      input.click();
    }
  };

  const handleRotatePage = async (pageIndex: number) => {
    if (!pdfData || !docState) return;

    try {
      const pdfLibDoc = await PDFDocument.load(pdfData);
      const page = pdfLibDoc.getPage(pageIndex);
      const currentRot = page.getRotation().angle;
      page.setRotation(degrees((currentRot + 90) % 360));
      const newPdfBytes = await pdfLibDoc.save();

      await loadPdfBytes(newPdfBytes, docState.fileName, docState.filePath, pageIndex + 1);
    } catch (err) {
      console.error('Rotate page error:', err);
    }
  };

  const handleMovePage = async (fromIndex: number, toIndex: number) => {
    if (!pdfData || !docState || fromIndex < 0 || toIndex < 0 || fromIndex === toIndex) return;

    try {
      const pdfLibDoc = await PDFDocument.load(pdfData);
      const pageToMove = pdfLibDoc.getPage(fromIndex);
      pdfLibDoc.removePage(fromIndex);
      pdfLibDoc.insertPage(toIndex, pageToMove);
      const newPdfBytes = await pdfLibDoc.save();

      setAnnotations(prev => prev.map(a => {
        if (a.pageIndex === fromIndex) return { ...a, pageIndex: toIndex };
        if (fromIndex < toIndex && a.pageIndex > fromIndex && a.pageIndex <= toIndex) {
          return { ...a, pageIndex: a.pageIndex - 1 };
        }
        if (fromIndex > toIndex && a.pageIndex >= toIndex && a.pageIndex < fromIndex) {
          return { ...a, pageIndex: a.pageIndex + 1 };
        }
        return a;
      }));

      await loadPdfBytes(newPdfBytes, docState.fileName, docState.filePath, toIndex + 1);
    } catch (err) {
      console.error('Move page error:', err);
    }
  };

  const handleSavePdf = async () => {
    if (!pdfData || !docState) return;

    try {
      const pdfLibDoc = await PDFDocument.load(pdfData);
      const pages = pdfLibDoc.getPages();

      annotations.forEach((ann) => {
        if (ann.pageIndex >= pages.length) return;
        const page = pages[ann.pageIndex];
        const { height } = page.getSize();

        if (ann.type === 'text' && ann.x !== undefined && ann.y !== undefined && ann.text) {
          page.drawText(ann.text, {
            x: ann.x / docState.zoom,
            y: height - (ann.y / docState.zoom),
            size: 14,
            color: rgb(0.1, 0.1, 0.1),
          });
        } else if (ann.type === 'stamp' && ann.x !== undefined && ann.y !== undefined) {
          page.drawText('APPROVED', {
            x: ann.x / docState.zoom,
            y: height - (ann.y / docState.zoom),
            size: 18,
            color: rgb(0.86, 0.15, 0.15),
          });
        }
      });

      const modifiedPdfBytes = await pdfLibDoc.save();

      if (window.electronAPI) {
        await window.electronAPI.savePdf({
          data: Array.from(modifiedPdfBytes),
          defaultName: docState.fileName.replace('.pdf', '_edited.pdf'),
        });
      } else {
        const blob = new Blob([modifiedPdfBytes.buffer as ArrayBuffer], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = docState.fileName.replace('.pdf', '_edited.pdf');
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch (err) {
      console.error('Save error:', err);
      alert('Could not save document.');
    }
  };

  const handlePrint = () => {
    if (window.electronAPI) {
      window.electronAPI.print();
    } else {
      window.print();
    }
  };

  // 1. Tool Hub View (iLovePDF Style Grid)
  if (currentView === 'hub') {
    return (
      <ToolHubView
        onSelectTool={(tool) => {
          if (tool === 'editor') {
            handleOpenPdf();
          } else {
            setSelectedTool(tool);
            setCurrentView('toolModal');
          }
        }}
        onOpenDirectEditor={() => {
          if (docState) setCurrentView('editor');
          else handleOpenPdf();
        }}
      />
    );
  }

  // 2. Dedicated Single-Tool View (Merge, Split, Watermark, etc.)
  if (currentView === 'toolModal') {
    return (
      <DedicatedToolModal
        tool={selectedTool}
        onBack={() => setCurrentView('hub')}
        onOpenInFullEditor={(bytes, name) => loadPdfBytes(bytes, name)}
      />
    );
  }

  // 3. Full Acrobat-Grade Interactive Editor
  return (
    <div className="h-screen w-screen flex flex-col bg-[#141414] text-slate-100 overflow-hidden font-sans">
      <div className="flex items-center justify-between bg-[#111215] px-4 py-1.5 border-b border-[#2d2e36] text-xs">
        <button
          onClick={() => setCurrentView('hub')}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#20222a] hover:bg-[#2b2d38] text-slate-300 hover:text-white font-semibold transition-colors"
        >
          <LayoutGrid size={13} className="text-red-500" />
          <span>All PDF Tools (iLovePDF Grid)</span>
        </button>

        <span className="font-mono text-slate-400 truncate max-w-sm">
          Editing: <strong className="text-white">{docState?.fileName || 'Document'}</strong>
        </span>

        <div className="w-24" />
      </div>

      <Toolbar
        docState={docState}
        toolMode={toolMode}
        setToolMode={setToolMode}
        activeColor={activeColor}
        setActiveColor={setActiveColor}
        onOpenPdf={handleOpenPdf}
        onSavePdf={handleSavePdf}
        onPrint={handlePrint}
        onZoomIn={() => setDocState(prev => prev ? { ...prev, zoom: Math.min(prev.zoom + 0.25, 3.0) } : null)}
        onZoomOut={() => setDocState(prev => prev ? { ...prev, zoom: Math.max(prev.zoom - 0.25, 0.5) } : null)}
        onRotate={() => setDocState(prev => prev ? { ...prev, rotation: (prev.rotation + 90) % 360 } : null)}
        onPrevPage={() => setDocState(prev => prev ? { ...prev, currentPage: Math.max(prev.currentPage - 1, 1) } : null)}
        onNextPage={() => setDocState(prev => prev ? { ...prev, currentPage: Math.min(prev.currentPage + 1, prev.numPages) } : null)}
      />

      <div className="flex-1 flex overflow-hidden">
        {docState ? (
          <>
            <Sidebar
              numPages={docState.numPages}
              currentPage={docState.currentPage}
              onSelectPage={(p) => setDocState(prev => prev ? { ...prev, currentPage: p } : null)}
              onRotatePage={handleRotatePage}
              onDeletePage={handleDeletePage}
              onAddBlankPage={handleAddBlankPage}
              onAppendPdf={handleAppendPdf}
              onMovePageUp={(idx) => handleMovePage(idx, idx - 1)}
              onMovePageDown={(idx) => handleMovePage(idx, idx + 1)}
            />

            <main className="flex-1 overflow-y-auto p-8 flex flex-col items-center bg-[#252526]">
              {Array.from({ length: docState.numPages }, (_, i) => (
                <PdfPageView
                  key={i}
                  pageIndex={i}
                  pdfDoc={pdfDoc}
                  zoom={docState.zoom}
                  rotation={docState.rotation}
                  toolMode={toolMode}
                  activeColor={activeColor}
                  annotations={annotations}
                  onAddAnnotation={(ann) => setAnnotations(prev => [...prev, ann])}
                  onDeleteAnnotation={(id) => setAnnotations(prev => prev.filter(a => a.id !== id))}
                />
              ))}
            </main>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-[#181818]">
            <p className="text-slate-400 text-sm">No document open. Please select a PDF.</p>
          </div>
        )}
      </div>
    </div>
  );
}
