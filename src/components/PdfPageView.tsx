import React, { useRef, useState, useEffect } from 'react';
import { Annotation, ToolMode } from '../types/pdf';

interface PdfPageViewProps {
  pageIndex: number;
  pdfDoc: any;
  zoom: number;
  rotation: number;
  toolMode: ToolMode;
  activeColor: string;
  annotations: Annotation[];
  onAddAnnotation: (ann: Annotation) => void;
  onDeleteAnnotation: (id: string) => void;
}

export const PdfPageView: React.FC<PdfPageViewProps> = ({
  pageIndex,
  pdfDoc,
  zoom,
  rotation,
  toolMode,
  activeColor,
  annotations,
  onAddAnnotation,
  onDeleteAnnotation,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const overlayRef = useRef<HTMLCanvasElement | null>(null);
  const [dimensions, setDimensions] = useState<{ width: number; height: number }>({ width: 0, height: 0 });
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentPath, setCurrentPath] = useState<{ x: number; y: number }[]>([]);
  const [startPoint, setStartPoint] = useState<{ x: number; y: number } | null>(null);

  // Render PDF page to canvas via PDF.js
  useEffect(() => {
    let isCancelled = false;

    async function renderPage() {
      if (!pdfDoc || !canvasRef.current) return;
      try {
        const page = await pdfDoc.getPage(pageIndex + 1);
        const viewport = page.getViewport({ scale: zoom, rotation });
        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');
        if (!context || isCancelled) return;

        canvas.width = viewport.width;
        canvas.height = viewport.height;
        setDimensions({ width: viewport.width, height: viewport.height });

        await page.render({
          canvasContext: context,
          viewport: viewport,
        }).promise;
      } catch (err) {
        console.error('Error rendering page:', err);
      }
    }

    renderPage();
    return () => {
      isCancelled = true;
    };
  }, [pdfDoc, pageIndex, zoom, rotation]);

  // Handle overlay drawing events
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (toolMode === 'select' || toolMode === 'pan') return;

    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setIsDrawing(true);
    setStartPoint({ x, y });

    if (toolMode === 'draw' || toolMode === 'highlight') {
      setCurrentPath([{ x, y }]);
    } else if (toolMode === 'text') {
      const userText = prompt('Enter text to add to document:');
      if (userText && userText.trim()) {
        onAddAnnotation({
          id: 'text_' + Date.now(),
          pageIndex,
          type: 'text',
          color: activeColor,
          x,
          y,
          text: userText,
          size: 16 * zoom
        });
      }
      setIsDrawing(false);
    } else if (toolMode === 'stamp') {
      onAddAnnotation({
        id: 'stamp_' + Date.now(),
        pageIndex,
        type: 'stamp',
        color: '#dc2626',
        x,
        y,
        text: 'APPROVED'
      });
      setIsDrawing(false);
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (toolMode === 'draw' || toolMode === 'highlight') {
      setCurrentPath(prev => [...prev, { x, y }]);
    }
  };

  const handleMouseUp = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    setIsDrawing(false);

    const rect = e.currentTarget.getBoundingClientRect();
    const endX = e.clientX - rect.left;
    const endY = e.clientY - rect.top;

    if ((toolMode === 'draw' || toolMode === 'highlight') && currentPath.length > 1) {
      onAddAnnotation({
        id: 'draw_' + Date.now(),
        pageIndex,
        type: toolMode === 'highlight' ? 'highlight' : 'draw',
        color: activeColor,
        points: currentPath,
        size: toolMode === 'highlight' ? 20 * zoom : 3 * zoom
      });
      setCurrentPath([]);
    } else if (toolMode === 'shape' && startPoint) {
      const width = endX - startPoint.x;
      const height = endY - startPoint.y;
      if (Math.abs(width) > 5 && Math.abs(height) > 5) {
        onAddAnnotation({
          id: 'shape_' + Date.now(),
          pageIndex,
          type: 'shape',
          shapeType: 'rect',
          color: activeColor,
          x: Math.min(startPoint.x, endX),
          y: Math.min(startPoint.y, endY),
          width: Math.abs(width),
          height: Math.abs(height)
        });
      }
      setStartPoint(null);
    }
  };

  // Render annotations on overlay canvas
  useEffect(() => {
    const canvas = overlayRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw saved annotations
    annotations
      .filter(a => a.pageIndex === pageIndex)
      .forEach(a => {
        if (a.type === 'draw' || a.type === 'highlight') {
          if (!a.points || a.points.length === 0) return;
          ctx.beginPath();
          ctx.strokeStyle = a.color;
          ctx.lineWidth = a.size || 3;
          ctx.lineCap = 'round';
          ctx.lineJoin = 'round';
          if (a.type === 'highlight') {
            ctx.globalAlpha = 0.35;
          } else {
            ctx.globalAlpha = 1.0;
          }

          ctx.moveTo(a.points[0].x, a.points[0].y);
          for (let i = 1; i < a.points.length; i++) {
            ctx.lineTo(a.points[i].x, a.points[i].y);
          }
          ctx.stroke();
          ctx.globalAlpha = 1.0;
        } else if (a.type === 'text' && a.x !== undefined && a.y !== undefined) {
          ctx.font = `${a.size || 16}px Arial, sans-serif`;
          ctx.fillStyle = a.color;
          ctx.fillText(a.text || '', a.x, a.y);
        } else if (a.type === 'shape' && a.x !== undefined && a.y !== undefined) {
          ctx.strokeStyle = a.color;
          ctx.lineWidth = 2 * zoom;
          ctx.strokeRect(a.x, a.y, a.width || 50, a.height || 50);
        } else if (a.type === 'stamp' && a.x !== undefined && a.y !== undefined) {
          ctx.save();
          ctx.translate(a.x, a.y);
          ctx.rotate(-0.15);
          ctx.strokeStyle = '#dc2626';
          ctx.lineWidth = 3;
          ctx.strokeRect(-60, -20, 120, 40);
          ctx.font = 'bold 18px Arial';
          ctx.fillStyle = '#dc2626';
          ctx.textAlign = 'center';
          ctx.fillText(a.text || 'APPROVED', 0, 7);
          ctx.restore();
        }
      });

    // Draw active drawing live feedback
    if (isDrawing && currentPath.length > 1) {
      ctx.beginPath();
      ctx.strokeStyle = activeColor;
      ctx.lineWidth = toolMode === 'highlight' ? 20 * zoom : 3 * zoom;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.globalAlpha = toolMode === 'highlight' ? 0.35 : 1.0;

      ctx.moveTo(currentPath[0].x, currentPath[0].y);
      for (let i = 1; i < currentPath.length; i++) {
        ctx.lineTo(currentPath[i].x, currentPath[i].y);
      }
      ctx.stroke();
      ctx.globalAlpha = 1.0;
    }
  }, [annotations, isDrawing, currentPath, pageIndex, zoom, activeColor, toolMode]);

  return (
    <div 
      className="pdf-page-container mb-6 rounded shadow-2xl overflow-hidden mx-auto select-none"
      style={{ width: dimensions.width || 'auto', height: dimensions.height || 'auto' }}
    >
      <canvas ref={canvasRef} className="block" />
      <canvas
        ref={overlayRef}
        width={dimensions.width}
        height={dimensions.height}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        className={`absolute inset-0 ${toolMode === 'draw' || toolMode === 'highlight' ? 'cursor-crosshair' : toolMode === 'text' ? 'cursor-text' : toolMode === 'pan' ? 'cursor-grab' : 'cursor-default'}`}
      />
    </div>
  );
};
