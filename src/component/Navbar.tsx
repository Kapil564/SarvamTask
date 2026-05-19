import React from 'react'
import './Navbar.css'

type ToggleOption = 'playground' | 'model-diff'

type NavbarProps = {
  active: ToggleOption
  onToggle: (option: ToggleOption) => void
}

const Navbar: React.FC<NavbarProps> = ({ active, onToggle }) => {
  const handleKeyDown = (e: React.KeyboardEvent, current: ToggleOption) => {
    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
      e.preventDefault();
      const target = current === 'playground' ? 'model-diff' : 'playground';
      onToggle(target);
      // Wait for React to render, then set focus
      setTimeout(() => {
        const nextTab = document.getElementById(`tab-${target}`);
        nextTab?.focus();
      }, 0);
    }
  };
  return (
    <header className="navbar">
      <div className="navbar__inner">
        <div className="navbar__brand">Dashboard</div>

        <div className="navbar__controls">
          <div className="toggle" role="tablist" aria-label="Application View">
            <button
              id="tab-playground"
              role="tab"
              className={`toggle__btn ${active === 'playground' ? 'active' : ''}`}
              onClick={() => onToggle('playground')}
              aria-selected={active === 'playground'}
              tabIndex={active === 'playground' ? 0 : -1}
              onKeyDown={(e) => handleKeyDown(e, 'playground')}
            >
              Playground
            </button>

            <button
              id="tab-model-diff"
              role="tab"
              className={`toggle__btn ${active === 'model-diff' ? 'active' : ''}`}
              onClick={() => onToggle('model-diff')}
              aria-selected={active === 'model-diff'}
              tabIndex={active === 'model-diff' ? 0 : -1}
              onKeyDown={(e) => handleKeyDown(e, 'model-diff')}
            >
              Model Diff
            </button>
          </div>
        </div>
      </div>
    </header>
  )
}

export default Navbar
