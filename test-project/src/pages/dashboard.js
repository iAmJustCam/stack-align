// A Next.js page with issues to test healing
import React from 'react';
import scoreCard from '../components/scoreCard';

// Using Pages Router instead of App Router
// Using getServerSideProps instead of new data fetching patterns
export async function getServerSideProps() {
  const res = await fetch('https://api.example.com/scores');
  const data = await res.json();
  
  return {
    props: {
      scores: data,
    },
  };
}

// No TypeScript, no client/server indication
export default function Dashboard({ scores }) {
  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
      <h1 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '20px' }}>
        Your Learning Dashboard
      </h1>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
        {scores?.map((score) => (
          <scoreCard 
            key={score.id}
            title={score.title}
            description={score.description}
            initialScore={score.value}
          />
        ))}
      </div>
    </div>
  );
}