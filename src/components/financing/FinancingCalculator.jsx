// src/components/financing/FinancingCalculator.jsx
import React from 'react';
import { Calculator, DollarSign, Percent, Wallet, Calendar, XCircle } from 'lucide-react';
import { useFinancing } from '../../hooks/useFinancing';
import { formatCurrency } from '../../services/financingService';

export function FinancingCalculator() {
  const {
    price,
    setPrice,
    downPaymentPercent,
    downPaymentAmount,
    handlePercentChange,
    handleAmountChange,
    interestRate,
    setInterestRate,
    termMonths,
    setTermMonths,
    results,
    error,
    calculate,
    clearResults,
  } = useFinancing();

  const hasResults = results !== null || error !== '';

  const inputClass =
    'w-full px-3 py-1.5 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/30 text-sm focus:outline-none focus:ring-2 focus:ring-white/30 transition-all duration-200 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none';

  const labelClass = 'flex items-center gap-1.5 text-xs text-white/60 mb-1';

  const cardClass = 'bg-white/5 border border-white/10 rounded-xl p-3.5';

  return (
    <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-5 shadow-2xl space-y-3 max-w-md mx-auto">
      <div className="flex items-center gap-2 mb-1">
        <Calculator className="w-5 h-5 text-white" />
        <h2 className="text-lg font-medium text-white">Calculadora de financiamiento</h2>
      </div>

      <div className={cardClass}>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelClass}>
              <DollarSign className="w-3.5 h-3.5" aria-hidden="true" />
              Precio del vehículo
            </label>
            <input
              type="number"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className={inputClass}
              placeholder="Ej. 8000"
            />
          </div>
          <div>
            <label className={labelClass}>
              <Percent className="w-3.5 h-3.5" aria-hidden="true" />
              Tasa mensual
            </label>
            <input
              type="number"
              value={interestRate}
              onChange={(e) => setInterestRate(e.target.value)}
              className={inputClass}
              placeholder="Ej. 1.2"
              step="any"
            />
          </div>
        </div>
      </div>

      <div className={cardClass}>
        <label className={labelClass}>
          <Wallet className="w-3.5 h-3.5" aria-hidden="true" />
          Entrada
        </label>
        <div className="grid grid-cols-2 gap-3">
          {/* Primero el monto en dólares, luego el porcentaje */}
          <div>
            <input
              type="number"
              value={downPaymentAmount}
              onChange={(e) => handleAmountChange(e.target.value)}
              className={inputClass}
              placeholder="$"
              step="any"
            />
          </div>
          <div>
            <input
              type="number"
              value={downPaymentPercent}
              onChange={(e) => handlePercentChange(e.target.value)}
              className={inputClass}
              placeholder="%"
              step="any"
            />
          </div>
        </div>
        <div className="text-[10px] text-white/30 mt-1.5 text-center">
          {downPaymentPercent && downPaymentAmount && price > 0
            ? `${downPaymentPercent}% = ${formatCurrency(parseFloat(downPaymentAmount))}`
            : 'Ingrese % o monto'}
        </div>
      </div>

      <div className={cardClass}>
        <label className={labelClass}>
          <Calendar className="w-3.5 h-3.5" aria-hidden="true" />
          Plazo (meses)
        </label>
        <input
          type="number"
          value={termMonths}
          onChange={(e) => setTermMonths(e.target.value)}
          className={inputClass}
          placeholder="Ej. 36"
        />
      </div>

      <div className="flex gap-2">
        <button
          onClick={calculate}
          className="flex-1 py-2.5 bg-white/20 hover:bg-white/30 backdrop-blur-md text-white font-medium rounded-xl border border-white/30 shadow-lg transition-all duration-200 text-sm"
        >
          Calcular
        </button>
        {hasResults && (
          <button
            onClick={clearResults}
            className="py-2.5 px-4 bg-red-500/20 hover:bg-red-500/30 backdrop-blur-md text-red-300 font-medium rounded-xl border border-red-500/30 shadow-lg transition-all duration-200 text-sm flex items-center gap-1"
            title="Limpiar resultados"
          >
            <XCircle className="w-4 h-4" />
            Limpiar
          </button>
        )}
      </div>

      {/* Nuevo disclaimer */}
      <div className="text-[10px] text-white/30 text-center">
        Los cálculos son referenciales. Verifique los resultados antes de usarlos
      </div>

      {error && (
        <div className="bg-red-500/20 border border-red-500/30 text-red-300 px-4 py-2 rounded-xl text-sm">
          {error}
        </div>
      )}

      {results && !error && (
        <div className="space-y-2">
          <div
            className="rounded-xl p-4 text-center border"
            style={{
              background: 'linear-gradient(135deg, rgba(29,158,117,0.22), rgba(29,158,117,0.06))',
              borderColor: 'rgba(29,158,117,0.35)',
            }}
          >
            <div className="text-xs text-white/60 mb-1">Cuota mensual</div>
            <div className="text-2xl font-medium" style={{ color: '#5DCAA5' }}>
              {formatCurrency(results.monthlyPayment)}
            </div>
            <div className="text-xs text-white/40 mt-1">Plazo: {results.termMonths} meses</div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div className="bg-white/5 rounded-xl p-2 text-center">
              <div className="text-[10px] text-white/45 mb-1">Saldo</div>
              <div className="text-xs text-white font-medium">{formatCurrency(results.balance)}</div>
            </div>
            <div className="bg-white/5 rounded-xl p-2 text-center">
              <div className="text-[10px] text-white/45 mb-1">Interés total</div>
              <div className="text-xs text-white font-medium">
                {formatCurrency(results.interestTotal)}
              </div>
            </div>
            <div className="bg-white/5 rounded-xl p-2 text-center">
              <div className="text-[10px] text-white/45 mb-1">Total a pagar</div>
              <div className="text-xs text-white font-medium">
                {formatCurrency(results.totalPayable)}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}