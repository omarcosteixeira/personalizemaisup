
import React, { useState, useEffect } from 'react';
import { 
  FileSpreadsheet, 
  Maximize, 
  Grid, 
  Info, 
  ArrowRightLeft, 
  Copy,
  ChevronRight,
  Calculator,
  Layout
} from 'lucide-react';
import { storage } from '../services/storageService';

const SheetCalculator: React.FC = () => {
  // Inputs
  const [sheetWidth, setSheetWidth] = useState<number>(33); // A3+ standard
  const [sheetHeight, setSheetHeight] = useState<number>(48);
  const [artWidth, setArtWidth] = useState<number>(5);
  const [artHeight, setArtHeight] = useState<number>(5);
  const [targetQuantity, setTargetQuantity] = useState<number>(100);

  // Margins
  const margin = 1; // 1cm margin as requested

  // Calculations
  const [results, setResults] = useState({
    usableWidth: 0,
    usableHeight: 0,
    fitA: 0,
    fitB: 0,
    bestFit: 0,
    totalSheets: 0,
    isRotated: false,
    totalArts: 0
  });

  useEffect(() => {
    calculate();
  }, [sheetWidth, sheetHeight, artWidth, artHeight, targetQuantity]);

  const calculate = () => {
    // Usable area (1cm margin on all sides)
    const uW = Math.max(0, sheetWidth - (margin * 2));
    const uH = Math.max(0, sheetHeight - (margin * 2));

    // Orientation A (Regular)
    const horizontalA = Math.floor(uW / artWidth);
    const verticalA = Math.floor(uH / artHeight);
    const totalA = horizontalA * verticalA;

    // Orientation B (Rotated art)
    const horizontalB = Math.floor(uW / artHeight);
    const verticalB = Math.floor(uH / artWidth);
    const totalB = horizontalB * verticalB;

    const best = Math.max(totalA, totalB);
    const rotated = totalB > totalA;
    const sheetsNeeded = best > 0 ? Math.ceil(targetQuantity / best) : 0;

    setResults({
      usableWidth: uW,
      usableHeight: uH,
      fitA: totalA,
      fitB: totalB,
      bestFit: best,
      totalSheets: sheetsNeeded,
      isRotated: rotated,
      totalArts: sheetsNeeded * best
    });
  };

  const settings = storage.getSettings();
  const primaryColor = settings.theme.primaryColor;

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200">
        <div className="flex items-center gap-3 mb-8">
          <div className="p-3 bg-indigo-600 rounded-2xl text-white shadow-lg">
            <FileSpreadsheet className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-800">Aproveitamento de Folha</h3>
            <p className="text-sm text-slate-500">Otimize sua produção calculando a quantidade exata de folhas.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          {/* Inputs Section */}
          <div className="space-y-6">
            <div className="bg-slate-50 p-6 rounded-[32px] border border-slate-100 space-y-6">
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Dimensões (em cm)</h4>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-600">Largura Folha</label>
                  <input 
                    type="number" 
                    value={sheetWidth} 
                    onChange={e => setSheetWidth(parseFloat(e.target.value) || 0)}
                    className="w-full p-3 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 font-bold"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-600">Altura Folha</label>
                  <input 
                    type="number" 
                    value={sheetHeight} 
                    onChange={e => setSheetHeight(parseFloat(e.target.value) || 0)}
                    className="w-full p-3 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-200">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-600">Largura Arte</label>
                  <input 
                    type="number" 
                    value={artWidth} 
                    onChange={e => setArtWidth(parseFloat(e.target.value) || 0)}
                    className="w-full p-3 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 font-bold"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-600">Altura Arte</label>
                  <input 
                    type="number" 
                    value={artHeight} 
                    onChange={e => setArtHeight(parseFloat(e.target.value) || 0)}
                    className="w-full p-3 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 font-bold"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-600">Quantidade Desejada (Total de Artes)</label>
                  <input 
                    type="number" 
                    value={targetQuantity} 
                    onChange={e => setTargetQuantity(parseInt(e.target.value) || 0)}
                    className="w-full p-3 bg-indigo-50 border border-indigo-100 text-indigo-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 font-black text-lg"
                  />
                </div>
              </div>
            </div>

            <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100 flex items-start gap-3">
              <Info className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
              <p className="text-xs text-amber-700 leading-relaxed font-medium">
                O cálculo respeita automaticamente a margem de <strong>1cm superior e lateral</strong> (total de 2cm descontados na largura e altura) para garantir a área de sangria e pinça.
              </p>
            </div>
          </div>

          {/* Results Section */}
          <div className="space-y-6">
            <div className="bg-indigo-900 rounded-[40px] p-8 text-white shadow-2xl relative overflow-hidden flex flex-col justify-center">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 blur-2xl"></div>
              
              <div className="relative z-10 space-y-8">
                <div className="text-center">
                  <p className="text-indigo-300 text-xs font-black uppercase tracking-[0.2em] mb-2">Total de Folhas Necessárias</p>
                  <h2 className="text-6xl font-black">{results.totalSheets}</h2>
                  <p className="text-indigo-300 text-[10px] font-bold mt-2">Folhas de {sheetWidth}x{sheetHeight}cm</p>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-8 border-t border-white/10">
                  <div className="p-4 bg-white/5 rounded-2xl text-center">
                    <p className="text-indigo-400 text-[9px] font-black uppercase tracking-widest mb-1">Artes p/ Folha</p>
                    <p className="text-2xl font-black">{results.bestFit}</p>
                  </div>
                  <div className="p-4 bg-white/5 rounded-2xl text-center">
                    <p className="text-indigo-400 text-[9px] font-black uppercase tracking-widest mb-1">Aproveitamento</p>
                    <p className="text-sm font-bold flex items-center justify-center gap-1">
                      {results.isRotated ? (
                        <>Rotacionado <ArrowRightLeft className="w-3 h-3" /></>
                      ) : (
                        <>Normal <Layout className="w-3 h-3" /></>
                      )}
                    </p>
                  </div>
                </div>

                <div className="p-4 bg-white/10 rounded-2xl border border-white/5 space-y-1">
                  <div className="flex justify-between text-xs font-bold">
                    <span className="text-indigo-300">Área Útil:</span>
                    <span>{results.usableWidth.toFixed(1)} x {results.usableHeight.toFixed(1)} cm</span>
                  </div>
                  <div className="flex justify-between text-xs font-bold">
                    <span className="text-indigo-300">Total de Artes Produzidas:</span>
                    <span>{results.totalArts} unidades</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-[32px] border border-slate-100 flex items-center justify-between group cursor-pointer hover:border-indigo-200 transition-all">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl">
                  <Calculator className="w-6 h-6" />
                </div>
                <div>
                  <h5 className="text-sm font-bold text-slate-800">Usar no Orçamentista</h5>
                  <p className="text-[10px] text-slate-400 uppercase font-black">Transferir dados de custo</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-300 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        </div>
      </div>

      {/* Visual Simulation Concept */}
      <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200">
        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
          <Grid className="w-4 h-4 text-indigo-500" /> Prévia Visual do Aproveitamento
        </h4>
        
        <div className="flex items-center justify-center py-10 bg-slate-50 rounded-[40px] border border-dashed border-slate-200 min-h-[400px]">
          <div 
            className="bg-white shadow-2xl border border-slate-300 relative transition-all duration-500 flex items-center justify-center overflow-hidden"
            style={{
              width: `${sheetWidth * 6}px`, // Scaled for UI
              height: `${sheetHeight * 6}px`,
              maxHeight: '350px',
              maxWidth: '300px'
            }}
          >
            {/* Margin Guide */}
            <div 
              className="absolute inset-0 border border-indigo-200 bg-indigo-50/10 pointer-events-none"
              style={{ margin: `${margin * 6}px` }}
            ></div>

            {/* Imposition Grid */}
            <div 
              className="grid gap-1 p-1 items-center justify-center"
              style={{
                gridTemplateColumns: `repeat(${results.isRotated ? Math.floor(results.usableWidth / artHeight) : Math.floor(results.usableWidth / artWidth)}, 1fr)`,
                padding: `${margin * 6}px`
              }}
            >
              {Array.from({ length: Math.min(results.bestFit, 100) }).map((_, i) => (
                <div 
                  key={i} 
                  className="bg-indigo-600/20 border border-indigo-600/40 rounded-sm"
                  style={{
                    width: `${(results.isRotated ? artHeight : artWidth) * 4}px`,
                    height: `${(results.isRotated ? artWidth : artHeight) * 4}px`
                  }}
                ></div>
              ))}
            </div>
            
            {results.bestFit > 100 && (
              <div className="absolute inset-0 flex items-center justify-center bg-white/80 backdrop-blur-sm p-4 text-center">
                <p className="text-xs font-black text-indigo-900">+ de 100 artes p/ folha</p>
              </div>
            )}
            
            {results.bestFit === 0 && (
              <div className="absolute inset-0 flex items-center justify-center p-4 text-center">
                <p className="text-xs font-bold text-slate-300">Arte maior que a folha</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SheetCalculator;
