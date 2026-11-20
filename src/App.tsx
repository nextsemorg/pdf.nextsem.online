import React, { useState, useEffect, useRef } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import { PDFDocument, rgb, degrees } from 'pdf-lib';
import { Toolbar } from './components/Toolbar';
import { Sidebar } from './components/Sidebar';
import { PdfPageView } from './components/PdfPageView';
import { ToolMode, PdfDocumentState, Annotation } from './types/pdf';
import { FileUp, Sparkles, Shield, Layers, Plus, Trash2 } from 'lucide-react';

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

  // 1. DELETE PAGE
  const handleDeletePage = async (pageIndex: number) => {
    if (!pdfData || !docState || docState.numPages <= 1) return;
    const confirmDelete = confirm(`Are you sure you want to remove Page ${pageIndex + 1}?`);
    if (!confirmDelete) return;

    try {
      const pdfLibDoc = await PDFDocument.load(pdfData);
      pdfLibDoc.removePage(pageIndex);
      const newPdfBytes = await pdfLibDoc.save();

      // Clean annotations for that page and adjust index
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

  // 2. INSERT BLANK PAGE
  const handleAddBlankPage = async (afterPageIndex: number) => {
    if (!pdfData || !docState) return;

    try {
      const pdfLibDoc = await PDFDocument.load(pdfData);
      const insertAt = Math.min(Math.max(afterPageIndex + 1, 0), pdfLibDoc.getPageCount());
      
      // Standard A4 dimensions in PDF points (595.28 x 841.89)
      pdfLibDoc.insertPage(insertAt, [595.28, 841.89]);
      const newPdfBytes = await pdfLibDoc.save();

      // Shift annotations for shifted pages
      setAnnotations(prev => 
        prev.map(a => a.pageIndex >= insertAt ? { ...a, pageIndex: a.pageIndex + 1 } : a)
      );

      await loadPdfBytes(newPdfBytes, docState.fileName, docState.filePath, insertAt + 1);
    } catch (err) {
      console.error('Failed to add blank page:', err);
      alert('Error adding blank page.');
    }
  };

  // 3. MERGE / APPEND ANOTHER PDF
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

  // 4. ROTATE SPECIFIC PAGE
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

  // 5. REORDER PAGES (MOVE UP / DOWN)
  const handleMovePage = async (fromIndex: number, toIndex: number) => {
    if (!pdfData || !docState || fromIndex < 0 || toIndex < 0 || fromIndex === toIndex) return;

    try {
      const pdfLibDoc = await PDFDocument.load(pdfData);
      const pageToMove = pdfLibDoc.getPage(fromIndex);
      pdfLibDoc.removePage(fromIndex);
      pdfLibDoc.insertPage(toIndex, pageToMove);
      const newPdfBytes = await pdfLibDoc.save();

      // Adjust annotations
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

  // Save flattened PDF with pdf-lib
  const handleSavePdf = async () => {
    if (!pdfData || !docState) return;

    try {
      const pdfLibDoc = await PDFDocument.load(pdfData);
      const pages = pdfLibDoc.getPages();

      // Apply annotations to PDF pages
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

  return (
    <div className="h-screen w-screen flex flex-col bg-[#141414] text-slate-100 overflow-hidden font-sans">
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
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-gradient-to-b from-[#181818] to-[#121212]">
            <div className="max-w-md w-full space-y-6">
              <div className="w-20 h-20 mx-auto rounded-3xl bg-gradient-to-tr from-red-600 via-rose-600 to-orange-500 p-[2px] shadow-2xl shadow-red-600/30">
                <div className="w-full h-full bg-[#181818] rounded-[22px] flex items-center justify-center">
                  <span className="text-4xl font-black text-red-500">P</span>
                </div>
              </div>

              <div>
                <h2 className="text-2xl font-black text-white tracking-tight">NextSem PDF Editor</h2>
                <p className="text-xs text-slate-400 mt-1">
                  Professional Desktop PDF Suite for Windows PC • Adobe Acrobat Alternative
                </p>
              </div>

              <div 
                onClick={handleOpenPdf}
                className="p-8 rounded-2xl border-2 border-dashed border-red-500/40 hover:border-red-500 bg-[#1e1e1e]/60 hover:bg-[#252526] cursor-pointer transition-all group"
              >
                <FileUp size={36} className="mx-auto text-red-400 group-hover:scale-110 transition-transform mb-3" />
                <span className="block text-sm font-bold text-white">Click or Drag PDF here to open</span>
                <span className="block text-xs text-slate-400 mt-1">Supports all standard PDF documents &amp; forms</span>
              </div>

              <div className="grid grid-cols-3 gap-3 text-left">
                <div className="p-3 rounded-xl bg-[#1e1e1e] border border-[#333]">
                  <Sparkles size={16} className="text-yellow-400 mb-1.5" />
                  <h4 className="text-xs font-bold text-white">Markup &amp; Draw</h4>
                  <p className="text-[10px] text-slate-400">Highlight, pen, notes &amp; shapes</p>
                </div>
                <div className="p-3 rounded-xl bg-[#1e1e1e] border border-[#333]">
                  <Shield size={16} className="text-blue-400 mb-1.5" />
                  <h4 className="text-xs font-bold text-white">Sign &amp; Stamp</h4>
                  <p className="text-[10px] text-slate-400">Digital signatures &amp; stamps</p>
                </div>
                <div className="p-3 rounded-xl bg-[#1e1e1e] border border-[#333]">
                  <Layers size={16} className="text-emerald-400 mb-1.5" />
                  <h4 className="text-xs font-bold text-white">Page Manager</h4>
                  <p className="text-[10px] text-slate-400">Add, delete, rotate &amp; merge</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
