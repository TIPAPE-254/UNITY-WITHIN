import React from 'react';

interface NotificationCardProps {
  title: string;
  body: string;
  theme?: 'white' | 'pink' | 'black';
}

const themeStyles = {
  white: 'bg-white text-black border-pink-100',
  pink: 'bg-pink-50 text-pink-700 border-pink-200',
  black: 'bg-black text-white border-black',
};

export const NotificationCard: React.FC<NotificationCardProps> = ({ title, body, theme = 'white' }) => {
  return (
    <div
      className={`rounded-2xl border shadow-md p-6 max-w-md mx-auto my-4 flex flex-col gap-2 transition-all duration-300 ${themeStyles[theme]}`}
      style={{ boxShadow: theme === 'pink' ? '0 2px 16px 0 #fbcfe8' : theme === 'black' ? '0 2px 16px 0 #18181b' : '0 2px 16px 0 #f3f4f6' }}
    >
      <h2 className="font-bold text-lg mb-1 tracking-tight">{title}</h2>
      <p className="text-base leading-relaxed">{body}</p>
    </div>
  );
};
