// src/services/financingService.js

/**
 * Calcula el interés total y la cuota mensual
 * @param {number} balance - Saldo a financiar
 * @param {number} monthlyRate - Tasa mensual en porcentaje (ej. 1.2)
 * @param {number} termMonths - Plazo en meses
 * @returns {object} { interestTotal, monthlyPayment }
 */
export function calculateFinancing(balance, monthlyRate, termMonths) {
  const rate = monthlyRate / 100;
  const interestTotal = balance * rate * termMonths;
  const monthlyPayment = (balance + interestTotal) / termMonths;
  return { interestTotal, monthlyPayment };
}

/**
 * Formatea un número como moneda (USD)
 * @param {number} value
 * @returns {string} Ej. "$1,234.56"
 */
export function formatCurrency(value) {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value);
}