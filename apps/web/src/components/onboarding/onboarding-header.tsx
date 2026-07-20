'use client';

import { Button } from '@dhanam-core/ui';
import { useRouter } from 'next/navigation';

import { useAuth } from '@/lib/hooks/use-auth';

export function OnboardingHeader() {
  const { user, logout } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    router.push('/');
  };

  return (
    <header className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">D</span>
              </div>
            </div>
            <div className="ml-3">
              <span className="text-xl font-semibold text-gray-900">Dhanam</span>
              <span className="ml-2 text-sm text-gray-500">Configuración</span>
            </div>
          </div>

          {/* User info and actions */}
          <div className="flex items-center space-x-4">
            <div className="text-right">
              <p className="text-sm text-gray-900">{user?.name}</p>
              <p className="text-xs text-gray-500">{user?.email}</p>
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="text-gray-600 hover:text-gray-900"
            >
              Salir
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
