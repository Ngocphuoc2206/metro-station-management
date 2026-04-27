import React from "react";

interface Props {
  title: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  icon?: React.ReactNode;
  danger?: boolean;
}

export default function SettingsToggle({ title, description, checked, onChange, icon, danger = false }: Props) {
  return (
    <div className={`flex items-center justify-between py-6 ${!danger ? 'border-b border-gray-100 last:border-0' : ''}`}>
      <div className="flex items-start gap-4 pr-6">
        {icon && (
          <div className="mt-0.5 w-10 h-10 rounded-full flex items-center justify-center shrink-0 shadow-sm border border-gray-50">
            {icon}
          </div>
        )}
        <div className="flex flex-col gap-1">
          <h4 className={`text-sm font-bold ${danger ? 'text-red-600' : 'text-gray-900'}`}>{title}</h4>
          <p className={`text-xs ${danger ? 'text-red-500 uppercase tracking-wide font-bold mt-1' : 'text-gray-500 font-medium'}`}>
            {description}
          </p>
        </div>
      </div>

      <button
        type="button"
        className="shrink-0 relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        style={{ backgroundColor: checked ? (danger ? '#EF4444' : '#2563EB') : '#E5E7EB' }}
        onClick={() => onChange(!checked)}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
            checked ? "translate-x-6" : "translate-x-1"
          }`}
        />
      </button>
    </div>
  );
}
