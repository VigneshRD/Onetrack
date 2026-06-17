// components/TemplateModal.jsx
// Mirrors the templateModal() and template1Modal() functions from the Phalcon view

import { TEMPLATES } from '../utils/fonts';

const ASSET_BASE = import.meta.env.VITE_API_BASE_URL || '/portal_assets/grapesjs';

const DEFAULT_LAYOUTS = [
  { id: 1, label: 'Layout 1', img: `${ASSET_BASE}/img/default1.jpeg` },
  { id: 2, label: 'Layout 2', img: `${ASSET_BASE}/img/default2.jpg` },
  { id: 3, label: 'Layout 3', img: `${ASSET_BASE}/img/default3.png` },
];

const TEMPLATE_THUMB = `${ASSET_BASE}/img/template.jpg`;

// ── Change Template Modal ────────────────────────────────────────────────────
export function ChangeTemplateModal({ isOpen, onClose, currentWorkspace, activeStatus, onLoadWorkspace }) {
  if (!isOpen) return null;

  return (
    <div className="builder-modal-overlay" onClick={onClose}>
      <div className="builder-modal" onClick={(e) => e.stopPropagation()}>
        <div className="builder-modal-header">
          <h3>Your Templates</h3>
          <button className="builder-modal-close" onClick={onClose}>×</button>
        </div>
        <div className="builder-modal-body">
          <div className="gjs-blocks-c">
            {activeStatus === 'Y' && (
              <div
                className="gjs-block template-card"
                onClick={() => { onLoadWorkspace(null); onClose(); }}
              >
                <img width="100%" src={TEMPLATE_THUMB} alt="Active Template" />
                <h3>Active Template</h3>
              </div>
            )}
            {Object.entries(TEMPLATES).map(([key, label]) => (
              <div
                key={key}
                className={`gjs-block template-card ${currentWorkspace === key ? 'active-workspace' : ''}`}
                onClick={() => { onLoadWorkspace(key); onClose(); }}
              >
                <img width="100%" src={TEMPLATE_THUMB} alt={label} />
                <h3>{label}</h3>
                {currentWorkspace === key && <span className="current-badge">Current</span>}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Replicate Template Modal ─────────────────────────────────────────────────
export function ReplicateTemplateModal({ isOpen, onClose, onLoadDefault, onCloneWorkspace }) {
  if (!isOpen) return null;

  return (
    <div className="builder-modal-overlay" onClick={onClose}>
      <div className="builder-modal" onClick={(e) => e.stopPropagation()}>
        <div className="builder-modal-header">
          <h3>Replicate a Template</h3>
          <button className="builder-modal-close" onClick={onClose}>×</button>
        </div>
        <div className="builder-modal-body">
          <p className="builder-modal-section-title">Default Layouts</p>
          <div className="gjs-blocks-c">
            {DEFAULT_LAYOUTS.map((layout) => (
              <div
                key={layout.id}
                className="gjs-block template-card"
                onClick={() => { onLoadDefault(layout.id); onClose(); }}
              >
                <img width="100%" src={layout.img} alt={layout.label} />
                <h3>{layout.label}</h3>
              </div>
            ))}
          </div>

          <hr className="builder-modal-divider" />
          <p className="builder-modal-section-title">Your Templates</p>
          <div className="gjs-blocks-c">
            {Object.entries(TEMPLATES).map(([key, label]) => (
              <div
                key={key}
                className="gjs-block template-card"
                onClick={() => { onCloneWorkspace(key); onClose(); }}
              >
                <img width="100%" src={TEMPLATE_THUMB} alt={label} />
                <h3>{label}</h3>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
