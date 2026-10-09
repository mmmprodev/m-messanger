import React from 'react';

interface AvatarProps {
  name: string;
  avatarUrl?: string;
  color?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  isOnline?: boolean;
  className?: string;
}

const GRADIENT_PALETTES = [
  'from-violet-600 to-indigo-600',
  'from-fuchsia-600 to-pink-600',
  'from-purple-600 to-cyan-500',
  'from-emerald-500 to-teal-600',
  'from-amber-500 to-rose-600',
  'from-blue-600 to-violet-600',
  'from-pink-500 to-rose-500'
];

function getGradient(name: string): string {
  let hash = 0;
  for (let i = 0; i < (name || '').length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return GRADIENT_PALETTES[Math.abs(hash) % GRADIENT_PALETTES.length];
}

export const Avatar: React.FC<AvatarProps> = ({
  name,
  avatarUrl,
  color,
  size = 'md',
  isOnline,
  className = ''
}) => {
  const getInitials = (str: string) => {
    if (!str) return '?';
    const parts = str.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return str.slice(0, 2).toUpperCase();
  };

  const sizeClasses = {
    sm: 'w-9 h-9 text-xs',
    md: 'w-12 h-12 text-sm',
    lg: 'w-14 h-14 text-base font-semibold',
    xl: 'w-20 h-20 text-2xl font-bold'
  };

  const dotSizeClasses = {
    sm: 'w-2.5 h-2.5 border',
    md: 'w-3.5 h-3.5 border-2',
    lg: 'w-4 h-4 border-2',
    xl: 'w-5 h-5 border-2'
  };

  const gradient = getGradient(name || '');

  return (
    <div className={`relative flex-shrink-0 inline-block select-none ${className}`}>
      {avatarUrl ? (
        <img
          src={avatarUrl}
          alt={name}
          className={`${sizeClasses[size]} rounded-2xl object-cover shadow-md ring-1 ring-white/10`}
        />
      ) : (
        <div
          className={`${sizeClasses[size]} rounded-2xl flex items-center justify-center font-bold text-white shadow-md bg-gradient-to-tr ${gradient} ring-1 ring-white/15`}
          style={color && !color.startsWith('#65') ? { backgroundColor: color } : undefined}
        >
          {getInitials(name)}
        </div>
      )}

      {isOnline !== undefined && (
        <span
          className={`absolute -bottom-0.5 -right-0.5 rounded-full border-black/40 ${
            dotSizeClasses[size]
          } ${
            isOnline
              ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]'
              : 'bg-zinc-500'
          }`}
          title={isOnline ? 'Onlayn' : 'Oflayn'}
        />
      )}
    </div>
  );
};
