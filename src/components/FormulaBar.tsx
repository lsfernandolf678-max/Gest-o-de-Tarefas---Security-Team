/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

interface FormulaBarProps {
  coordinate: string;
  value: string;
  onChange: (val: string) => void;
  disabled: boolean;
  placeholder?: string;
}

export default function FormulaBar({
  coordinate,
  value,
  onChange,
  disabled,
  placeholder = "Digite o valor ou texto para a célula selecionada..."
}: FormulaBarProps) {
  return (
    <div id="excel-formula-bar" className="flex items-center h-9 bg-slate-100 border-b border-slate-300 px-3 py-1 text-xs select-none">
      {/* Coordinate Input Indicator (e.g. B2, C14) */}
      <div 
        id="formula-cell-coord" 
        className="flex items-center justify-center bg-white border border-slate-300 text-slate-700 font-mono font-bold px-2.5 h-full rounded shadow-sm min-w-[50px] text-center"
        title="Célula ativa"
      >
        {coordinate || '---'}
      </div>

      {/* Divider */}
      <div className="h-4 w-[1px] bg-slate-300 mx-2.5" />

      {/* Function FX Label */}
      <div 
        className="flex items-center space-x-1 pr-2 text-slate-500 font-serif italic font-bold select-none"
        title="Inserir função / Editar Conteúdo"
      >
        <span className="text-emerald-700 text-sm">f</span>
        <span className="text-emerald-700 text-xs mr-1">x</span>
      </div>

      {/* Divider */}
      <div className="h-5 w-[1px] bg-slate-300 mr-2.5" />

      {/* Actual text input for editing cell value */}
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        placeholder={disabled ? "Selecione uma célula na planilha para editar" : placeholder}
        className="flex-1 bg-white border border-slate-300 rounded px-2.5 h-full text-slate-800 font-sans focus:outline-none focus:ring-1 focus:ring-emerald-600 focus:border-emerald-600 shadow-inner disabled:bg-slate-50 disabled:text-slate-400 disabled:shadow-none transition-all"
      />
    </div>
  );
}
