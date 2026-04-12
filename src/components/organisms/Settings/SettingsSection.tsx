import React from "react";

interface Props {
  title: string;
  description?: string;
  children: React.ReactNode;
  danger?: boolean;
}

export default function SettingsSection({ title, description, children, danger = false }: Props) {
  return (
    <div className={`p-6 border rounded-2xl shadow-sm ${danger ? 'bg-red-50/30 border-red-100' : 'bg-white border-gray-100'}`}>
      <div className="mb-6">
        <h3 className={`text-lg font-bold ${danger ? 'text-red-700' : 'text-gray-900'}`}>{title}</h3>
        {description && (
          <p className="text-sm text-blue-600/80 font-medium mt-1.5">{description}</p>
        )}
      </div>
      <div>
        {children}
      </div>
    </div>
  );
}
