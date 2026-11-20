export interface Annotation {
  id: string;
  pageIndex: number;
  type: 'highlight' | 'draw' | 'text' | 'signature' | 'stamp' | 'shape';
  color: string;
  size?: number;
  // Position coordinates normalized to PDF page scale
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  text?: string;
  points?: { x: number; y: number }[];
  dataUrl?: string; // for signatures or stamps
  shapeType?: 'rect' | 'circle' | 'line' | 'arrow';
}

export type ToolMode = 
  | 'select' 
  | 'pan' 
  | 'highlight' 
  | 'draw' 
  | 'text' 
  | 'signature' 
  | 'stamp' 
  | 'shape' 
  | 'erase';

export interface PdfDocumentState {
  fileName: string;
  filePath?: string;
  numPages: number;
  currentPage: number;
  zoom: number;
  rotation: number; // 0, 90, 180, 270
}
