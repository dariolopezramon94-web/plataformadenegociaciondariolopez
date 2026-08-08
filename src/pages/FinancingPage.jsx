// src/pages/FinancingPage.jsx
import React from 'react';
import { FinancingCalculator } from '../components/financing/FinancingCalculator';

export function FinancingPage() {
  return (
    <div className="max-w-md mx-auto">
      <FinancingCalculator />
    </div>
  );
}