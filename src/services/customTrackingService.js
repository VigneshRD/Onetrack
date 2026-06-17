// ─────────────────────────────────────────────────────────────────────────────
// customTrackingService.js
// Fully aligned with PHP customtrackingAction() in CustomsettingsController.php
//
// ─── AUTH ─────────────────────────────────────────────────────────────────────
//  Frontend sends:  Authorization: Bearer <accessToken>  on every request.
//  Backend reads:   $jwtService->decode($jwttoken) → $payload->uid = userId
//  userId is NEVER sent as a form field — always extracted from the JWT.
//
// ─── ENDPOINTS ───────────────────────────────────────────────────────────────
//  POST  /customsettingsapi/customtracking     previewFlag=N → save to MongoDB + Cloudflare DNS
//  POST  /customsettingsapi/customtracking     previewFlag=Y → session-only preview (no DB write)
//  GET   /customsettingsapi/getcustomsettings  → load saved config for current user
//
// ─── THEME ID MAPPING (confirmed from live response + phtml radio values) ────
//  3 = Standard   (assetone, assettwo)
//  4 = Timeline   (assetthree, assetfour)
//  5 = Pristine   (assetfive, assetsix, banner)
//  6 = Builder    (no static asset slots)
//
// ─── PHP BACKEND RESPONSE FORMAT ─────────────────────────────────────────────
//  The controller echoes raw JSON strings in one of these shapes:
//    Success:  {"type":"success","message":"...","tokenValues":"###<token>"}
//    Error:    {"type":"error","action":"<field>","message":"...","tokenValues":"###<token>"}
//  action field tells which upload slot failed: "logo","favicon","assetone" etc.
//
// ─── FILE SIZE LIMIT ──────────────────────────────────────────────────────────
//  Backend: $maxFileUploadSize = 1000000  (1 MB per file)
//  We enforce the same limit client-side before sending to avoid a round-trip.
//
// ─── PREV / REMOVE PATTERN ───────────────────────────────────────────────────
//  For each file slot the controller reads:
//    remove_<slot> == '0'  → keep existing file (read prev_<slot> for filename)
//    remove_<slot> == '1'  → discard / replace
//  appendFileOrKeep() handles all three states:
//    File object  → new upload  (remove=1, prev="")
//    String       → keep existing (remove=0, prev=<filename>)
//    null/empty   → clear slot  (remove=1, prev="")
// ─────────────────────────────────────────────────────────────────────────────

const API_BASE_URL     = import.meta.env.VITE_API_BASE_URL;
const REQUEST_TIMEOUT  = 30000;   // 30 s — file uploads can be slow
const MAX_FILE_SIZE_MB = 1;       // matches PHP: $maxFileUploadSize = 1000000
const MAX_FILE_BYTES   = MAX_FILE_SIZE_MB * 1000 * 1000; // 1 000 000 bytes exactly

// ─── Allowed file extensions (matches PHP $logo_formats) ─────────────────────
// PHP: ["jpg","png","gif","jpeg","PNG","JPG","JPEG","GIF"]
// Favicon additionally allows: ["png","ico"]
const IMAGE_FORMATS  = ["jpg", "jpeg", "png", "gif"];
const FAVICON_FORMATS = ["png", "ico"];

// ─── Token helpers ────────────────────────────────────────────────────────────
function getAccessToken() {
  const token = sessionStorage.getItem('ls_access_token');
  if (!token) throw new Error("Authentication required: no access token found");
  return token;
}

function authHeaders() {
  return { Authorization: `Bearer ${getAccessToken()}` };
}

function jsonAuthHeaders() {
  return {
    ...authHeaders(),
    "Content-Type": "application/json",
    Accept:         "application/json",
  };
}

// ─── Client-side file validation ─────────────────────────────────────────────
// Mirrors PHP checks: extension in allowed list + size <= 1MB
// Returns an error string or null if valid.
function validateFile(file, allowedExtensions, slotLabel) {
  if (!file || !(file instanceof File)) return null;

  const ext = file.name.split(".").pop().toLowerCase();
  if (!allowedExtensions.includes(ext)) {
    return `${slotLabel}: Please upload a supported format (${allowedExtensions.join(", ")})`;
  }
  if (file.size > MAX_FILE_BYTES) {
    return `${slotLabel}: File size must be less than ${MAX_FILE_SIZE_MB}MB`;
  }
  return null;
}

// ─── POST wrapper (multipart/form-data) ──────────────────────────────────────
// No retry for file uploads — retrying could cause duplicate S3 uploads.
// We do retry once on network timeout (non-file requests).
async function postForm(path, formData) {
  const controller = new AbortController();
  const timeoutId  = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

  try {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      method:      "POST",
      headers:     authHeaders(),   // Authorization: Bearer <JWT>  (no Content-Type — browser sets boundary)
      body:        formData,
      credentials: "include",       // forward session cookie (backend uses $_SESSION for preview)
      signal:      controller.signal,
    });

    clearTimeout(timeoutId);

    if (response.status === 401) throw new Error("Unauthorized: invalid or expired token");
    if (!response.ok) throw new Error(`API error: ${response.status} ${response.statusText}`);

    // PHP echoes raw JSON strings (not setJsonContent) — read as text, parse later
    return await response.text();

  } catch (err) {
    clearTimeout(timeoutId);
    throw err;
  }
}

// ─── GET wrapper ──────────────────────────────────────────────────────────────
async function get(path, retries = 2) {
  let lastErr;
  for (let attempt = 0; attempt < retries; attempt++) {
    const controller = new AbortController();
    const timeoutId  = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);
    try {
      const response = await fetch(`${API_BASE_URL}${path}`, {
        method:      "GET",
        headers:     jsonAuthHeaders(),
        credentials: "include",
        signal:      controller.signal,
      });
      clearTimeout(timeoutId);

      if (response.status === 404) return null;
      if (response.status === 401) throw new Error("Unauthorized: invalid or expired token");
      if (!response.ok) throw new Error(`API error: ${response.status} ${response.statusText}`);

      return await response.json();
    } catch (err) {
      clearTimeout(timeoutId);
      lastErr = err;
      if (err.message?.startsWith("Unauthorized")) throw err;
      if (attempt < retries - 1) {
        await new Promise((r) => setTimeout(r, 1000 * Math.pow(2, attempt)));
      }
    }
  }
  throw lastErr;
}

// ─── Backend response parser ──────────────────────────────────────────────────
// PHP echoes:
//   Save/error: {"type":"success"|"error","message":"...","tokenValues":"###<token>"}
//   Preview:    {"type":"success","message":"...","previewToken":"<hex>","tokenValues":"###<token>"}
//
// We normalise this into:
//   { type, message, action, newToken, previewToken }
function parseBackendResponse(raw) {
  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error("Invalid JSON response from server.");
  }

  // Extract the rotated CSRF token — PHP format: "###<newTokenValue>"
  let newToken = null;
  if (parsed.tokenValues && typeof parsed.tokenValues === "string") {
    const parts = parsed.tokenValues.split("###");
    if (parts.length === 2) newToken = parts[1];
  }

  const isSuccess = parsed.type === "success";

  return {
    type:         isSuccess ? "success" : "error",
    message:      parsed.message      ?? "Unknown error",
    action:       parsed.action       ?? null,   // which slot failed: "logo","favicon","assetone" etc.
    newToken:     newToken,                       // rotated CSRF token to store for next request
    previewToken: parsed.previewToken ?? null,   // 40-char hex token for preview URL (?pt=)
  };
}

// ─── Theme ID mapping ─────────────────────────────────────────────────────────
// Frontend layout key → PHP themeid integer (sent as string in FormData)
const LAYOUT_TO_THEME_ID = {
  standard: "3",
  timeline: "4",
  pristine: "5",
  builder:  "6",
};

// ─── appendFileOrKeep ─────────────────────────────────────────────────────────
// Maps directly to the PHP pattern:
//   if ($this->request->getPost('remove_<slot>') == '0')
//       $<slot>Name = $this->request->getPost('prev_<slot>');
//
// Three states:
//   File object  → new upload    send file in fieldKey, remove=1, prev=""
//   string       → keep existing send remove=0, prev=<filename>,  NO file field
//   null/empty   → clear slot    send remove=1, prev=""            NO file field
function appendFileOrKeep(fd, file, fieldKey, slotName) {
  if (file instanceof File) {
    fd.append(fieldKey,               file);   // actual file bytes
    fd.append(`prev_${slotName}`,    "");
    fd.append(`remove_${slotName}`,  "1");
  } else if (typeof file === "string" && file.length > 0) {
    // Existing S3 filename — backend keeps the old file
    fd.append(`prev_${slotName}`,    file);
    fd.append(`remove_${slotName}`,  "0");
  } else {
    // null or empty — clear / remove the slot
    fd.append(`prev_${slotName}`,    "");
    fd.append(`remove_${slotName}`,  "1");
  }
}

// ─── Client-side pre-flight validation ───────────────────────────────────────
// Mirrors all file checks the PHP controller performs server-side.
// Returns an array of error strings — empty means all files are valid.
// Call this BEFORE building FormData to give instant feedback.
function validateFiles(config) {
  const errs = [];
  const { branding, layout } = config;
  const themeId = LAYOUT_TO_THEME_ID[layout] ?? "3";

  // Logo: all themes allow it; PHP checks ext + size
  if (branding.logoFile instanceof File) {
    const err = validateFile(branding.logoFile, IMAGE_FORMATS, "Logo");
    if (err) errs.push(err);
  }

  // Favicon: PNG or ICO only
  if (branding.faviconFile instanceof File) {
    const err = validateFile(branding.faviconFile, FAVICON_FORMATS, "Favicon");
    if (err) errs.push(err);
  }

  const [img0, img1] = branding.brandImageFiles ?? [null, null];

  if (themeId === "3") {
    if (img0 instanceof File) { const e = validateFile(img0, IMAGE_FORMATS, "Brand image 1"); if (e) errs.push(e); }
    if (img1 instanceof File) { const e = validateFile(img1, IMAGE_FORMATS, "Brand image 2"); if (e) errs.push(e); }
  } else if (themeId === "4") {
    if (img0 instanceof File) { const e = validateFile(img0, IMAGE_FORMATS, "Brand image 1"); if (e) errs.push(e); }
    if (img1 instanceof File) { const e = validateFile(img1, IMAGE_FORMATS, "Brand image 2"); if (e) errs.push(e); }
  } else if (themeId === "5") {
    if (img0 instanceof File) { const e = validateFile(img0, IMAGE_FORMATS, "Brand image 1"); if (e) errs.push(e); }
    if (img1 instanceof File) { const e = validateFile(img1, IMAGE_FORMATS, "Brand image 2"); if (e) errs.push(e); }
    if (branding.bannerImageFile instanceof File) {
      const e = validateFile(branding.bannerImageFile, IMAGE_FORMATS, "Banner");
      if (e) errs.push(e);
    }
  }

  return errs;
}

// ─── buildFormData ────────────────────────────────────────────────────────────
// Converts React config state → multipart FormData exactly matching what
// the PHP customtrackingAction() reads via $this->request->getPost() and
// $this->request->getUploadedFiles().
//
// Field-by-field mapping:
//   PHP getPost('domain')               ← fd.append("domain", ...)
//   PHP getPost('message')              ← fd.append("message", ...)   (headerText)
//   PHP getPost('themeid')              ← fd.append("themeid", ...)
//   PHP getPost('simple-color-picker')  ← fd.append("simple-color-picker", ...)
//   PHP getPost('logo_url')             ← fd.append("logo_url", ...)
//   PHP getPost('stickeycontent')       ← fd.append("stickeycontent", ...)
//   PHP getPost('analytics_id')         ← fd.append("analytics_id", ...)
//   PHP getPost('rebuy_api_key')        ← fd.append("rebuy_api_key", ...)
//   PHP getPost('nosto_api_key')        ← fd.append("nosto_api_key", ...)
//   PHP getPost('footer_*')             ← fd.append("footer_*", ...)
//   PHP getUploadedFiles() key 'file'   ← fd.append("file", <File>)
//   PHP getUploadedFiles() key 'favfile'← fd.append("favfile", <File>)
//   PHP getPost('tokenValue')           ← fd.append("tokenValue", ...)
//   PHP getPost('previewFlag')          ← fd.append("previewFlag", "Y"|"N")
//
// Asset slots are theme-conditional — matches PHP if($themeid==3){...}else if...
function buildFormData(config, tokenValue, previewFlag = "N") {
  const fd = new FormData();
  const themeId = LAYOUT_TO_THEME_ID[config.layout] ?? "3";

  // ── CSRF token (legacy — backend may validate; harmless if it doesn't) ──────
  fd.append("tokenValue",  tokenValue ?? "");
  fd.append("previewFlag", previewFlag);  // "N" = save to DB,  "Y" = session preview

  // ── Domain ────────────────────────────────────────────────────────────────
  // PHP: $domain = trim(strtolower($this->request->getPost('domain')));
  const domain = config.useCustomDomain
    ? (config.customDomain ?? "").trim().toLowerCase()
    : (config.subdomain    ?? "").trim().toLowerCase();
  fd.append("domain", domain);

  // ── Theme ID ─────────────────────────────────────────────────────────────
  // PHP: $themeid = $this->request->getPost('themeid');
  fd.append("themeid", themeId);

  // ── Header text ──────────────────────────────────────────────────────────
  // PHP: $header = $this->request->getPost('message');
  fd.append("message", config.branding.headerText ?? "");

  // ── Header color ─────────────────────────────────────────────────────────
  // PHP: $headerColor = $this->request->getPost('simple-color-picker');
  fd.append("simple-color-picker", config.branding.headerColor ?? "#026BB2");

  // ── Logo click URL ────────────────────────────────────────────────────────
  // PHP: $logo_url = $this->request->getPost('logo_url');
  fd.append("logo_url", config.branding.logoClickUrl ?? "");

  // ── Sticky banner ─────────────────────────────────────────────────────────
  // PHP: $stickeycontent = $this->request->getPost('stickeycontent');
  fd.append("stickeycontent", config.branding.stickyBannerText ?? "");

  // ── Google Analytics ──────────────────────────────────────────────────────
  // PHP: $analytics_id = $this->request->getPost('analytics_id');
  fd.append("analytics_id", config.googleAnalyticsId ?? "");

  // ── Rebuy / Nosto ─────────────────────────────────────────────────────────
  // PHP: $rebuy_api_key = $this->request->getPost('rebuy_api_key');
  // PHP: $nosto_api_key = $this->request->getPost('nosto_api_key');
  // Send empty string when disabled — backend stores whatever is sent
  fd.append("rebuy_api_key", config.enhancements.enableRebuy ? (config.enhancements.rebuyApiKey ?? "") : "");
  fd.append("nosto_api_key", config.enhancements.enableNosto ? (config.enhancements.nostoApiKey ?? "") : "");

  // ── Footer URLs ───────────────────────────────────────────────────────────
  fd.append("footer_contactpage", config.footer.contactUrl ?? "");
  fd.append("footer_termspage",   config.footer.termsUrl   ?? "");
  fd.append("footer_privacypage", config.footer.privacyUrl ?? "");

  // ── Social ────────────────────────────────────────────────────────────────
  fd.append("footer_facebook",  config.social.facebook  ?? "");
  fd.append("footer_twitter",   config.social.twitter   ?? "");
  fd.append("footer_instagram", config.social.instagram ?? "");
  fd.append("footer_youtube",   config.social.youtube   ?? "");
  fd.append("footer_linkedin",  config.social.linkedin  ?? "");
  fd.append("footer_pinterest", config.social.pinterest ?? "");

  // ── Logo file ─────────────────────────────────────────────────────────────
  // PHP: if ($files[$i]->getKey() == 'file') { $logo = $files[$i]; }
  // PHP: if ($this->request->getPost('remove_logo') == '0') $logoName = prev_logo;
  appendFileOrKeep(fd, config.branding.logoFile, "file", "logo");

  // ── Favicon file ──────────────────────────────────────────────────────────
  // PHP: if ($files[$i]->getKey() == 'favfile') { $favicon = $files[$i]; }
  // PHP: if ($this->request->getPost('remove_favicon') == '0') $faviconName = prev_favicon;
  appendFileOrKeep(fd, config.branding.faviconFile, "favfile", "favicon");

  const [img0, img1] = config.branding.brandImageFiles ?? [null, null];
  const [url0, url1] = config.branding.brandImageUrls  ?? ["", ""];

  // ── Theme-conditional asset slots ─────────────────────────────────────────
  // PHP:
  //   if ($themeid == 3)      { assetonefile / assettwofile }
  //   else if ($themeid == 4) { assetthreefile / assetfourfile }
  //   else if ($themeid == 5) { assetfivefile / assetsixfile + bannerfile }
  //   themeid == 6 (builder)  → no static asset slots
  if (themeId === "3") {
    // Standard: assetone + assettwo
    appendFileOrKeep(fd, img0, "assetonefile", "assetone");
    appendFileOrKeep(fd, img1, "assettwofile", "assettwo");
    fd.append("destination_url_theme_3_asset_one", url0 ?? "");
    fd.append("destination_url_theme_3_asset_two", url1 ?? "");

    // Send empty prev/remove for unused theme slots so PHP doesn't choke
    fd.append("prev_assetthree",    ""); fd.append("remove_assetthree", "1");
    fd.append("prev_assetfour",     ""); fd.append("remove_assetfour",  "1");
    fd.append("prev_assetfive",     ""); fd.append("remove_assetfive",  "1");
    fd.append("prev_assetsix",      ""); fd.append("remove_assetsix",   "1");
    fd.append("prev_banner",        ""); fd.append("remove_banner",     "1");
    fd.append("destination_url_theme_4_asset_one", "");
    fd.append("destination_url_theme_4_asset_two", "");
    fd.append("destination_url_theme_5_asset_one", "");
    fd.append("destination_url_theme_5_asset_two", "");

  } else if (themeId === "4") {
    // Timeline: assetthree + assetfour
    appendFileOrKeep(fd, img0, "assetthreefile", "assetthree");
    appendFileOrKeep(fd, img1, "assetfourfile",  "assetfour");
    fd.append("destination_url_theme_4_asset_one", url0 ?? "");
    fd.append("destination_url_theme_4_asset_two", url1 ?? "");

    fd.append("prev_assetone",      ""); fd.append("remove_assetone",   "1");
    fd.append("prev_assettwo",      ""); fd.append("remove_assettwo",   "1");
    fd.append("prev_assetfive",     ""); fd.append("remove_assetfive",  "1");
    fd.append("prev_assetsix",      ""); fd.append("remove_assetsix",   "1");
    fd.append("prev_banner",        ""); fd.append("remove_banner",     "1");
    fd.append("destination_url_theme_3_asset_one", "");
    fd.append("destination_url_theme_3_asset_two", "");
    fd.append("destination_url_theme_5_asset_one", "");
    fd.append("destination_url_theme_5_asset_two", "");

  } else if (themeId === "5") {
    // Pristine: assetfive + assetsix + banner
    appendFileOrKeep(fd, img0, "assetfivefile", "assetfive");
    appendFileOrKeep(fd, img1, "assetsixfile",  "assetsix");
    appendFileOrKeep(fd, config.branding.bannerImageFile, "bannerfile", "banner");
    fd.append("destination_url_theme_5_asset_one", url0 ?? "");
    fd.append("destination_url_theme_5_asset_two", url1 ?? "");

    fd.append("prev_assetone",      ""); fd.append("remove_assetone",   "1");
    fd.append("prev_assettwo",      ""); fd.append("remove_assettwo",   "1");
    fd.append("prev_assetthree",    ""); fd.append("remove_assetthree", "1");
    fd.append("prev_assetfour",     ""); fd.append("remove_assetfour",  "1");
    fd.append("destination_url_theme_3_asset_one", "");
    fd.append("destination_url_theme_3_asset_two", "");
    fd.append("destination_url_theme_4_asset_one", "");
    fd.append("destination_url_theme_4_asset_two", "");

  } else {
    // Builder (themeid == 6): no static asset slots — clear all
    ["assetone","assettwo","assetthree","assetfour","assetfive","assetsix","banner"].forEach((slot) => {
      fd.append(`prev_${slot}`,   "");
      fd.append(`remove_${slot}`, "1");
    });
    fd.append("destination_url_theme_3_asset_one", "");
    fd.append("destination_url_theme_3_asset_two", "");
    fd.append("destination_url_theme_4_asset_one", "");
    fd.append("destination_url_theme_4_asset_two", "");
    fd.append("destination_url_theme_5_asset_one", "");
    fd.append("destination_url_theme_5_asset_two", "");
  }

  return fd;
}

// ─────────────────────────────────────────────────────────────────────────────
// Public API
// ─────────────────────────────────────────────────────────────────────────────
export const customTrackingService = {

  /**
   * Load the saved tracking-page config for the current user.
   *
   * PHP equivalent: getcustomtrackingdata action
   *   → queries MongoDB Customtracking collection by { userid: $userId }
   *   → returns the document or null
   *
   * @returns {Promise<object|null>}
   */
  getCustomSettings: async () => {
    return get("/customsettingsapi/getcustomsettings");
  },

  /**
   * Save config to MongoDB + trigger Cloudflare subdomain creation/update.
   *
   * PHP: previewFlag=N branch
   *   1. Validates domain uniqueness across users
   *   2. Uploads files to S3
   *   3. Validates logo dimensions (max 200×100 for non-Pristine themes)
   *   4. Upserts Customtracking document in MongoDB
   *   5. Calls createSubDomain() if domain changed
   *
   * Returns { type, message, action, newToken }
   *   action is set when a specific file slot fails: "logo","favicon","assetone" etc.
   *
   * @param   {object} config
   * @param   {string} [tokenValue]  Legacy CSRF token
   * @returns {Promise<{ type, message, action, newToken }>}
   */
  saveCustomSettings: async (config, tokenValue = "") => {
    // Client-side file validation (mirrors PHP size + extension checks)
    const fileErrors = validateFiles(config);
    if (fileErrors.length > 0) {
      return { type: "error", message: fileErrors[0], action: null, newToken: null };
    }

    const formData = buildFormData(config, tokenValue, "N");
    const raw      = await postForm("/customsettingsapi/customtracking", formData);
    return parseBackendResponse(raw);
  },

  /**
   * Preview-only save — stores data in PHP $_SESSION, no MongoDB write, no DNS change.
   *
   * PHP: previewFlag=Y branch
   *   1. Uploads any new files to S3 (same as save)
   *   2. Validates logo dimensions
   *   3. Stores everything in $_SESSION['auth']['customTrack']
   *   4. Returns success → frontend opens /customsettings/customtrackingpreview in new tab
   *
   * @param   {object} config
   * @param   {string} [tokenValue]
   * @returns {Promise<{ type, message, action, newToken }>}
   */
  previewCustomSettings: async (config, tokenValue = "") => {
    const fileErrors = validateFiles(config);
    if (fileErrors.length > 0) {
      return { type: "error", message: fileErrors[0], action: null, newToken: null };
    }

    const formData = buildFormData(config, tokenValue, "Y");
    const raw      = await postForm("/customsettingsapi/customtracking", formData);
    return parseBackendResponse(raw);
  },
};

// ─── Named exports ────────────────────────────────────────────────────────────
export const getCustomSettings     = customTrackingService.getCustomSettings;
export const saveCustomSettings    = customTrackingService.saveCustomSettings;
export const previewCustomSettings = customTrackingService.previewCustomSettings;

// ─── FIELD_MAP — complete reference for all FormData fields ──────────────────
// Maps JS name → PHP getPost() / getUploadedFiles() key
export const FIELD_MAP = {
  // ── Core ──────────────────────────────────────────────────────────────────
  tokenValue:             "tokenValue",              // legacy CSRF token
  previewFlag:            "previewFlag",             // "N"=save to DB  "Y"=session preview
  domain:                 "domain",                  // PHP: trim(strtolower(...))
  themeid:                "themeid",                 // "3"|"4"|"5"|"6"
  message:                "message",                 // headerText → PHP: $header
  "simple-color-picker":  "simple-color-picker",     // headerColor
  logo_url:               "logo_url",
  stickeycontent:         "stickeycontent",
  analytics_id:           "analytics_id",
  // ── Integrations ──────────────────────────────────────────────────────────
  rebuy_api_key:          "rebuy_api_key",
  nosto_api_key:          "nosto_api_key",
  // ── Footer ────────────────────────────────────────────────────────────────
  footer_contactpage:     "footer_contactpage",
  footer_termspage:       "footer_termspage",
  footer_privacypage:     "footer_privacypage",
  // ── Social ────────────────────────────────────────────────────────────────
  footer_facebook:        "footer_facebook",
  footer_twitter:         "footer_twitter",
  footer_instagram:       "footer_instagram",
  footer_youtube:         "footer_youtube",
  footer_linkedin:        "footer_linkedin",
  footer_pinterest:       "footer_pinterest",
  // ── File upload keys (PHP getKey() names) ─────────────────────────────────
  file:                   "file",                    // logo     → all themes
  favfile:                "favfile",                 // favicon  → all themes
  assetonefile:           "assetonefile",            // themeid 3 (standard)  img1
  assettwofile:           "assettwofile",            // themeid 3 (standard)  img2
  assetthreefile:         "assetthreefile",          // themeid 4 (timeline)  img1
  assetfourfile:          "assetfourfile",           // themeid 4 (timeline)  img2
  assetfivefile:          "assetfivefile",           // themeid 5 (pristine)  img1
  assetsixfile:           "assetsixfile",            // themeid 5 (pristine)  img2
  bannerfile:             "bannerfile",              // themeid 5 (pristine)  banner
  // ── Prev / remove pairs (one pair per file slot) ──────────────────────────
  // PHP: if (remove_<slot> == '0') <slot>Name = prev_<slot>
  prev_logo:              "prev_logo",     remove_logo:       "remove_logo",
  prev_favicon:           "prev_favicon",  remove_favicon:    "remove_favicon",
  prev_assetone:          "prev_assetone", remove_assetone:   "remove_assetone",
  prev_assettwo:          "prev_assettwo", remove_assettwo:   "remove_assettwo",
  prev_assetthree:        "prev_assetthree", remove_assetthree: "remove_assetthree",
  prev_assetfour:         "prev_assetfour",  remove_assetfour:  "remove_assetfour",
  prev_assetfive:         "prev_assetfive",  remove_assetfive:  "remove_assetfive",
  prev_assetsix:          "prev_assetsix",   remove_assetsix:   "remove_assetsix",
  prev_banner:            "prev_banner",     remove_banner:     "remove_banner",
  // ── Asset click URLs ──────────────────────────────────────────────────────
  destination_url_theme_3_asset_one: "destination_url_theme_3_asset_one",
  destination_url_theme_3_asset_two: "destination_url_theme_3_asset_two",
  destination_url_theme_4_asset_one: "destination_url_theme_4_asset_one",
  destination_url_theme_4_asset_two: "destination_url_theme_4_asset_two",
  destination_url_theme_5_asset_one: "destination_url_theme_5_asset_one",
  destination_url_theme_5_asset_two: "destination_url_theme_5_asset_two",
};