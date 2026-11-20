import React, { useState } from 'react';
import { 
  ArrowLeft, 
  Upload, 
  FilePlus, 
  Scissors, 
  Minimize2, 
  RotateCw, 
  Layers, 
  CheckCircle2, 
  Download,
  Trash2,
  Lock,
  Stamp
} from 'lucide-react';
import { PDFDocument, degrees, rgb } from 'pdf-lib';
import { ToolType } from './ToolHubView';

interface DedicatedToolModalProps {
  tool: ToolType;
  onBack: () => void;
  onOpenInFullEditor: (bytes: Uint8Array, fileName: string) => void;
}

export const DedicatedToolModal: React.FC<DedicatedToolModalProps> = ({
  tool,
  onBack,
  onOpenInFullEditor,
}) => {
  const [files, setFiles] = useState<{ name: string; bytes: Uint8Array }[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [resultPdf, setResultPdf] = useState<{ bytes: Uint8Array; name: string } | null>(null);

  // Split specific settings
  const [splitRange, setSplitRange] = useState('1-3');
  // Watermark text
  const [watermarkText, setWatermarkText] = useState('CONFIDENTIAL');
  // Password Protect
  const [password, setPassword] = useState('');

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files;
    if (!selected || selected.length === 0) return;

    const newFiles: { name: string; bytes: Uint8Array }[] = [];
    for (let i = 0; i < selected.length; i++) {
      const f = selected[i];
      const buf = await f.arrayBuffer();
      newFiles.push({ name: f.name, bytes: new Uint8Array(buf) });
    }

    if (tool === 'merge') {
      setFiles(prev => [...prev, ...newFiles]);
    } else {
      setFiles(newFiles.slice(0, 1));
    }
    setResultPdf(null);
  };

  const handleProcessTool = async () => {
    if (files.length === 0) return;
    setIsProcessing(true);

    try {
      if (tool === 'merge') {
        const mergedDoc = await PDFDocument.create();
        for (const file of files) {
          const doc = await PDFDocument.load(file.bytes);
          const copiedPages = await mergedDoc.copyPages(doc, doc.getPageIndices());
          copiedPages.forEach(p => mergedDoc.addPage(p));
        }
        const mergedBytes = await mergedDoc.save();
        setResultPdf({ bytes: mergedBytes, name: 'Merged_Document.pdf' });
      } else if (tool === 'split') {
        const srcDoc = await PDFDocument.load(files[0].bytes);
        const splitDoc = await PDFDocument.create();
        
        // Parse range like "1-2" or single "1"
        const pageCount = srcDoc.getPageCount();
        let indicesToCopy: number[] = [];
        if (splitRange.includes('-')) {
          const [start, end] = splitRange.split('-').map(Number);
          for (let p = Math.max(start, 1); p <= Math.min(end, pageCount); p++) {
            indicesToCopy.push(p - 1);
          }
        } else {
          const single = Number(splitRange);
          if (single >= 1 && single <= pageCount) indicesToCopy.push(single - 1);
        }

        if (indicesToCopy.length === 0) indicesToCopy = [0];

        const copied = await splitDoc.copyPages(srcDoc, indicesToCopy);
        copied.forEach(p => splitDoc.addPage(p));
        const splitBytes = await splitDoc.save();
        setResultPdf({ bytes: splitBytes, name: `Split_Pages_${files[0].name}` });
      } else if (tool === 'watermark') {
        const doc = await PDFDocument.load(files[0].bytes);
        const pages = doc.getPages();
        pages.forEach(page => {
          const { width, height } = page.getSize();
          page.drawText(watermarkText, {
            x: width / 4,
            y: height / 2,
            size: 40,
            color: rgb(0.8, 0.2, 0.2),
            rotate: degrees(45),
            opacity: 0.35
          });
        });
        const out = await doc.save();
        setResultPdf({ bytes: out, name: `Watermarked_${files[0].name}` });
      } else if (tool === 'rotate') {
        const doc = await PDFDocument.load(files[0].bytes);
        const pages = doc.getPages();
        pages.forEach(p => {
          p.setRotation(degrees((p.getRotation().angle + 90) % 360));
        });
        const out = await doc.save();
        setResultPdf({ bytes: out, name: `Rotated_${files[0].name}` });
      }
    } catch (err) {
      console.error(err);
      alert('Error processing file.');
    } finally {
      setIsProcessing(false);
    }
  };

  const downloadResult = () => {
    if (!resultPdf) return;
    const blob = new Blob([resultPdf.bytes.buffer as ArrayBuffer], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = resultPdf.name;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-[#121316] text-slate-100 flex flex-col font-sans">
      {/* Top Bar */}
      <header className="h-16 bg-[#1a1b20] border-b border-[#2d2e36] px-6 flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#25262e] hover:bg-[#30323c] text-slate-300 hover:text-white text-xs font-semibold transition-colors"
        >
          <ArrowLeft size={15} />
          <span>Back to All Tools</span>
        </button>

        <h2 className="font-bold text-sm tracking-wide text-white uppercase font-mono">
          Tool: {tool.toUpperCase()} PDF
        </h2>

        <div className="w-20" />
      </header>

      {/* Main Container */}
      <div className="flex-1 max-w-3xl w-full mx-auto p-6 flex flex-col items-center justify-center">
        {files.length === 0 ? (
          /* Upload Card */
          <div className="w-full p-12 rounded-3xl border-2 border-dashed border-[#3a3b47] hover:border-red-500 bg-[#1a1b22] text-center space-y-4 transition-all">
            <div className="w-16 h-16 rounded-2xl bg-red-600/20 text-red-500 flex items-center justify-center mx-auto shadow-inner">
              <Upload size={32} />
            </div>

            <div>
              <h3 className="text-xl font-bold text-white">Select PDF files</h3>
              <p className="text-xs text-slate-400 mt-1">or drop PDFs here</p>
            </div>

            <label className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-sm shadow-lg shadow-red-600/30 cursor-pointer transition-transform active:scale-95">
              <span>Select PDF File{tool === 'merge' ? 's' : ''}</span>
              <input 
                type="file" 
                accept="application/pdf" 
                multiple={tool === 'merge'} 
                onChange={handleFileSelect} 
                className="hidden" 
              />
            </label>
          </div>
        ) : (
          /* Process & Controls Screen */
          <div className="w-full space-y-6">
            <div className="p-6 rounded-2xl bg-[#1a1b22] border border-[#2d2e38] space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#2d2e38]">
                <h4 className="font-bold text-sm text-white">Selected Files ({files.length})</h4>
                <label className="text-xs text-red-400 hover:text-red-300 cursor-pointer font-semibold">
                  + Add more
                  <input type="file" accept="application/pdf" multiple onChange={handleFileSelect} className="hidden" />
                </label>
              </div>

              <div className="space-y-2 max-h-60 overflow-y-auto">
                {files.map((f, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-[#22242d] text-xs">
                    <span className="font-mono text-slate-200 truncate max-w-md">{f.name}</span>
                    <button
                      onClick={() => setFiles(prev => prev.filter((_, i) => i !== idx))}
                      className="text-slate-400 hover:text-red-400 p-1"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>

              {/* Tool Specific Configs */}
              {tool === 'split' && (
                <div className="pt-3 border-t border-[#2d2e38] space-y-1">
                  <label className="text-xs font-semibold text-slate-300">Page Range to Extract (e.g. 1-2):</label>
                  <input
                    type="text"
                    value={splitRange}
                    onChange={(e) => setSplitRange(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-[#14151a] border border-[#333] text-sm text-white font-mono focus:border-red-500 outline-none"
                  />
                </div>
              )}

              {tool === 'watermark' && (
                <div className="pt-3 border-t border-[#2d2e38] space-y-1">
                  <label className="text-xs font-semibold text-slate-300">Watermark Text:</label>
                  <input
                    type="text"
                    value={watermarkText}
                    onChange={(e) => setWatermarkText(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-[#14151a] border border-[#333] text-sm text-white font-mono focus:border-red-500 outline-none"
                  />
                </div>
              )}
            </div>

            {/* Action Buttons */}
            {!resultPdf ? (
              <button
                onClick={handleProcessTool}
                disabled={isProcessing}
                className="w-full py-4 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 disabled:opacity-50 text-white font-extrabold text-base shadow-xl shadow-red-600/30 transition-all cursor-pointer"
              >
                {isProcessing ? 'Processing PDF...' : `${tool.toUpperCase()} PDF`}
              </button>
            ) : (
              <div className="p-6 rounded-2xl bg-emerald-950/40 border border-emerald-600/50 text-center space-y-4">
                <CheckCircle2 size={40} className="mx-auto text-emerald-400" />
                <h3 className="text-lg font-bold text-white">Your PDF is ready!</h3>
                <div className="flex items-center justify-center gap-3">
                  <button
                    onClick={downloadResult}
                    className="flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-lg shadow-emerald-600/30"
                  >
                    <Download size={16} />
                    <span>Download {resultPdf.name}</span>
                  </button>

                  <button
                    onClick={() => onOpenInFullEditor(resultPdf.bytes, resultPdf.name)}
                    className="flex items-center gap-2 px-5 py-3 rounded-xl bg-[#22242d] hover:bg-[#2d303c] text-slate-200 hover:text-white font-bold text-sm border border-[#383a48]"
                  >
                    <span>Open in Editor</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
