import type { PropsWithChildren } from 'react';
import { Navbar } from './Navbar';

export function AppShell({ children }: PropsWithChildren) {
  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="page-shell py-8">{children}</main>
    </div>
  );
}
