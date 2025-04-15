// test/fixtures/nextjs/sync-layout-cookies.tsx
// This file uses cookies() in a non-async layout function

import { cookies } from 'next/headers';

// BAD: Using cookies() in a non-async function - should be detected
export default function RootLayout({ children }: { children: React.ReactNode }) {
  // Access cookies synchronously (should be async)
  const cookieStore = cookies();
  const theme = cookieStore.get('theme')?.value || 'light';
  
  return (
    <html lang="en" data-theme={theme}>
      <body>{children}</body>
    </html>
  );
}