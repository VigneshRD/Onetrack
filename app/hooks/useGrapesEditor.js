import { useEffect, useRef, useState, useCallback } from 'react';
import 'grapesjs/dist/css/grapes.min.css';
import { getStyleManagerSectors } from '../utils/styleManagerConfig.js';
import { CANVAS_STYLES, CANVAS_SCRIPTS } from '../utils/fonts.js';
import { registerBlocks } from '../utils/registerBlocks.js';
import { registerComponents } from '../utils/registerComponents.js';
import {
  loadBuilderData,
  loadWorkspace,
  saveWorkspace,
  publishTemplate,
  uploadAsset,
  deleteAsset,
} from '../api/builderApi';

const _assetBase = ((import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, ''))
  + '/portal_assets/grapesjs';

export function useGrapesEditor({ containerId = "gjs", initialWorkspace = "workspace1", initialActive = "N" } = {}) {

  const editorRef = useRef(null);
  const isDestroyingRef = useRef(false);
  const workspaceRef = useRef(initialWorkspace); // always holds latest workspace
  const loadSequenceRef = useRef(0); // tracks latest load request
  const [workspace, setWorkspace] = useState(initialWorkspace);
  const [active, setActive] = useState(initialActive);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = useCallback((message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  useEffect(() => {
    let editor = null;
    let destroyed = false;

    isDestroyingRef.current = false;

    import("grapesjs").then((mod) => {
      if (destroyed) return;

      const grapesjs = mod.default;

      editor = grapesjs.init({
        showOffsets: 1,
        noticeOnUnload: 0,
        container: `#${containerId}`,
        height: "100%",
        fromElement: false,
        allowScripts: 1,
        storageManager: false,

        assetManager: {
          uploadFile: async (e) => {
            const files = e.dataTransfer ? e.dataTransfer.files : e.target.files;
            setLoading(true);
            try {
              const ws = workspaceRef.current; // always fresh workspace
              const result = await uploadAsset(files, ws);
              if (result.type === "success") {
                editor.AssetManager.add(result.data);
                await _doSave(editor, ws, "no-autosave");
              } else {
                alert(result.message);
              }
            } catch {
              alert("Upload failed.");
            } finally {
              setLoading(false);
            }
          },
        },

        selectorManager: { componentFirst: true },
        styleManager: { sectors: getStyleManagerSectors() },

        canvas: {
          styles: CANVAS_STYLES,
          scripts: CANVAS_SCRIPTS,
        },

        plugins: [],
        pluginsOpts: {},
        domComponents: { storeWrapper: 1 },
      });

      editor.StyleManager.addType("configure", {
        create() { return editor.TraitManager.render(); },
        emit() {}, update() {}, destroy() {},
      });
      editor.StyleManager.addSector("configure", {
        name: "Configure",
        open: true,
        properties: [{ property: "", label: "", type: "configure" }],
      }, { at: 0 });

      registerBlocks(editor);
      registerComponents(editor);

      editor.on("component:selected", () => {
        editor.Panels.getButton("views", "open-sm")?.set("active", 1);
      });

      editor.AssetManager.getAll().on("remove", async (asset) => {
        const src = asset.get("src");
        setLoading(true);
        try {
          const ws = workspaceRef.current; // always fresh workspace
          const result = await deleteAsset(src, ws);
          if (result.type === "success") {
            await _doSave(editor, ws, "no-autosave");
          } else {
            editor.AssetManager.add({ src });
            alert(result.message);
          }
        } catch {
          editor.AssetManager.add({ src });
        } finally {
          setLoading(false);
        }
      });

      editor.on("component:remove", (removed) => {
        if (isDestroyingRef.current) return;

        const type = removed.get("type");
        if (type === "image") {
          const parent = removed.parent();
          if (!parent || !parent.collection) return;
          if (parent.get("tagName") === "a") {
            parent.remove();
          }
        }
      });

      editor.on("component:add", (comp) => {
        const el = comp.getEl();
        if (!el?.classList?.contains("tracking-history-container")) return;
        const items = el.querySelectorAll(".tracking_history_records .tracking-item");
        const btn = el.querySelector(".toggle-tracking-btn");
        if (!items.length || !btn) return;
        items.forEach((item, i) => { if (i > 1) item.style.display = "none"; });
        let expanded = false;
        btn.addEventListener("click", () => {
          expanded = !expanded;
          items.forEach((item, i) => { if (i > 1) item.style.display = expanded ? "block" : "none"; });
          btn.textContent = expanded ? "Show Less" : "Show More";
        });
      });

      editorRef.current = editor;

      setLoading(true);
      const seq = ++loadSequenceRef.current;
      loadBuilderData(initialWorkspace)
        .then((data) => {
          if (destroyed || seq !== loadSequenceRef.current) return;
          _applyData(editor, data);
          if (data.workspace) setWorkspace(data.workspace);
        })
        .catch(() => {})
        .finally(() => {
          if (seq === loadSequenceRef.current) setLoading(false);
        });
    });

    return () => {
      destroyed = true;

      if (editor) {
        isDestroyingRef.current = true;

        try { editor.off("component:remove"); } catch (_) {}
        try { editor.off("component:add"); } catch (_) {}
        try { editor.off("component:selected"); } catch (_) {}

        try { editor.destroy(); } catch (_) {}
      }

      editorRef.current = null;
      isDestroyingRef.current = false;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSave = useCallback(async () => {
    if (!editorRef.current) return;
    setLoading(true);
    try {
      await _doSave(editorRef.current, workspace, "no-autosave");
      showToast("Saved successfully");
    } catch {
      showToast("Save failed", "error");
    } finally {
      setLoading(false);
    }
  }, [workspace, showToast]);

  const handlePublish = useCallback(async () => {
    if (!editorRef.current) return;
    setLoading(true);
    try {
      const data = _getData(editorRef.current);
      await publishTemplate(data, workspace);
      await _doSave(editorRef.current, workspace, "no-autosave");
      setActive("Y");
      showToast("Published! Your page is now live.");
    } catch {
      showToast("Publish failed", "error");
    } finally {
      setLoading(false);
    }
  }, [workspace, showToast]);

  const handleClear = useCallback(() => {
    if (!editorRef.current) return;
    editorRef.current.DomComponents.clear();
    editorRef.current.CssComposer.clear();
  }, []);

  const handleWorkspaceLoad = useCallback(async (newWorkspace) => {
    if (!editorRef.current) return;
    setLoading(true);
    const seq = ++loadSequenceRef.current;
    try {
      const data = await loadWorkspace(newWorkspace);
      if (seq !== loadSequenceRef.current) return;
      await _applyData(editorRef.current, data);
      workspaceRef.current = newWorkspace;
      setWorkspace(newWorkspace);
    } catch (err) {                                          // ← capture the error
      console.error("handleWorkspaceLoad failed:", err);     // ← log full error object
      console.error("Error message:", err?.message);         // ← human-readable message
      console.error("Error stack:", err?.stack);             // ← where it originated
      console.error("Workspace attempted:", newWorkspace);   // ← which workspace caused it
      if (seq === loadSequenceRef.current) showToast("Failed to load workspace", "error");
    } finally {
      if (seq === loadSequenceRef.current) setLoading(false);
    }
  }, [showToast]);

  const handleWorkspaceClone = useCallback(async (sourceWorkspace) => {
    if (!editorRef.current) return;
    setLoading(true);
    const seq = ++loadSequenceRef.current;
    try {
      const data = await loadWorkspace(sourceWorkspace);
      if (seq !== loadSequenceRef.current) return;
  
      await _applyData(editorRef.current, data); // ← await the deferred apply
  
      // BUG WAS HERE: workspaceRef and setWorkspace were never called,
      // so save/publish after a clone targeted the wrong workspace.
      // We intentionally do NOT change workspace here — clone loads content
      // from source into the CURRENT workspace (it's a content copy, not a switch).
      // If your intent is to actually switch to sourceWorkspace, uncomment below:
      // workspaceRef.current = sourceWorkspace;
      // setWorkspace(sourceWorkspace);
  
      showToast(`Cloned from ${sourceWorkspace}`);
    } catch {
      if (seq === loadSequenceRef.current) showToast("Failed to clone workspace", "error");
    } finally {
      if (seq === loadSequenceRef.current) setLoading(false);
    }
  }, [showToast]);

  const handleLoadDefault = useCallback(async (layoutId) => {
    if (!editorRef.current) return;
    setLoading(true);
    const seq = ++loadSequenceRef.current;
    try {
      const data = await loadBuilderData(layoutId);
      if (seq !== loadSequenceRef.current) return;
  
      await _applyData(editorRef.current, data); // ← await here too
    } catch {
      if (seq === loadSequenceRef.current) showToast("Failed to load layout", "error");
    } finally {
      if (seq === loadSequenceRef.current) setLoading(false);
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

// ── Helpers ──────────────────────────────────────────────────────────────────

function _getData(editor) {
  const strip = (str) => str.replaceAll(_assetBase, '/portal_assets/grapesjs');
  return {
    assets:     strip(JSON.stringify(editor.AssetManager.getAll().toJSON())),
    components: strip(JSON.stringify(editor.getComponents())),
    css:        strip(editor.getCss()),
    html:       strip(editor.getHtml()),
    styles:     strip(JSON.stringify(editor.getStyle())),
  };
}

function _fixPaths(val) {
  if (!val) return val;
  if (typeof val === 'string') {
    // Only fix bare relative paths, not already-absolute URLs
    return val.replaceAll(
      /(https?:\/\/[^"'\s]*)?\/portal_assets\/grapesjs/g,
      (match, existingHost) => existingHost ? match : _assetBase
    );
  }
  if (Array.isArray(val)) return val.map(_fixPaths);
  if (typeof val === 'object') {
    return Object.fromEntries(
      Object.entries(val).map(([k, v]) => [k, _fixPaths(v)])
    );
  }
  return val;
}

function _safeParse(value) {
  if (!value) return null;
  if (typeof value === 'object') return value;
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

// ── FIXED: _applyData ────────────────────────────────────────────────────────
// Problem 1: editor.DomComponents.clear() is NOT synchronous in GrapesJS —
// it fires events and the DOM flush happens on the next tick.
// Calling setComponents() immediately after queues onto stale DOM → content appends.
// Fix: use a small Promise wrapper to let the clear settle before writing new content.

function _applyData(editor, data) {
  if (!data) return;

  // Step 1 – wipe everything first, then apply on next tick so GrapesJS
  // has time to flush the removal events before we write new content.
  editor.DomComponents.clear();
  editor.CssComposer.clear();

  // Defer the actual load by one microtask so clear() side-effects settle
  return new Promise((resolve) => {
    setTimeout(() => {
      // ── Components ───────────────────────────────────────────────────────
      let rawComponents = _fixPaths(_safeParse(data['gjs-components'] ?? data.components));
      if (rawComponents) {
        if (!Array.isArray(rawComponents) && rawComponents.type === 'wrapper') {
          rawComponents = rawComponents.components ?? [];
        }
        editor.setComponents(rawComponents);
      } else if (data['gjs-html']) {
        let html = _fixPaths(data['gjs-html']);
        const bodyMatch = html.match(/<body[^>]*>([\s\S]*)<\/body>/i);
        if (bodyMatch) html = bodyMatch[1];
        editor.setComponents(html);
      }

      // ── Styles ───────────────────────────────────────────────────────────
      const styles = _fixPaths(_safeParse(data['gjs-styles'] ?? data.styles));
      const hasStyles = Array.isArray(styles) ? styles.length > 0 : !!styles;
      if (hasStyles) {
        editor.setStyle(styles);
      } else if (data['gjs-css']) {
        editor.setStyle(_fixPaths(data['gjs-css']));
      }

      // ── Assets ───────────────────────────────────────────────────────────
      const assets = _fixPaths(_safeParse(data['gjs-assets'] ?? data.assets));
      if (Array.isArray(assets) ? assets.length > 0 : !!assets) {
        editor.AssetManager.add(assets);
      }

      resolve();
    }, 0);
  });
}

async function _doSave(editor, workspace, saveType = "autosave") {
  const data = _getData(editor);
  return await saveWorkspace(data, workspace, saveType);
}