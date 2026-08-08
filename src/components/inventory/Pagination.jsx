import React from 'react';

export function Pagination({ currentPage, totalPages, onPageChange }) {
  if (totalPages <= 1) return null;

  const pages = [];
  const maxVisible = 5;
  let start = Math.max(1, currentPage - Math.floor(maxVisible / 2));
  let end = Math.min(totalPages, start + maxVisible - 1);
  if (end - start + 1 < maxVisible) {
    start = Math.max(1, end - maxVisible + 1);
  }

  for (let i = start; i <= end; i++) {
    pages.push(i);
  }

  return (
    <div className="flex flex-wrap items-center justify-center gap-2 mt-6">
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="px-3 py-1.5 bg-white/10 backdrop-blur-sm hover:bg-white/20 disabled:opacity-30 disabled:cursor-not-allowed text-white rounded-lg border border-white/20 transition text-sm"
      >
        Anterior
      </button>

      {start > 1 && (
        <>
          <button
            onClick={() => onPageChange(1)}
            className="px-3 py-1.5 bg-white/10 backdrop-blur-sm hover:bg-white/20 text-white rounded-lg border border-white/20 transition text-sm"
          >
            1
          </button>
          {start > 2 && <span className="text-white/40 text-sm">...</span>}
        </>
      )}

      {pages.map((page) => (
        <button
          key={page}
          onClick={() => onPageChange(page)}
          className={`px-3 py-1.5 rounded-lg border transition text-sm ${
            page === currentPage
              ? 'bg-white/30 border-white/40 text-white font-semibold'
              : 'bg-white/10 backdrop-blur-sm hover:bg-white/20 text-white/70 border-white/20'
          }`}
        >
          {page}
        </button>
      ))}

      {end < totalPages && (
        <>
          {end < totalPages - 1 && <span className="text-white/40 text-sm">...</span>}
          <button
            onClick={() => onPageChange(totalPages)}
            className="px-3 py-1.5 bg-white/10 backdrop-blur-sm hover:bg-white/20 text-white rounded-lg border border-white/20 transition text-sm"
          >
            {totalPages}
          </button>
        </>
      )}

      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="px-3 py-1.5 bg-white/10 backdrop-blur-sm hover:bg-white/20 disabled:opacity-30 disabled:cursor-not-allowed text-white rounded-lg border border-white/20 transition text-sm"
      >
        Siguiente
      </button>
    </div>
  );
}