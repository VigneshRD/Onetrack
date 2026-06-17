// hooks/useGrapesEditor.js
// React hook that initialises GrapesJS and wires up all storage/event logic
// Mirrors the full editor.init() + event listeners from the Phalcon view

import { useEffect, useRef, useState, useCallback } from 'react';
import grapesjs from 'grapesjs';
import 'grapesjs/dist/css/grapes.min.css';
import { getStyleManagerSectors } from '../utils/styleManagerConfig';
import { CANVAS_STYLES, CANVAS_SCRIPTS, FONTS } from '../utils/fonts';
import { registerBlocks } from '../utils/registerBlocks';
import { registerComponents } from '../utils/registerComponents';
import {
  loadBuilderData,
  loadWorkspace,
  saveWorkspace,
  publishTemplate,
  uploadAsset,
  deleteAsset,
} from '../api/builderApi';

const ASSET_BASE = import.meta.env.VITE_API_BASE_URL || '/portal_assets/grapesjs';

export function useGrapesEditor({ containerId = 'gjs', initialWorkspace = 'workspace1', initialActive = 'N' } = {}) {
  const editorRef = useRef(null);
  const [workspace, setWorkspace] = useState(initialWorkspace);
  const [active, setActive] = useState(initialActive);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null); // { message, type }

  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  // ── Initialise editor ────────────────────────────────────────────────────
  useEffect(() => {
    if (editorRef.current) return; // already initialised

    const editor = grapesjs.init({
      showOffsets: 1,
      noticeOnUnload: 0,
      container: `#${containerId}`,
      height: '100%',
      fromElement: false,
      allowScripts: 1,

      // Storage: we handle load/store manually via React state + API calls
      // The storageManager is disabled; we call editor.load() / editor.store() ourselves
      storageManager: false,

      assetManager: {
        uploadFile: async (e) => {
          const files = e.dataTransfer ? e.dataTransfer.files : e.target.files;
          setLoading(true);
          try {
            const result = await uploadAsset(files, workspace);
            if (result.type === 'success') {
              editor.AssetManager.add(result.data);
              await _saveWorkspace(editor, workspace, 'no-autosave');
            } else {
              alert(result.message);
            }
          } catch {
            alert('Something went wrong uploading file.');
          } finally {
            setLoading(false);
          }
        },
      },

      selectorManager: { componentFirst: true },
      styleManager: { sectors: getStyleManagerSectors() },

      canvas: {
        styles: [
          ...CANVAS_STYLES,
          `${ASSET_BASE}/css/bootstrap.min.css`,
          `${ASSET_BASE}/css/style.css`,
          `${ASSET_BASE}/css/font.css`,
          `${ASSET_BASE}/css/swiper-bundle.min.css`,
        ],
        scripts: [
          ...CANVAS_SCRIPTS,
          `${ASSET_BASE}/js/script.js`,
          `${ASSET_BASE}/js/swiper-bundle.min.js`,
        ],
      },

      plugins: ['gjs-blocks-basic'],
      pluginsOpts: {
        'gjs-blocks-basic': {
          blocks: ['text', 'video', 'link'],
          category: 'Basic',
        },
      },

      domComponents: { storeWrapper: 1 },
    });

    // ── Register custom style type: trait view as style sector ─────────────
    editor.StyleManager.addType('configure', {
      create() { return editor.TraitManager.render(); },
      emit() {}, update() {}, destroy() {},
    });

    editor.StyleManager.addSector('configure', {
      name: 'Configure',
      open: true,
      properties: [{ property: '', label: '', type: 'configure' }],
    }, { at: 0 });

    editor.StyleManager.addSector('css-selector', {
      name: 'CSS Selector',
      open: false,
      properties: [{ property: '', label: '', type: 'class-selector' }],
    }, { at: 0 });

    // ── Register custom blocks and component types ──────────────────────────
    registerBlocks(editor);
    registerComponents(editor);

    // ── Auto-open style panel on component select ──────────────────────────
    editor.on('component:selected', () => {
      editor.Panels.getButton('views', 'open-sm')?.set('active', 1);
    });

    // ── Asset remove ───────────────────────────────────────────────────────
    editor.AssetManager.getAll().on('remove', async (asset) => {
      setLoading(true);
      try {
        const result = await deleteAsset(asset.get('src'), workspace);
        if (result.type === 'success') {
          await _saveWorkspace(editor, workspace, 'no-autosave');
        } else {
          editor.AssetManager.add({ src: asset.get('src') });
          alert(result.message);
        }
      } catch {
        editor.AssetManager.add({ src: asset.get('src') });
        alert('Something went wrong deleting asset.');
      } finally {
        setLoading(false);
      }
    });

    // ── Fix image removal inside <a> ───────────────────────────────────────
    editor.on('component:remove', (removed) => {
      if (removed.get('type') === 'image') {
        const parent = removed.parent();
        if (parent?.get('tagName') === 'a') parent.remove();
      }
    });

    // ── Tracking history toggle (component:add) ───────────────────────────
    editor.on('component:add', (comp) => {
      const el = comp.getEl();
      if (!el) return;
      if (el.classList?.contains('tracking-history-container')) {
        const items = el.querySelectorAll('.tracking_history_records .tracking-item');
        const btn = el.querySelector('.toggle-tracking-btn');
        if (!items.length || !btn) return;
        items.forEach((item, i) => { if (i > 1) item.style.display = 'none'; });
        let expanded = false;
        btn.addEventListener('click', () => {
          expanded = !expanded;
          items.forEach((item, i) => { if (i > 1) item.style.display = expanded ? 'block' : 'none'; });
          btn.textContent = expanded ? 'Show Less' : 'Show More';
        });
      }
    });

    editorRef.current = editor;

    // Initial load
    _loadWorkspaceData(editor, initialWorkspace, setLoading, setActive, setWorkspace);

    return () => {
      editor.destroy();
      editorRef.current = null;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Public API ────────────────────────────────────────────────────────────

  const handleSave = useCallback(async () => {
    const editor = editorRef.current;
    if (!editor) return;
    setLoading(true);
    try {
      await _saveWorkspace(editor, workspace, 'no-autosave');
      showToast('Saved successfully', 'success');
    } catch {
      showToast('Save failed', 'error');
    } finally {
      setLoading(false);
    }
  }, [workspace, showToast]);

  const handlePublish = useCallback(async () => {
    const editor = editorRef.current;
    if (!editor) return;
    setLoading(true);
    try {
      const data = _getEditorData(editor);
      await publishTemplate(data, workspace);
      // Also save to workspace store
      await _saveWorkspace(editor, workspace, 'no-autosave');
      setActive('Y');
      showToast('Published successfully! Your page is now live.', 'success');
    } catch {
      showToast('Publish failed', 'error');
    } finally {
      setLoading(false);
    }
  }, [workspace, showToast]);

  const handleClear = useCallback(() => {
    const editor = editorRef.current;
    if (!editor) return;
    editor.DomComponents.clear();
    editor.CssComposer.clear();
  }, []);

  const handleWorkspaceLoad = useCallback(async (newWorkspace) => {
    const editor = editorRef.current;
    if (!editor) return;
    setLoading(true);
    try {
      const data = await loadWorkspace(newWorkspace);
      _applyEditorData(editor, data);
      setWorkspace(newWorkspace);
    } catch {
      showToast('Failed to load workspace', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  const handleWorkspaceClone = useCallback(async (sourceWorkspace) => {
    const editor = editorRef.current;
    if (!editor) return;
    setLoading(true);
    try {
      const data = await loadWorkspace(sourceWorkspace);
      _applyEditorData(editor, data);
      // Don't change current workspace label — just clone content
    } catch {
      showToast('Failed to clone workspace', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  const handleLoadDefault = useCallback(async (layoutId) => {
    const editor = editorRef.current;
    if (!editor) return;
    setLoading(true);
    try {
      const data = await loadBuilderData(layoutId);
      _applyEditorData(editor, data);
    } catch {
      showToast('Failed to load layout', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  return {
    editorRef,
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
  };
}

// ── Internal helpers ─────────────────────────────────────────────────────────

function _getEditorData(editor) {
  return {
    html: editor.getHtml(),
    css: editor.getCss(),
    components: JSON.stringify(editor.getComponents()),
    styles: JSON.stringify(editor.getStyle()),
    assets: JSON.stringify(editor.AssetManager.getAll().toJSON()),
  };
}

function _applyEditorData(editor, data) {
  if (!data) return;
  if (data.components) editor.setComponents(JSON.parse(data.components));
  if (data.styles) editor.setStyle(JSON.parse(data.styles));
  if (data.assets) editor.AssetManager.add(JSON.parse(data.assets));
}

async function _saveWorkspace(editor, workspace, saveType = 'autosave') {
  const data = _getEditorData(editor);
  return saveWorkspace(data, workspace, saveType);
}

async function _loadWorkspaceData(editor, workspace, setLoading, setActive, setWorkspace) {
  setLoading(true);
  try {
    const data = await loadBuilderData(workspace);
    _applyEditorData(editor, data);
    if (data.workspace) setWorkspace(data.workspace);
    if (data.active) setActive(data.active);
  } catch (e) {
    console.error('Failed to load builder data', e);
  } finally {
    setLoading(false);
  }
}
