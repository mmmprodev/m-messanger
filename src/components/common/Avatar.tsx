import React from 'react';

interface AvatarProps {
  name: string;
  avatarUrl?: string;
  color?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  isOnline?: boolean;
  className?: string;
}

export const Avatar: React.FC<AvatarProps> = ({
  name,
  avatarUrl,
  color = '#65aadd',
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
    sm: 'w-8 h-8 text-xs',
    md: 'w-12 h-12 text-base',
    lg: 'w-14 h-14 text-lg',
    xl: 'w-20 h-20 text-2xl font-semibold'
  };

  const dotSizeClasses = {
    sm: 'w-2.5 h-2.5 border',
    md: 'w-3.5 h-3.5 border-2',
    lg: 'w-4 h-4 border-2',
    xl: 'w-5 h-5 border-2'
  };

  return (
    <div className={`relative flex-shrink-0 inline-block select-none ${className}`}>
      {avatarUrl ? (
        <img
          src={avatarUrl}
          alt={name}
          className={`${sizeClasses[size]} rounded-full object-cover shadow-sm`}
        />
      ) : (
        <div
          className={`${sizeClasses[size]} rounded-full flex items-center justify-center font-medium text-white shadow-sm`}
          style={{ backgroundColor: color }}
        >
          {getInitials(name)}
        </div>
      )}

      {isOnline !== undefined && (
        <span
          className={`absolute bottom-0 right-0 rounded-full border-[#17212b] ${
            dotSizeClasses[size]
          } ${isOnline ? 'bg-[#4fae4e]' : 'bg-[#708499]'}`}
          title={isOnline ? 'Onlayn' : 'Oflayn'}
        />
      )}
    </div>
  );
};
