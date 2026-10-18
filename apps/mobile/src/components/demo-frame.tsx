import type { ReactNode } from 'react';

/** Only the browser demo adds a frame; see demo-frame.web.tsx. */
export function DemoFrame({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
