"use client";
// A React component with various issues that need fixing
import React from 'react'
import { useState, useEffect } from 'react'

export function ScoreCard(props) {
  const [score, setScore] = useState(props.initialScore || 0)
  const [loading, setLoading] = useState(false)
  
  // Missing dependency array
  useEffect(() => {
    setLoading(true)
    fetch(`/api/scores/${props.gameId}`)
      .then(res => res.json())
      .then(data => {
        setScore(data.score)
        setLoading(false)
      })
  }, [props.gameId])
  
  // Not using destructured props
  function handleIncrement() {
    setScore(props.increment + score)
  }
  
  // Event handler should be named onXxx
  function scoreReset() {
    setScore(0)
  }
  
  // Inline styles instead of Tailwind
  return (
    <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '16px', border: '1px solid #eee'}}>
      {loading ? (
        <div>Loading score...</div>
      ) : (
        <>
          <h3 style={{fontSize: '18px', fontWeight: 'bold', margin: '0 0 8px 0'}}>Game Score</h3>
          <div style={{fontSize: '24px', fontWeight: 'bold'}}>{score}</div>
          <div class="score-controls">
            <button onClick={handleIncrement} style={{marginRight: '8px'}}>+{props.increment}</button>
            <button onClick={scoreReset}>Reset</button>
          </div>
        </>
      )}
    </div>
  )
}
