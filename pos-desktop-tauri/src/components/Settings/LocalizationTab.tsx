import React from 'react';
import { Globe, Coins, CheckCircle2, HelpCircle, Check } from 'lucide-react';
import { SUPPORTED_LANGUAGES, LanguageCode, setLanguage, useSettingsI18n } from '../../i18n';

interface LocalizationTabProps {
  currencySymbol: string;
  setCurrencySymbol: (val: string) => void;
  currencyDecimals: string;
  setCurrencyDecimals: (val: string) => void;
  currencyDecimalSeparator: string;
  setCurrencyDecimalSeparator: (val: string) => void;
  localeLang: string;
  setLocaleLang: (val: string) => void;
  onOpenInfo?: () => void;
}

export default function LocalizationTab({
  currencySymbol,
  setCurrencySymbol,
  currencyDecimals,
  setCurrencyDecimals,
  currencyDecimalSeparator,
  setCurrencyDecimalSeparator,
  localeLang,
  setLocaleLang,
  onOpenInfo,
}: LocalizationTabProps) {
  const t = useSettingsI18n();

  // Format sample value
  const sampleAmount = 1450.5;
  const decimals = parseInt(currencyDecimals, 10) || 2;
  const parts = sampleAmount.toFixed(decimals).split('.');
  const formattedSample = `${parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.')}${decimals > 0 ? currencyDecimalSeparator + parts[1] : ''} ${currencySymbol}`;

  const handleSelectLanguage = (code: LanguageCode) => {
    setLocaleLang(code);
    setLanguage(code);
  };

  return (
    <div
      key="localization"
      className="h-full flex flex-col justify-between space-y-4"
    >
      {/* Header */}
      <div className="shrink-0 flex items-center justify-between pb-2 border-b border-slate-200 dark:border-zinc-800">
        <div>
          <h2 className="text-lg font-black text-slate-900 dark:text-zinc-100 flex items-center gap-2.5">
            <Globe size={22} className="text-indigo-600 dark:text-indigo-400" />
            {t.localizationTitle || 'Localização, Moeda & Idioma'}
          </h2>
          <p className="text-xs text-slate-600 dark:text-zinc-300 font-medium mt-0.5">
            {t.localizationDesc || 'Ajuste os parâmetros regionais de moeda para o mercado Moçambicano (Meticais) e idioma do sistema.'}
          </p>
        </div>

        {onOpenInfo && (
          <button
            onClick={onOpenInfo}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-200 rounded-xl text-xs font-bold transition-all cursor-pointer border border-slate-200 dark:border-zinc-700"
          >
            <HelpCircle size={15} className="text-indigo-500" />
            <span>{t.helpGuide || 'Guia de Ajuda'}</span>
          </button>
        )}
      </div>

      {/* 2-Column Balanced Form Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 flex-1 min-h-0 overflow-y-auto">
        {/* Col 1: Moeda, Decimais & Idioma */}
        <div className="space-y-4 flex flex-col">
          {/* Idioma Selector Section */}
          <div className="p-4 bg-slate-50/80 dark:bg-zinc-950/40 rounded-2xl border border-slate-200 dark:border-zinc-800 space-y-3">
            <label className="block text-xs font-bold text-slate-900 dark:text-zinc-100">
              {t.interfaceLanguage || 'Idioma da Interface'}
            </label>
            <div className="grid grid-cols-2 gap-2">
              {SUPPORTED_LANGUAGES.map((l) => {
                const isSelected = localeLang === l.code;
                return (
                  <button
                    key={l.code}
                    type="button"
                    onClick={() => handleSelectLanguage(l.code as LanguageCode)}
                    className={`flex items-center justify-between p-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-indigo-50 dark:bg-indigo-950/60 border-indigo-500 text-indigo-700 dark:text-indigo-300 ring-2 ring-indigo-500/20'
                        : 'bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-800 text-slate-700 dark:text-zinc-300 hover:border-slate-300 dark:hover:border-zinc-700'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <span className="text-base">{l.flag}</span>
                      <span>{l.nativeName}</span>
                    </span>
                    {isSelected && <Check size={15} className="text-indigo-600 dark:text-indigo-400 shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Moeda & Decimais */}
          <div className="p-4 bg-slate-50/80 dark:bg-zinc-950/40 rounded-2xl border border-slate-200 dark:border-zinc-800 space-y-3.5 flex-1">
            <div>
              <label className="block text-xs font-bold text-slate-900 dark:text-zinc-100 mb-1.5">
                {t.currencySymbol || 'Símbolo da Moeda (Currency)'}
              </label>
              <input
                type="text"
                value={currencySymbol}
                onChange={(e) => setCurrencySymbol(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 focus:ring-2 focus:ring-indigo-500/30 outline-none text-slate-900 dark:text-zinc-100 font-extrabold text-sm"
                placeholder="Ex: MT, MZN, USD"
              />
              <span className="text-[11px] text-slate-500 dark:text-zinc-400 font-medium mt-1 block">
                {t.currencySymbolHelp || 'Sufixo exibido nos ecrãs de venda, talões térmicos e relatórios fiscais.'}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-900 dark:text-zinc-100 mb-1.5">
                  {t.decimalPlaces || 'Casas Decimais'}
                </label>
                <select
                  value={currencyDecimals}
                  onChange={(e) => setCurrencyDecimals(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-slate-900 dark:text-zinc-100 text-xs font-bold outline-none cursor-pointer"
                >
                  <option value="0">{t.decimalPlacesOption0 || '0 (Sem cêntimos - Ex: 1.450 MT)'}</option>
                  <option value="2">{t.decimalPlacesOption2 || '2 (Padrão - Ex: 1.450,50 MT)'}</option>
                  <option value="3">{t.decimalPlacesOption3 || '3 (Combustíveis/Granel)'}</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-900 dark:text-zinc-100 mb-1.5">
                  {t.decimalSeparator || 'Separador Decimal'}
                </label>
                <select
                  value={currencyDecimalSeparator}
                  onChange={(e) => setCurrencyDecimalSeparator(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-slate-900 dark:text-zinc-100 text-xs font-bold outline-none cursor-pointer"
                >
                  <option value=",">{t.decimalSepComma || 'Vírgula ( , ) - Padrão MZ/PT'}</option>
                  <option value=".">{t.decimalSepDot || 'Ponto ( . ) - Padrão Internacional'}</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Col 2: Exemplo ao Vivo */}
        <div className="space-y-4 flex flex-col justify-between">
          <div className="p-5 bg-indigo-500/5 dark:bg-indigo-500/10 rounded-2xl border border-indigo-500/20 flex-1 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 pb-2 border-b border-indigo-500/20 mb-3">
                <Coins size={16} className="text-indigo-600 dark:text-indigo-400" />
                <h3 className="text-xs font-black text-indigo-900 dark:text-indigo-300 uppercase tracking-wider">
                  {t.visualFormattingDemo || 'Demonstração da Formatação Visual'}
                </h3>
              </div>

              <p className="text-xs text-slate-600 dark:text-zinc-300 leading-relaxed mb-4">
                {t.formattingDemoText || 'Veja abaixo como qualquer valor monetário (exemplo de 1450.50) aparecerá para o operador nos botões de venda, recibos e relatórios de fecho de turno:'}
              </p>

              <div className="p-4 rounded-xl bg-white dark:bg-zinc-900 border border-indigo-200 dark:border-indigo-900/60 shadow-sm flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-500 dark:text-zinc-400 block">{t.formattedExample || 'Exemplo Formatado'}</span>
                  <span className="text-2xl font-black font-mono text-indigo-600 dark:text-indigo-400 tracking-tight">
                    {formattedSample}
                  </span>
                </div>
                <div className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
                  <CheckCircle2 size={24} />
                </div>
              </div>
            </div>

            <div className="p-3 bg-slate-100 dark:bg-zinc-900/80 rounded-xl text-[11px] text-slate-600 dark:text-zinc-400 font-medium mt-4">
              {t.mozambiqueConventionNote || 'Nota: O sistema utiliza automaticamente a convenção Moçambicana onde os milhares são separados por ponto e os cêntimos por vírgula.'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
