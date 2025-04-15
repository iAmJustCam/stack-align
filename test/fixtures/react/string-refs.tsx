// test/fixtures/react/string-refs.tsx
// This file uses string refs which are deprecated in React 19

import React, { Component } from 'react';

export class LegacyRefComponent extends Component {
  handleClick() {
    // BAD: Using string refs - should be detected
    const inputNode = this.refs.inputRef;
    if (inputNode) {
      inputNode.focus();
    }
  }
  
  render() {
    return (
      <div>
        <input type="text" ref="inputRef" />
        <button onClick={() => this.handleClick()}>Focus Input</button>
      </div>
    );
  }
}