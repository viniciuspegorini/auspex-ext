import React from "react";

interface CardProps {
  title: string;
  description?: string;
  footer?: string;
  children?: React.ReactNode;
}

export const Card: React.FC<CardProps> = ({ title, description, footer, children }) => {
  return (
    <div className="w-full max-w-sm rounded-2xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-sm flex flex-col justify-between transition hover:shadow-md">
      {/* Cabeçalho com borda e fundo */}
      <div className="bg-gray-100 dark:bg-gray-800 px-4 py-2 border-b border-gray-300 dark:border-gray-700 rounded-t-2xl">
        <h2 className="text-sm font-medium text-gray-800 dark:text-gray-100">{title}</h2>
        {description && (
          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">{description}</p>
        )}
      </div>

      {/* Conteúdo */}
      <div className="p-4">
        {children}
      </div>

      {/* Rodapé opcional */}
      {footer && (
        <div className="px-4 py-2 border-t border-gray-300 dark:border-gray-700 text-xs text-gray-500 dark:text-gray-400">
          {footer}
        </div>
      )}
    </div>
  );
};
