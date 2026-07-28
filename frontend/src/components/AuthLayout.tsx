import { ReactNode } from 'react';

export function AuthLayout({ children, title }: { children: ReactNode; title: string }) {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-xl shadow-lg p-8">
          <h1 className="text-2xl font-bold text-center mb-6 text-gray-800">{title}</h1>
          {children}
        </div>
      </div>
    </div>
  );
}
