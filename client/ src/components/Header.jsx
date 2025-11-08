import React from 'react'
export default function Header({ onRefresh }) {
  return (<header className="header"><h1>MindsEye Agentic</h1><div className="spacer" />
    <button onClick={onRefresh}>Refresh</button>
    <a className="github" href="https://github.com/" target="_blank" rel="noreferrer">GitHub</a></header>)
}
