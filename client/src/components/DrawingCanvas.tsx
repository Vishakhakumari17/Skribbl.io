import React, { useRef, useEffect, useState, useCallback } from 'react';
import type { DrawStroke, StrokePoint } from '../types';
import { socket } from '../services/socket';
import { 
  Pencil, 
  Eraser, 
  Undo2, 
  Trash2 
} from 'lucide-react';

interface DrawingCanvasProps {
  isDrawer: boolean;
  initialStrokes?: DrawStroke[];
}

const COLORS = [
  '#000000', // Black
  '#ef4444', // Red
  '#f97316', // Orange
  '#eab308', // Yellow
  '#22c55e', // Green
  '#3b82f6', // Blue
  '#a855f7', // Purple
  '#ec4899', // Pink
  '#78350f', // Brown
];

const BRUSH_SIZES = [
  { size: 4, label: 'small', circleSize: 'w-3 h-3' },
  { size: 8, label: 'medium', circleSize: 'w-4 h-4' },
  { size: 16, label: 'large', circleSize: 'w-5 h-5' },
];

export const DrawingCanvas: React.FC<DrawingCanvasProps> = ({ isDrawer, initialStrokes = [] }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [activeTool, setActiveTool] = useState<'pencil' | 'eraser'>('pencil');
  const [currentColor, setCurrentColor] = useState<string>('#000000');
  const [brushSize, setBrushSize] = useState<number>(8);
  const [isDrawing, setIsDrawing] = useState<boolean>(false);

  const strokesRef = useRef<DrawStroke[]>(initialStrokes);
  const currentStrokeRef = useRef<StrokePoint[]>([]);

  const redrawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    strokesRef.current.forEach((stroke) => {
      if (stroke.points.length === 0) return;

      ctx.beginPath();
      ctx.strokeStyle = stroke.isEraser ? '#FFFFFF' : stroke.color;
      ctx.lineWidth = stroke.size;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      const first = stroke.points[0];
      ctx.moveTo(first.x * canvas.width, first.y * canvas.height);

      if (stroke.points.length === 1) {
        ctx.lineTo(first.x * canvas.width, first.y * canvas.height);
      } else {
        for (let i = 1; i < stroke.points.length; i++) {
          const pt = stroke.points[i];
          ctx.lineTo(pt.x * canvas.width, pt.y * canvas.height);
        }
      }
      ctx.stroke();
    });
  }, []);

  useEffect(() => {
    redrawCanvas();

    const handleDrawStroke = (stroke: DrawStroke) => {
      strokesRef.current.push(stroke);
      redrawCanvas();
    };

    const handleSyncStrokes = (strokes: DrawStroke[]) => {
      strokesRef.current = strokes;
      redrawCanvas();
    };

    const handleClearCanvas = () => {
      strokesRef.current = [];
      redrawCanvas();
    };

    socket.on('draw_stroke', handleDrawStroke);
    socket.on('sync_strokes', handleSyncStrokes);
    socket.on('canvas_clear', handleClearCanvas);

    return () => {
      socket.off('draw_stroke', handleDrawStroke);
      socket.off('sync_strokes', handleSyncStrokes);
      socket.off('canvas_clear', handleClearCanvas);
    };
  }, [redrawCanvas]);

  useEffect(() => {
    const handleResize = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      canvas.width = 900;
      canvas.height = 650;
      redrawCanvas();
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [redrawCanvas]);

  const getCoordinates = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>): StrokePoint | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;

    const rect = canvas.getBoundingClientRect();
    let clientX = 0;
    let clientY = 0;

    if ('touches' in e) {
      if (e.touches.length === 0) return null;
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    const x = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    const y = Math.max(0, Math.min(1, (clientY - rect.top) / rect.height));

    return { x, y };
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawer) return;
    const pt = getCoordinates(e);
    if (!pt) return;

    setIsDrawing(true);
    currentStrokeRef.current = [pt];

    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.beginPath();
        ctx.fillStyle = activeTool === 'eraser' ? '#FFFFFF' : currentColor;
        ctx.arc(pt.x * canvas.width, pt.y * canvas.height, brushSize / 2, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  };

  const drawMove = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawer || !isDrawing) return;
    const pt = getCoordinates(e);
    if (!pt) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const lastPt = currentStrokeRef.current[currentStrokeRef.current.length - 1];
    currentStrokeRef.current.push(pt);

    ctx.beginPath();
    ctx.strokeStyle = activeTool === 'eraser' ? '#FFFFFF' : currentColor;
    ctx.lineWidth = brushSize;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.moveTo(lastPt.x * canvas.width, lastPt.y * canvas.height);
    ctx.lineTo(pt.x * canvas.width, pt.y * canvas.height);
    ctx.stroke();
  };

  const endDrawing = () => {
    if (!isDrawer || !isDrawing) return;
    setIsDrawing(false);

    if (currentStrokeRef.current.length === 0) return;

    const newStroke: DrawStroke = {
      id: `${Date.now()}-${Math.random()}`,
      points: currentStrokeRef.current,
      color: currentColor,
      size: brushSize,
      isEraser: activeTool === 'eraser',
    };

    strokesRef.current.push(newStroke);
    socket.emit('draw_stroke', newStroke);
    currentStrokeRef.current = [];
  };

  const handleClear = () => {
    if (!isDrawer) return;
    strokesRef.current = [];
    redrawCanvas();
    socket.emit('canvas_clear');
  };

  const handleUndo = () => {
    if (!isDrawer) return;
    strokesRef.current.pop();
    redrawCanvas();
    socket.emit('draw_undo');
  };

  return (
    <div className="flex flex-col sm:flex-row w-full h-full gap-2 p-2 sm:p-3 overflow-hidden">
      {/* Left Toolbar (Horizontal on mobile/small screens, Vertical on larger screens) */}
      <div className={`flex sm:flex-col gap-2 sm:gap-4 p-2 sm:p-3 bg-[#f8fafc] border border-slate-200/90 rounded-2xl shadow-sm shrink-0 overflow-x-auto sm:overflow-visible items-center sm:items-stretch sm:w-36 ${!isDrawer ? 'opacity-40 pointer-events-none' : ''}`}>
        {/* Action Tools */}
        <div className="flex sm:flex-col gap-1 sm:gap-1.5 shrink-0">
          <button
            onClick={() => setActiveTool('pencil')}
            className={`flex items-center gap-1.5 sm:gap-2.5 px-2.5 py-1.5 sm:px-3 sm:py-2.5 rounded-xl font-bold text-xs transition ${
              activeTool === 'pencil'
                ? 'bg-blue-100 text-blue-700 shadow-sm'
                : 'text-slate-700 hover:bg-slate-200/60'
            }`}
          >
            <Pencil className="w-4 h-4 text-blue-600 shrink-0" />
            <span className="hidden sm:inline">Pencil</span>
          </button>

          <button
            onClick={() => setActiveTool('eraser')}
            className={`flex items-center gap-1.5 sm:gap-2.5 px-2.5 py-1.5 sm:px-3 sm:py-2.5 rounded-xl font-bold text-xs transition ${
              activeTool === 'eraser'
                ? 'bg-blue-100 text-blue-700 shadow-sm'
                : 'text-slate-700 hover:bg-slate-200/60'
            }`}
          >
            <Eraser className="w-4 h-4 text-slate-700 shrink-0" />
            <span className="hidden sm:inline">Eraser</span>
          </button>

          <button
            onClick={handleUndo}
            className="flex items-center gap-1.5 sm:gap-2.5 px-2.5 py-1.5 sm:px-3 sm:py-2.5 rounded-xl font-bold text-xs text-slate-700 hover:bg-slate-200/60 transition"
          >
            <Undo2 className="w-4 h-4 text-slate-700 shrink-0" />
            <span className="hidden sm:inline">Undo</span>
          </button>

          <button
            onClick={handleClear}
            className="flex items-center gap-1.5 sm:gap-2.5 px-2.5 py-1.5 sm:px-3 sm:py-2.5 rounded-xl font-bold text-xs text-slate-700 hover:bg-rose-50 hover:text-rose-600 transition"
          >
            <Trash2 className="w-4 h-4 shrink-0" />
            <span className="hidden sm:inline">Clear</span>
          </button>
        </div>

        {/* Divider */}
        <hr className="hidden sm:block border-slate-200" />
        <div className="h-6 w-[1px] bg-slate-200 sm:hidden shrink-0" />

        {/* Brush Size */}
        <div className="shrink-0">
          <span className="text-[10px] sm:text-[11px] font-bold text-slate-600 uppercase tracking-wider hidden sm:block mb-1 sm:mb-2">
            Size
          </span>
          <div className="flex items-center gap-1.5 sm:justify-around bg-white p-1 sm:p-2 rounded-xl border border-slate-200">
            {BRUSH_SIZES.map((item) => (
              <button
                key={item.size}
                onClick={() => setBrushSize(item.size)}
                className={`w-6 h-6 sm:w-7 sm:h-7 rounded-full flex items-center justify-center transition ${
                  brushSize === item.size
                    ? 'ring-2 ring-blue-500 bg-blue-50'
                    : 'hover:bg-slate-100'
                }`}
                title={item.label}
              >
                <div
                  className={`rounded-full ${
                    brushSize === item.size ? 'bg-blue-600' : 'bg-slate-700'
                  } ${item.circleSize}`}
                />
              </button>
            ))}
          </div>
        </div>

        {/* Divider */}
        <hr className="hidden sm:block border-slate-200" />
        <div className="h-6 w-[1px] bg-slate-200 sm:hidden shrink-0" />

        {/* Colors Palette */}
        <div className="shrink-0">
          <span className="text-[10px] sm:text-[11px] font-bold text-slate-600 uppercase tracking-wider hidden sm:block mb-1 sm:mb-2">
            Colors
          </span>
          <div className="flex sm:grid sm:grid-cols-3 gap-1.5 sm:gap-2">
            {COLORS.map((c) => (
              <button
                key={c}
                onClick={() => {
                  setCurrentColor(c);
                  setActiveTool('pencil');
                }}
                className={`w-6 h-6 sm:w-7 sm:h-7 rounded-full transition transform hover:scale-110 border shrink-0 ${
                  activeTool === 'pencil' && currentColor === c
                    ? 'scale-110 border-white ring-2 ring-blue-500 shadow-md'
                    : 'border-slate-300'
                }`}
                style={{ backgroundColor: c }}
                title={c}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Main Canvas Area */}
      <div className="flex-1 bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden relative cursor-crosshair min-h-0">
        <canvas
          ref={canvasRef}
          onMouseDown={startDrawing}
          onMouseMove={drawMove}
          onMouseUp={endDrawing}
          onMouseLeave={endDrawing}
          onTouchStart={startDrawing}
          onTouchMove={drawMove}
          onTouchEnd={endDrawing}
          className="w-full h-full block touch-none"
        />
      </div>
    </div>
  );
};
