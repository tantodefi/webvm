'use client';

interface SmallButtonProps {
  icon: string;
  onClick: () => void;
  tooltip?: string;
  className?: string;
}

export default function SmallButton({ icon, onClick, tooltip, className = '' }: SmallButtonProps) {
  return (
    <button
      onClick={onClick}
      title={tooltip}
      className={`w-8 h-8 rounded-lg flex items-center justify-center hover:bg-neutral-600 ${className}`}
    >
      <i className={`fas ${icon} text-sm text-white`}></i>
    </button>
  );
} 