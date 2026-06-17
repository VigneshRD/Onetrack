// pages/BuilderPage.jsx
// React equivalent of the Phalcon builder view + controller
// Renders the full GrapesJS page builder as a Shopify Public App page
 
import { useState, useEffect, useRef } from 'react';
import { useGrapesEditor } from '../hooks/useGrapesEditor.js';
import { ChangeTemplateModal, ReplicateTemplateModal } from '../components/TemplateModal';
import { TEMPLATES } from '../utils/fonts';
import { fetchBuilderState } from "../api/builderApi.js";
import "../styles/builder.css";   
        
export default function BuilderPage() {
  // State mirroring the Phalcon controller variables: workspace, active, userid
  const [initialState, setInitialState] = useState(null); // { workspace, active, userId }
  const [stateLoading, setStateLoading] = useState(true);

  const [showChangeTemplate, setShowChangeTemplate] = useState(false);
  const [showReplicateTemplate, setShowReplicateTemplate] = useState(false);

  // Load initial builder state from backend (mirrors builderAction() logic)
  useEffect(() => {
    fetchBuilderState() 
      .then((state) => setInitialState(state))
      .catch(() => setInitialState({ workspace: 'workspace1', active: 'N', userId: '' }))
      .finally(() => setStateLoading(false));
  }, []);

  if (stateLoading || !initialState) {
    return <LoadingSpinner />;
  }

  return (
    <BuilderEditor
      initialWorkspace={initialState.workspace}
      initialActive={initialState.active}
      userId={initialState.userId}
      showChangeTemplate={showChangeTemplate}
      setShowChangeTemplate={setShowChangeTemplate}
      showReplicateTemplate={showReplicateTemplate}
      setShowReplicateTemplate={setShowReplicateTemplate}
    />
  );
}

// ── Inner editor component (needs initialState before mounting) ──────────────
function BuilderEditor({
  initialWorkspace,
  initialActive,
  userId,
  showChangeTemplate,
  setShowChangeTemplate,
  showReplicateTemplate,
  setShowReplicateTemplate,
}) {
  const {
    workspace,
    active,
    loading,
    toast,
    handleSave,
    handlePublish,
    handleClear,
    handleWorkspaceLoad,
    handleWorkspaceClone,
    handleLoadDefault,
  } = useGrapesEditor({
    containerId: 'gjs',
    initialWorkspace,
    initialActive,
  });

  const templateName = TEMPLATES[workspace] || workspace;

  return (
    <div className="builder-root">
      {/* ── Loading overlay (mirrors #loading div) ── */}
      {loading && <LoadingOverlay />}

      {/* ── Toast notifications (mirrors Toastify + SweetAlert) ── */}
      {toast && (
        <div className={`builder-toast builder-toast--${toast.type}`}>
          {toast.message}
        </div>
      )}

      {/* ── Top toolbar (mirrors .gjs-pn-newbtn + options panel) ── */}
      <div className="builder-toolbar gjs-one-bg gjs-two-color">
        {/* Back button */}
        <button
          className="builder-btn builder-btn--ghost"
          onClick={() => window.history.back()}
        >
          ← Back
        </button>

        {/* Workspace label (mirrors #workspace_show) */}
        <span className="builder-workspace-label">
          {templateName && `: ${templateName}`}
          {active === 'Y' && <span className="builder-live-badge">● Live</span>}
        </span>

        {/* Change Template button */}
        <button
          className="builder-btn builder-btn--ghost"
          onClick={() => setShowChangeTemplate(true)}
        >
          Change Template
        </button>

        {/* Replicate Template button */}
        <button
          className="builder-btn builder-btn--ghost"
          onClick={() => setShowReplicateTemplate(true)}
        >
          Replicate a Template
        </button>

        <div className="builder-toolbar-spacer" />

        {/* Clear button */}
        <button
          className="builder-btn builder-btn--ghost"
          onClick={handleClear}
        >
          Clear
        </button>

        {/* Save button */}
        <button
          className="builder-btn builder-btn--secondary"
          onClick={handleSave}
          disabled={loading}
        >
          Save
        </button>

        {/* Publish button */}
        <button
          className="builder-btn builder-btn--primary"
          onClick={handlePublish}
          disabled={loading}
          title="Make this your live tracking page"
        >
          Publish
        </button>
      </div>

      {/* ── GrapesJS editor container (mirrors #gjs div) ── */}
      <div className="builder-editor-wrap">
        <div id="gjs" style={{ height: '100%', overflow: 'hidden' }} />
      </div>

      {/* ── Modals ── */}
      <ChangeTemplateModal
        isOpen={showChangeTemplate}
        onClose={() => setShowChangeTemplate(false)}
        currentWorkspace={workspace}
        activeStatus={active}
        onLoadWorkspace={(ws) => {
          if (ws === null) handleLoadDefault(''); // load active template
          else handleWorkspaceLoad(ws);
        }}
      />

      <ReplicateTemplateModal
        isOpen={showReplicateTemplate}
        onClose={() => setShowReplicateTemplate(false)}
        onLoadDefault={handleLoadDefault}
        onCloneWorkspace={handleWorkspaceClone}
      />
    </div>
  );
}

function LoadingSpinner() {
  return (
    <div className="builder-init-loading">
      <div className="builder-init-spinner" />
    </div>
  );
}

function LoadingOverlay() {
  return (
    <div className="builder-loading-overlay">
      <div className="builder-loading-container">
        <div className="builder-loading-circle" />
      </div>
    </div>
  );
}
