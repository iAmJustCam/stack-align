# Component Transformation Example

This document showcases how the Healer system transforms a React component with various issues into a component that follows best practices.

## Original Component

```jsx
// A component with various issues
import React from 'react'
import { useState, useEffect } from 'react'

function userCard(props) {
  const [userData, setUserData] = useState(null)
  const [loading, setLoading] = useState(true)
  
  // Missing dependency array
  useEffect(() => {
    fetch(`/api/users/${props.userId}`)
      .then(res => res.json())
      .then(data => {
        setUserData(data)
        setLoading(false)
      })
  })
  
  function buttonClick() {
    props.onSelectUser(props.userId)
  }
  
  return (
    <div style={{padding: '16px', border: '1px solid #eee', borderRadius: '4px'}}>
      {loading ? (
        <p>Loading user data...</p>
      ) : (
        <>
          <h3 style={{margin: '0 0 8px 0'}}>{userData.name}</h3>
          <p style={{color: '#666'}}>{userData.email}</p>
          <button onClick={buttonClick}>Select User</button>
        </>
      )}
    </div>
  )
}

export default userCard
```

## Issues Detected

The Healer system identifies the following issues:

1. **Component File Name**: Should use kebab-case (user-card.tsx)
2. **Missing "use client" Directive**: Required for client-side components
3. **Component Name**: Should use PascalCase (UserCard)
4. **Missing React.FC Type**: Should define component type
5. **useEffect Dependency Array**: Missing dependency array with props.userId
6. **Event Handler Naming**: Should use handleClick instead of buttonClick
7. **Inline Styles**: Should use Tailwind CSS classes
8. **Default Export**: Should use named export
9. **Props Destructuring**: Should destructure props in parameters

## Transformed Component

```tsx
"use client";

import React, { useState, useEffect } from 'react';
import { cn } from "@/utils/cn";

export const UserCard: React.FC<UserCardProps> = ({ 
  userId, 
  onSelectUser 
}) => {
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Now with proper dependency array
  useEffect(() => {
    fetch(`/api/users/${userId}`)
      .then(res => res.json())
      .then(data => {
        setUserData(data);
        setLoading(false);
      });
  }, [userId]);
  
  const handleClick = () => {
    onSelectUser(userId);
  };
  
  return (
    <div className={cn(
      "p-4 border border-gray-200 rounded",
      "hover:shadow-md transition-all duration-300"
    )}>
      {loading ? (
        <p className="text-gray-500">Loading user data...</p>
      ) : (
        <>
          <h3 className="text-lg font-bold mb-2">{userData?.name}</h3>
          <p className="text-gray-600">{userData?.email}</p>
          <button 
            onClick={handleClick}
            className={cn(
              "mt-4 px-4 py-2 rounded",
              "bg-blue-600 text-white",
              "hover:bg-blue-700 transition-colors"
            )}
          >
            Select User
          </button>
        </>
      )}
    </div>
  );
};

// Types added
interface UserCardProps {
  userId: string;
  onSelectUser: (id: string) => void;
}

interface UserData {
  name: string;
  email: string;
  // other user data properties
}
```

## Transformation Details

### 1. File Naming
- Changed from `userCard.jsx` to `user-card.tsx`
- Added TypeScript support

### 2. Component Structure
- Added "use client" directive at the top
- Changed component name to PascalCase (UserCard)
- Added React.FC type with Props interface
- Changed to named export
- Destructured props in the parameters

### 3. React Best Practices
- Added dependency array to useEffect
- Renamed event handler to follow handleXxx convention
- Added proper TypeScript types for useState generics
- Added optional chaining for safer access to userData properties

### 4. Styling Improvements
- Replaced inline styles with Tailwind CSS classes
- Used cn utility for class name composition
- Added hover states and transitions

## How Transformations Are Applied

The healer performs transformations in this order:

1. TypeScript transformations (types, interfaces)
2. React transformations (hooks, component patterns)
3. Next.js transformations (directives, routing)
4. Tailwind transformations (styling)
5. File renaming (if needed)

Each transformation is validated to ensure it produces valid code before moving to the next step. If any transformation fails, the system attempts fallback approaches or gracefully skips the transformation while logging the issue.

This approach ensures that components are gradually improved while maintaining functionality and code quality.