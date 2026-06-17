// app/api/builderApi.js
// Mirrors CustomsettingsapiController.php (deployed as "customsettingsapidem").
// Auth: Bearer token read from sessionStorage key "ls_access_token".
// Base URL: VITE_API_BASE_URL from .env (e.g. https://devappservice.lateshipment.com)

const BASE = import.meta.env.VITE_API_BASE_URL || "";
const CTRL = "customsettingsapidem";   // controller route prefix

// ── Bearer token helper ───────────────────────────────────────────────────────
// Reads ls_access_token from sessionStorage and throws if missing.
// Pass extra = { "Content-Type": "application/json" } for JSON endpoints.
// Do NOT pass Content-Type for multipart endpoints (browser sets boundary).
function authHeaders(extra = {}) {
  const token = sessionStorage.getItem("ls_access_token");
  if (!token) throw new Error("Authentication required: no access token found");
  return {
    Authorization: `Bearer ${token}`,
    ...extra,
  };
}

async function handleResponse(res) {
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`HTTP ${res.status}: ${text}`);
  }
  return res.json();
}

// =============================================================================
// GET /customsettingsapi/getcustomsettings
//
// Returns the Customtracking MongoDB doc for the auth'd user, augmented with:
//   shopify_embed_code, show_sticky_banner, branded_tracking_page,
//   is_demo_user, s3url
// Returns null when no document exists yet (HTTP 404).
// =============================================================================
export async function getCustomSettings() {
  const res = await fetch(`${BASE}/${CTRL}/getcustomsettings`, {
    method: "GET",
    headers: authHeaders(),   // GET — no Content-Type needed
  });
  if (res.status === 404) return null;
  return handleResponse(res);
}

// =============================================================================
// POST /customsettingsapi/customtracking  (multipart/form-data)
//
// previewFlag="N"  → validate + upload files + upsert Customtracking +
//                     create Cloudflare subdomain if domain changed
// previewFlag="Y"  → validate + upload files + write CustomtrackingPreview
//                     doc + return previewToken
//
// @param {FormData} formData  — built by buildFormData() below
//
// Success:  { type:"success", message:"...", tokenValues:"###<token>" }
// Preview:  { type:"success", previewToken:"<40hex>", message:"...", tokenValues:"###<token>" }
// Error:    { type:"error", action:"<slot>", message:"...", tokenValues:"###<token>" }
//   action = "logo"|"favicon"|"assetone"|"assettwo"|"assetthree"|"assetfour"|
//            "assetfive"|"assetsix"|"banner"|"domain"|"logo1"
// =============================================================================
export async function saveCustomTracking(formData) {
  const res = await fetch(`${BASE}/${CTRL}/customtracking`, {
    method: "POST",
    headers: authHeaders(),   // multipart — NO Content-Type, browser sets boundary
    body: formData,
  });
  return handleResponse(res);
}

// =============================================================================
// POST /customsettingsapi/authoriseRedirect  (JSON)
//
// Validates Bearer JWT, stamps a one-time redirect token (rt) on the relevant
// Mongo doc, and returns a gateway URL to open in a new tab.
//
// Request body:
//   intent          "preview" | "builder"
//   previewToken    required when intent="preview" (40-hex from saveCustomTracking)
//   redirectBackUrl current React SPA URL (used as fallback on gateway error)
//
// Success:  { success:true,  redirectUrl:"<webappBase>/customsettingsapi/gateway?rt=<rt>&i=<intent>" }
// Failure:  { success:false, message:"..." }
// =============================================================================
export async function authoriseRedirect({ intent, previewToken = "", redirectBackUrl = "" }) {
  const res = await fetch(`${BASE}/${CTRL}/authoriseRedirect`, {
    method: "POST",
    headers: authHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify({ intent, previewToken, redirectBackUrl }),
  });
  return handleResponse(res);
}

// =============================================================================
// Convenience: open preview in new tab (2-step: save → authorise → open)
// =============================================================================
export async function openPreviewTab(formData) {
  const saveResult = await saveCustomTracking(formData);
  if (saveResult.type !== "success" || !saveResult.previewToken) {
    return saveResult;
  }
  const authResult = await authoriseRedirect({
    intent: "preview",
    previewToken: saveResult.previewToken,
    redirectBackUrl: window.location.href,
  });
  if (!authResult.success) {
    return { type: "error", message: authResult.message ?? "Failed to open preview." };
  }
  window.open(authResult.redirectUrl, "_blank", "noopener,noreferrer");
  return { type: "success", message: saveResult.message, tokenValues: saveResult.tokenValues };
}

// =============================================================================
// Convenience: open builder in new tab (authorise → open)
// =============================================================================
export async function openBuilderTab() {
  const authResult = await authoriseRedirect({
    intent: "builder",
    redirectBackUrl: window.location.href,
  });
  if (!authResult.success) {
    return { type: "error", message: authResult.message ?? "Failed to open builder." };
  }
  window.open(authResult.redirectUrl, "_blank", "noopener,noreferrer");
  return { type: "success" };
}

// =============================================================================
// Builder actions — called from builder.phtml XHR (or from React).
// Auth: "bst" (builder_session_token) is sent as a body field, NOT Bearer.
// Pass the bst that window.open'd the builder tab stored in builder.phtml as
// window.BST.  In React, read it from wherever you stored it.
// =============================================================================

// ---------------------------------------------------------------------------
// GET /customsettingsapi/load/<templateId>
//
// templateId = 1|2|3  → PHP static defaultOne()/defaultTwo()/defaultThree()
// templateId = other   → user's Customtracking builder data → Buildertemplate
//                        fallback → defaultOne()
//
// Returns: { "gjs-assets", "gjs-components", "gjs-css", "gjs-html", "gjs-styles", workspace }
// ---------------------------------------------------------------------------
export async function loadBuilderData(templateId = "", bst = "") {
  const path = templateId
    ? `${BASE}/${CTRL}/load/${encodeURIComponent(templateId)}`
    : `${BASE}/${CTRL}/load`;
  const qs = bst ? `?bst=${encodeURIComponent(bst)}` : "";
  const res = await fetch(`${path}${qs}`, {
    method: "GET",
    headers: authHeaders(),
  });
  return handleResponse(res);
}

// ---------------------------------------------------------------------------
// GET /customsettingsapi/workspace/<workspaceName>
//
// Loads GrapesJS state for a named workspace (workspace1–workspace8).
// Falls back to defaultOne() if no Buildertemplate doc found.
//
// Returns: { "gjs-assets", "gjs-components", "gjs-css", "gjs-html", "gjs-styles" }
// ---------------------------------------------------------------------------
export async function loadWorkspace(workspace, bst = "") {
  const qs = bst ? `?bst=${encodeURIComponent(bst)}` : "";
  const res = await fetch(
    `${BASE}/${CTRL}/workspace/${encodeURIComponent(workspace)}${qs}`,
    { method: "GET", headers: authHeaders() }
  );
  return handleResponse(res);
}

// ---------------------------------------------------------------------------
// POST /customsettingsapi/workspacestore  (JSON)
//
// Saves GrapesJS state into Buildertemplate for a specific workspace.
// Server-side XSS validation (event-handler pattern) runs before upsert.
//
// Request body:
//   "gjs-assets"  "gjs-components"  "gjs-css"  "gjs-html"  "gjs-styles"
//   workspace     "workspace1"–"workspace8"
//   bst           builder session token
//
// Response: { type:"success" } | { type:"error" }
// ---------------------------------------------------------------------------
export async function saveWorkspace(data, workspace, saveType = "autosave", bst = "") {
  const res = await fetch(`${BASE}/${CTRL}/workspacestore`, {
    method: "POST",
    headers: authHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify({
      "gjs-assets":     data.assets     ?? "",
      "gjs-components": data.components ?? "",
      "gjs-css":        data.css        ?? "",
      "gjs-html":       data.html       ?? "",
      "gjs-styles":     data.styles     ?? "",
      workspace,
      bst,
      save_type: saveType,
    }),
  });
  return handleResponse(res);
}

// ---------------------------------------------------------------------------
// POST /customsettingsapi/store  (JSON)
//
// Saves GrapesJS state into Customtracking.builder — makes changes live.
// This is what the "Publish" button calls.
//
// Same request/response shape as workspacestore.
// ---------------------------------------------------------------------------
export async function publishTemplate(data, workspace, bst = "") {
  const res = await fetch(`${BASE}/${CTRL}/store`, {
    method: "POST",
    headers: authHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify({
      "gjs-assets":     data.assets     ?? "",
      "gjs-components": data.components ?? "",
      "gjs-css":        data.css        ?? "",
      "gjs-html":       data.html       ?? "",
      "gjs-styles":     data.styles     ?? "",
      workspace,
      bst,
    }),
  });
  return handleResponse(res);
}

// ---------------------------------------------------------------------------
// POST /customsettingsapi/assetstore  (multipart/form-data)
//
// Uploads image assets for GrapesJS builder to S3.
// Limits: ≤1 MB/file, jpg/png/gif/jpeg only, max 20 active per workspace.
//
// Form fields:
//   workspace   "workspace1"–"workspace8"
//   bst         builder session token
//   file-0 …   one or more image File objects
//
// Response:
//   { type:"success", message:"...", data:["<s3url>", ...] }
//   { type:"error",   message:"..." }
// ---------------------------------------------------------------------------
export async function uploadAsset(files, workspace, bst = "") {
  const formData = new FormData();
  Array.from(files).forEach((file, i) => formData.append(`file-${i}`, file));
  formData.append("workspace", workspace);
  if (bst) formData.append("bst", bst);

  const res = await fetch(`${BASE}/${CTRL}/assetstore`, {
    method: "POST",
    headers: authHeaders(),   // multipart — NO Content-Type, browser sets boundary
    body: formData,
  });
  return handleResponse(res);
}

// ---------------------------------------------------------------------------
// POST /customsettingsapi/assetdelete  (form-data)
//
// Soft-deletes an asset: appends its S3 URL to Buildertemplate.deleted_assets[].
// The S3 object itself is not removed by this endpoint.
//
// Form fields:
//   data       S3 URL of the image to delete
//   workspace  "workspace1"–"workspace8"
//   bst        builder session token
//
// Response: { type:"success" } | { type:"error", message:"..." }
// ---------------------------------------------------------------------------
export async function deleteAsset(src, workspace, bst = "") {
  const formData = new FormData();
  formData.append("data", src);
  formData.append("workspace", workspace);
  if (bst) formData.append("bst", bst);

  const res = await fetch(`${BASE}/${CTRL}/assetdelete`, {
    method: "POST",
    headers: authHeaders(),   // form-data — NO Content-Type, browser sets boundary
    body: formData,
  });
  return handleResponse(res);
}

// =============================================================================
// fetchBuilderState — used by BuilderPage on mount.
//
// Calls getcustomsettings to get the user doc, then calls the workspace
// load endpoint to check whether saved GrapesJS content exists.
//
// The actual getcustomsettings response (confirmed from live API):
//   { userid, domain, themeid, logo, favicon, builder: { workspace, css, html, ... },
//     shopify_embed_code, show_sticky_banner, branded_tracking_page, is_demo_user, s3url }
//
// Note: When builder has never been saved, the doc has no "builder" sub-key.
// We derive "active" by calling loadWorkspace and checking if gjs-css is non-empty.
// =============================================================================
export async function fetchBuilderState() {
  const doc = await getCustomSettings();

  if (!doc) {
    return { workspace: "workspace1", active: "N", userId: "", s3url: "" };
  }

  // The PHP controller stores builder data under doc.builder sub-object
  // Fields: doc.builder.workspace, doc.builder.css, doc.builder.html, ...
  const builderWorkspace = doc.builder?.workspace ?? "workspace1";

  // Check if builder content actually exists by inspecting the builder sub-doc
  // that PHP populates from Customtracking.builder.*
  const hasBuilderContent =
    !!(doc.builder?.css  && doc.builder.css  !== "") ||
    !!(doc.builder?.html && doc.builder.html !== "");

  return {
    workspace: builderWorkspace,
    active:    hasBuilderContent ? "Y" : "N",
    userId:    String(doc.userid ?? ""),
    s3url:     doc.s3url ?? "",
    // Pass through useful flags for the UI
    brandedTrackingPage: doc.branded_tracking_page ?? "Y",
    isDemoUser:          doc.is_demo_user ?? false,
    showStickyBanner:    doc.show_sticky_banner ?? false,
  };
}

// =============================================================================
// buildFormData — constructs the multipart FormData that
// customtrackingAction() expects.
//
// @param {object} fields   — all text/select fields (see PHP docblock)
// @param {object} files    — { file, favfile, assetonefile, assettwofile,
//                              assetthreefile, assetfourfile, assetfivefile,
//                              assetsixfile, bannerfile }  (File or null)
//
// Usage:
//   const fd = buildFormData(fields, files);
//   const result = await saveCustomTracking(fd);          // save
//   const result = await openPreviewTab(fd);              // preview
// =============================================================================
export function buildFormData(fields = {}, files = {}) {
  const {
    previewFlag        = "N",
    domain             = "",
    themeid            = "3",
    message            = "",
    headerColor        = "",
    logo_url           = "",
    stickeycontent     = "",
    analytics_id       = "",
    rebuy_api_key      = "",
    nosto_api_key      = "",

    footer_contactpage = "",
    footer_termspage   = "",
    footer_privacypage = "",
    footer_facebook    = "",
    footer_twitter     = "",
    footer_instagram   = "",
    footer_youtube     = "",
    footer_linkedin    = "",
    footer_pinterest   = "",

    destination_url_theme_3_asset_one = "",
    destination_url_theme_3_asset_two = "",
    destination_url_theme_4_asset_one = "",
    destination_url_theme_4_asset_two = "",
    destination_url_theme_5_asset_one = "",
    destination_url_theme_5_asset_two = "",

    // Prev / remove pairs (per slot)
    // remove_<slot>="1" → upload new / clear | "0" → keep prev_<slot>
    remove_logo = "0",    prev_logo    = "",
    remove_favicon = "0", prev_favicon = "",
    remove_assetone   = "0", prev_assetone   = "",
    remove_assettwo   = "0", prev_assettwo   = "",
    remove_assetthree = "0", prev_assetthree = "",
    remove_assetfour  = "0", prev_assetfour  = "",
    remove_assetfive  = "0", prev_assetfive  = "",
    remove_assetsix   = "0", prev_assetsix   = "",
    remove_banner     = "0", prev_banner     = "",
  } = fields;

  const fd = new FormData();

  // Core
  fd.append("previewFlag",        previewFlag);
  fd.append("domain",             domain.trim().toLowerCase());
  fd.append("themeid",            String(themeid));
  fd.append("message",            message);
  fd.append("simple-color-picker", headerColor);
  fd.append("logo_url",           logo_url);
  fd.append("stickeycontent",     stickeycontent);
  fd.append("analytics_id",       analytics_id);
  fd.append("rebuy_api_key",      rebuy_api_key);
  fd.append("nosto_api_key",      nosto_api_key);

  // Footer
  fd.append("footer_contactpage", footer_contactpage);
  fd.append("footer_termspage",   footer_termspage);
  fd.append("footer_privacypage", footer_privacypage);
  fd.append("footer_facebook",    footer_facebook);
  fd.append("footer_twitter",     footer_twitter);
  fd.append("footer_instagram",   footer_instagram);
  fd.append("footer_youtube",     footer_youtube);
  fd.append("footer_linkedin",    footer_linkedin);
  fd.append("footer_pinterest",   footer_pinterest);

  // Destination URLs
  fd.append("destination_url_theme_3_asset_one", destination_url_theme_3_asset_one);
  fd.append("destination_url_theme_3_asset_two", destination_url_theme_3_asset_two);
  fd.append("destination_url_theme_4_asset_one", destination_url_theme_4_asset_one);
  fd.append("destination_url_theme_4_asset_two", destination_url_theme_4_asset_two);
  fd.append("destination_url_theme_5_asset_one", destination_url_theme_5_asset_one);
  fd.append("destination_url_theme_5_asset_two", destination_url_theme_5_asset_two);

  // Prev / remove pairs
  fd.append("remove_logo",       remove_logo);       fd.append("prev_logo",       prev_logo);
  fd.append("remove_favicon",    remove_favicon);    fd.append("prev_favicon",    prev_favicon);
  fd.append("remove_assetone",   remove_assetone);   fd.append("prev_assetone",   prev_assetone);
  fd.append("remove_assettwo",   remove_assettwo);   fd.append("prev_assettwo",   prev_assettwo);
  fd.append("remove_assetthree", remove_assetthree); fd.append("prev_assetthree", prev_assetthree);
  fd.append("remove_assetfour",  remove_assetfour);  fd.append("prev_assetfour",  prev_assetfour);
  fd.append("remove_assetfive",  remove_assetfive);  fd.append("prev_assetfive",  prev_assetfive);
  fd.append("remove_assetsix",   remove_assetsix);   fd.append("prev_assetsix",   prev_assetsix);
  fd.append("remove_banner",     remove_banner);     fd.append("prev_banner",     prev_banner);

  // File uploads — only append real File objects
  [
    "file", "favfile", "assetonefile", "assettwofile",
    "assetthreefile", "assetfourfile", "assetfivefile",
    "assetsixfile", "bannerfile",
  ].forEach((key) => {
    if (files[key] instanceof File) fd.append(key, files[key]);
  });

  return fd;
}