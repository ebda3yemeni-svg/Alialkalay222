import React, { useState } from 'react';
import { FamilyTreeNode } from '../types.ts';
import {
  Printer,
  X,
  FileText,
  Maximize2,
  Sliders,
  Download,
  Sparkles,
  Check,
  TreePine,
} from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

interface PrintFamilyTreeModalProps {
  isOpen: boolean;
  onClose: () => void;
  treeData: FamilyTreeNode[];
}

export const PrintFamilyTreeModal: React.FC<PrintFamilyTreeModalProps> = ({
  isOpen,
  onClose,
  treeData,
}) => {
  const [paperSize, setPaperSize] = useState<'A4' | 'A3' | 'A2' | 'A1' | 'Poster'>('A3');
  const [orientation, setOrientation] = useState<'landscape' | 'portrait'>('landscape');
  const [scale, setScale] = useState<number>(100);
  const [exportingPdf, setExportingPdf] = useState<boolean>(false);

  if (!isOpen) return null;

  const paperDimensions: Record<string, string> = {
    A4: '210mm × 297mm',
    A3: '297mm × 420mm',
    A2: '420mm × 594mm',
    A1: '594mm × 841mm',
    Poster: '841mm × 1189mm (بوستر عملاق)',
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExportPDF = async () => {
    try {
      setExportingPdf(true);
      const element = document.getElementById('printable-tree-stage');
      if (!element) return;

      const canvas = await html2canvas(element, {
        scale: 2.5,
        useCORS: true,
        backgroundColor: '#FFFFFF',
      });

      const imgData = canvas.toDataURL('image/png');
      const pdfOrientation = orientation === 'landscape' ? 'l' : 'p';
      const pdf = new jsPDF(pdfOrientation, 'mm', paperSize.toLowerCase() as any);

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();

      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`موسوعة_أنساب_بني_علي_الكلعي_${paperSize}_${orientation}.pdf`);
    } catch (err) {
      console.error('PDF Export Error:', err);
    } finally {
      setExportingPdf(false);
    }
  };

  const renderPrintNode = (node: FamilyTreeNode, level: number = 0) => {
    return (
      <div key={node.id} className="flex flex-col items-center relative my-2">
        <div className="px-3.5 py-2 rounded-xl bg-white border-2 border-[#1A2A40] text-[#1A2A40] min-w-[160px] max-w-[220px] text-center shadow-xs">
          <div className="font-bold text-xs font-amiri leading-snug text-[#1A2A40] whitespace-normal break-words">
            {node.fullName}
          </div>
          <div className="text-[10px] text-[#C5A059] font-bold mt-0.5">
            الجيل {node.generation}
          </div>
        </div>

        {node.children && node.children.length > 0 && (
          <div className="flex flex-col items-center w-full">
            <div className="w-0.5 h-6 bg-[#1A2A40]" />
            <div className="flex items-start justify-center gap-6 sm:gap-8 pt-1 border-t-2 border-[#1A2A40] relative">
              {node.children.map((c) => (
                <div key={c.id} className="relative pt-2">
                  <div className="absolute top-0 right-1/2 left-1/2 w-0.5 h-2 -translate-x-1/2 bg-[#1A2A40]" />
                  {renderPrintNode(c, level + 1)}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-fadeIn">
      <div className="relative w-full max-w-5xl bg-[#F7F5F2] rounded-3xl shadow-2xl border border-[#C5A059]/40 overflow-hidden flex flex-col text-right my-auto max-h-[95vh]">
        
        {/* Header */}
        <div className="bg-[#1A2A40] text-white p-5 sm:p-6 border-b border-[#C5A059]/40 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-[#243B55] border border-[#C5A059]/40 text-[#C5A059]">
              <Printer className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold font-amiri text-xl text-[#C5A059]">إعدادات طباعة وتصدير شجرة العائلة احترافياً</h3>
              <p className="text-xs text-gray-300">تجهيز المخطط للطباعة الورقية عالية الدقة أو التصدير بصيغة PDF</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-full bg-[#243B55] hover:bg-[#2C4A6B] text-gray-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Options Toolbar */}
        <div className="p-4 bg-white border-b border-gray-200 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-bold shrink-0">
          
          {/* Paper Size */}
          <div className="space-y-1">
            <label className="text-gray-600 block">مقاس الورقة:</label>
            <select
              value={paperSize}
              onChange={(e) => setPaperSize(e.target.value as any)}
              className="w-full p-2 rounded-xl bg-gray-50 border border-gray-300 font-bold text-gray-800 focus:outline-none focus:border-[#C5A059]"
            >
              <option value="A4">A4 (قياسي)</option>
              <option value="A3">A3 (متوسط)</option>
              <option value="A2">A2 (كبير)</option>
              <option value="A1">A1 (معماري كبير)</option>
              <option value="Poster">Poster (بوستر معرض عملاق)</option>
            </select>
            <span className="text-[10px] text-[#C5A059] block">{paperDimensions[paperSize]}</span>
          </div>

          {/* Orientation */}
          <div className="space-y-1">
            <label className="text-gray-600 block">اتجاه الطباعة:</label>
            <div className="grid grid-cols-2 gap-2 pt-0.5">
              <button
                type="button"
                onClick={() => setOrientation('landscape')}
                className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                  orientation === 'landscape'
                    ? 'bg-[#1A2A40] text-[#C5A059] border-[#C5A059]'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                أفقي (Landscape)
              </button>
              <button
                type="button"
                onClick={() => setOrientation('portrait')}
                className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                  orientation === 'portrait'
                    ? 'bg-[#1A2A40] text-[#C5A059] border-[#C5A059]'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                عمودي (Portrait)
              </button>
            </div>
          </div>

          {/* Scale */}
          <div className="space-y-1">
            <div className="flex justify-between text-gray-600">
              <label>مقیاس التكبير / التصغير:</label>
              <span>{scale}%</span>
            </div>
            <input
              type="range"
              min="40"
              max="180"
              value={scale}
              onChange={(e) => setScale(Number(e.target.value))}
              className="w-full accent-[#C5A059] mt-2 cursor-pointer"
            />
          </div>
        </div>

        {/* Printable Stage Preview Box */}
        <div className="flex-1 overflow-auto p-6 bg-gray-200/60 flex items-center justify-center min-h-[350px]">
          <div
            id="printable-tree-stage"
            style={{
              transform: `scale(${scale / 100})`,
              transformOrigin: 'top center',
            }}
            className="bg-white p-12 rounded-2xl shadow-xl border-2 border-black text-black space-y-8 min-w-[750px] transition-transform duration-200"
          >
            {/* Print Header Watermark */}
            <div className="text-center space-y-1 border-b-2 border-black pb-4">
              <div className="flex items-center justify-center gap-2 text-black font-amiri font-bold text-2xl">
                <TreePine className="w-6 h-6 text-[#1A2A40]" />
                موسوعة أنساب بني علي الكلعي
              </div>
              <p className="text-xs font-bold text-gray-700">
                مخطط الشجرة الموثق رسمياً • المقاس: {paperSize} ({orientation === 'landscape' ? 'أفقي' : 'عمودي'})
              </p>
            </div>

            {/* Tree Chart */}
            <div className="flex items-start justify-center pt-4">
              {treeData.map((root) => renderPrintNode(root))}
            </div>

            {/* Print Footer */}
            <div className="pt-6 border-t border-gray-300 flex items-center justify-between text-[11px] text-gray-600 font-bold">
              <span>تاريخ الطباعة: {new Date().toLocaleDateString('ar-SA')}</span>
              <span>حقوق التوثيق محفوظة لموسوعة أنساب بني علي الكلعي</span>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-white border-t border-gray-200 flex items-center justify-between gap-3 shrink-0">
          <span className="text-xs text-gray-500 font-bold hidden sm:inline">
            جاهز للطباعة المباشرة على جميع أنواع الطابعات والمطابع
          </span>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              onClick={handleExportPDF}
              disabled={exportingPdf}
              className="flex-1 sm:flex-initial px-5 py-2.5 rounded-2xl bg-[#1A2A40] hover:bg-[#243B55] text-[#C5A059] font-bold text-xs shadow transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              <span>{exportingPdf ? 'جاري تجهيز PDF...' : 'حفظ كـ ملف PDF عالية الدقة'}</span>
            </button>

            <button
              onClick={handlePrint}
              className="flex-1 sm:flex-initial px-6 py-2.5 rounded-2xl bg-[#C5A059] hover:bg-[#D4B16A] text-[#1A2A40] font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
            >
              <Printer className="w-4 h-4" />
              <span>طباعة مباشرة</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
