import React from 'react';
import { useAuth } from '@/context/AuthContext';

/**
 * The signed-in user's avatar — their uploaded picture when there is one, a
 * gradient initial otherwise.
 *
 * `className` controls size and shape (pass e.g. `w-8 h-8 rounded-full`).
 * `textClassName` sizes the fallback initial.
 */
export const UserAvatar = ({ className = '', textClassName = 'text-xs', name }) => {
  const { user, avatarUrl } = useAuth();
  const letter = (name ?? user?.fullName ?? user?.name ?? 'D').trim().charAt(0).toUpperCase() || 'D';

  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt="Your profile picture"
        draggable={false}
        className={`object-cover bg-slate-100 ${className}`}
      />
    );
  }

  return (
    <div
      className={`bg-gradient-to-br from-brand-violet to-indigo-600 text-white flex items-center justify-center font-bold ${textClassName} ${className}`}
    >
      {letter}
    </div>
  );
};
