// test/fixtures/react/find-dom-node.tsx
// This file uses ReactDOM.findDOMNode which is deprecated in React 19

import React, { Component } from 'react';
import ReactDOM from 'react-dom';

export class LegacyComponent extends Component {
  componentDidMount() {
    // BAD: Using findDOMNode - should be detected
    const node = ReactDOM.findDOMNode(this);
    if (node) {
      node.scrollIntoView();
    }
  }
  
  render() {
    return <div className="legacy-component">Legacy Component</div>;
  }
}