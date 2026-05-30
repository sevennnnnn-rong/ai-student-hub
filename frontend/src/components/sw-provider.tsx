'use client';

import { useEffect } from 'react';
import { registerServiceWorker } from './service-worker-registration';

export function SWProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    registerServiceWorker();
  }, []);

  return <>{children}</>;
}
