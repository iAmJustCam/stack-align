// test/fixtures/tailwind/deprecated-utilities.tsx
// This file uses deprecated Tailwind utilities

import React from 'react';

export function NotificationBanner({ message }: { message: string }) {
  return (
    // BAD: Using deprecated utilities - should be detected
    <div className="flex bg-red-100 text-red-800 p-4 rounded shadow-sm">
      <span className="inline-block align-middle mr-2">
        <svg className="h-6 w-6 fill-current" viewBox="0 0 24 24">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z" />
        </svg>
      </span>
      <p className="text-base">{message}</p>
    </div>
  );
}