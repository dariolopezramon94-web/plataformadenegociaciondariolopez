// src/hooks/useFinancing.js
import { useState, useCallback } from 'react';
import {
  calculateFinancing,
} from '../services/financingService';

export function useFinancing() {
  const [price, setPrice] = useState('');
  const [downPaymentPercent, setDownPaymentPercent] = useState('');
  const [downPaymentAmount, setDownPaymentAmount] = useState('');
  const [interestRate, setInterestRate] = useState('1.2');
  const [termMonths, setTermMonths] = useState('36');
  const [results, setResults] = useState(null);
  const [error, setError] = useState('');

  const handleAmountChange = (amountStr) => {
    const amount = parseFloat(amountStr);
    setDownPaymentAmount(amountStr);
    if (!isNaN(amount) && amount >= 0 && price > 0) {
      const percent = (amount / price) * 100;
      setDownPaymentPercent(percent > 100 ? '100' : percent.toFixed(1));
    } else if (amountStr === '') {
      setDownPaymentPercent('');
    }
  };

  const handlePercentChange = (percentStr) => {
    const percent = parseFloat(percentStr);
    setDownPaymentPercent(percentStr);
    if (!isNaN(percent) && percent >= 0 && percent <= 100 && price > 0) {
      const amount = (price * percent) / 100;
      setDownPaymentAmount(amount.toFixed(0));
    } else if (percentStr === '') {
      setDownPaymentAmount('');
    }
  };

  const calculate = useCallback(() => {
    setError('');
    setResults(null);

    const priceNum = parseFloat(price);
    const downAmount = parseFloat(downPaymentAmount);
    const rate = parseFloat(interestRate);
    const term = parseInt(termMonths);

    if (isNaN(priceNum) || priceNum <= 0) {
      setError('Ingrese un precio válido mayor a 0');
      return;
    }
    if (isNaN(rate) || rate <= 0) {
      setError('La tasa de interés debe ser mayor a 0');
      return;
    }
    if (isNaN(term) || term <= 0) {
      setError('El plazo debe ser mayor a 0');
      return;
    }
    if (isNaN(downAmount) || downAmount < 0) {
      setError('Ingrese una entrada válida');
      return;
    }
    if (downAmount >= priceNum) {
      setError('La entrada no puede ser mayor o igual al precio');
      return;
    }

    const balance = priceNum - downAmount;
    if (balance <= 0) {
      setError('El saldo a financiar debe ser mayor a 0');
      return;
    }

    const { interestTotal, monthlyPayment } = calculateFinancing(balance, rate, term);
    setResults({
      balance,
      interestTotal,
      totalPayable: balance + interestTotal,
      monthlyPayment,
      termMonths: term,
    });
  }, [price, downPaymentAmount, interestRate, termMonths]);

  // Función para limpiar resultados y errores
  const clearResults = useCallback(() => {
    setResults(null);
    setError('');
  }, []);

  return {
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
  };
}