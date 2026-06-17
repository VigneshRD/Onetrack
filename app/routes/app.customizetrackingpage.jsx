import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
    Page,
    Layout,
    Card,
    FormLayout,
    TextField,
    Button,
    Banner,
    Text,
    BlockStack,
    InlineStack,
    Box,
    Divider,
    Badge,
    Spinner,
    Toast,
    Frame,
    Modal,
    Icon,
    Tooltip,
    Grid,
    Thumbnail,
    DropZone,
    Checkbox,
} from '@shopify/polaris';
import {
    ExternalIcon,
    ClipboardIcon,
    ViewIcon,
    SaveIcon,
    DeleteIcon,
    InfoIcon,
} from '@shopify/polaris-icons';
import { customTrackingService } from '../../src/services/customTrackingService';
import { PORTAL_ASSETS_BASE } from "../../src/config/assets";

// ─── Constants ────────────────────────────────────────────────────────────────
const TRACKING_HOST_SUFFIX = "lateshipment.com";

// Per-theme brand image dimension constraints
const BRAND_IMAGE_CONSTRAINTS = {
    standard: { maxW: 1920, maxH: 1080, hint: "310×331px recommended. Max 1920×1080. JPG, PNG, GIF" },
    timeline: { maxW: 1920, maxH: 1080, hint: "Img 1: 466×321px · Img 2: 962×328px. Max 1920×1080. JPG, PNG, GIF" },
    pristine: { maxW: 490, maxH: 295, hint: "490×295px max. JPG, PNG, GIF" },
};

const LOGO_CONSTRAINTS = {
    standard: { maxW: 200, maxH: 100 },
    timeline: { maxW: 200, maxH: 100 },
    builder: { maxW: 200, maxH: 100 },
    pristine: { maxW: 1920, maxH: 1080 },
};

const LAYOUT_PREVIEW_IMG = {
    standard: `${PORTAL_ASSETS_BASE}/portal_assets/images/themes/theme3.png`,
    timeline: `${PORTAL_ASSETS_BASE}/portal_assets/images/themes/theme4.png`,
    pristine: `${PORTAL_ASSETS_BASE}/portal_assets/images/themes/theme5.png`,
};

// ─── Validation helpers ───────────────────────────────────────────────────────
const IS_URL_RE = /^(http(s)?:\/\/)[\w.-]+(?:\.[\w.-]+)+[\w\-._~:/?#[\]@!$&'()*+,;=.]+$/;
const IS_VALID_URL_RE = /(http|https):\/\/(\w+:{0,1}\w*)?(\S+)(:[0-9]+)?(\/|(\/[\w#!:.?+=&%!\-/]))?/;
const ALPHANUM_RE = /^[a-zA-Z0-9\-/]*$/;

const isUrl = (s) => IS_URL_RE.test(s);
const isValidUrl = (s) => IS_VALID_URL_RE.test(s);

// Async image dimension validator
function validateImageDimensions(file, { maxW, maxH, minW, minH }) {
    return new Promise((resolve) => {
        const url = URL.createObjectURL(file);
        const img = new Image();
        img.onload = () => {
            URL.revokeObjectURL(url);
            const { naturalWidth: w, naturalHeight: h } = img;
            if (minW && w < minW) { resolve(`Width must be at least ${minW}px (uploaded: ${w}px)`); return; }
            if (minH && h < minH) { resolve(`Height must be at least ${minH}px (uploaded: ${h}px)`); return; }
            if (maxW && w > maxW) { resolve(`Width must not exceed ${maxW}px (uploaded: ${w}px)`); return; }
            if (maxH && h > maxH) { resolve(`Height must not exceed ${maxH}px (uploaded: ${h}px)`); return; }
            resolve(null);
        };
        img.onerror = () => { URL.revokeObjectURL(url); resolve(null); };
        img.src = url;
    });
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function normalizeSubdomain(v) {
    return v.trim().toLowerCase()
        .replace(/\s+/g, "-")
        .replace(/[^a-z0-9-]/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-/, "")
        .replace(/-$/, "");
}

function getTrackingPageUrl(c) {
    const sub = c.subdomain;
    return sub ? `https://${sub}.${TRACKING_HOST_SUFFIX}` : `https://${TRACKING_HOST_SUFFIX}`;
}

function backendThemeToLayout(id) {
    return ({ "3": "standard", "4": "timeline", "5": "pristine", "6": "builder" })[String(id)] ?? "standard";
}

// ─── Default state ────────────────────────────────────────────────────────────
function getDefault() {
    return {
        subdomain: "",
        layout: "standard",
        branding: {
            logoFile: null,
            faviconFile: null,
            logoClickUrl: "",
            headerText: "",
            stickyBannerText: "",
            headerColor: "#026BB2",
            bannerImageFile: null,
            brandImageFiles: [null, null],
            brandImageUrls: ["", ""],
        },
        enhancements: {
            enableRebuy: false,
            rebuyApiKey: "",
            enableNosto: false,
            nostoApiKey: "",
        },
        footer: { contactUrl: "", termsUrl: "", privacyUrl: "" },
        social: { facebook: "", twitter: "", instagram: "", linkedin: "", youtube: "", pinterest: "" },
        googleAnalyticsId: "",
        shopifyEmbedCode: "",
        showStickyBanner: false,
        planLocked: false,
        isDemoUser: false,
    };
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SectionCard({ title, description, children }) {
    return (
        <Card>
            <BlockStack gap="400">
                <BlockStack gap="200">
                    <Text variant="headingMd" as="h2">{title}</Text>
                    <Text variant="bodyMd" as="p" tone="subdued">{description}</Text>
                </BlockStack>
                {children}
            </BlockStack>
        </Card>
    );
}

// ─── AssetUploadTile ──────────────────────────────────────────────────────────
function AssetUploadTile({ label, hint, accept, value, onChange, onError, maxW, maxH, minW, minH, s3BaseUrl }) {
    const [files, setFiles] = useState([]);
    const [previewUrl, setPreviewUrl] = useState(null);

    useEffect(() => {
        if (value instanceof File) {
            const url = URL.createObjectURL(value);
            setPreviewUrl(url);
            return () => URL.revokeObjectURL(url);
        }
        if (typeof value === "string" && value) {
            setPreviewUrl(s3BaseUrl ? s3BaseUrl + value : null);
            return;
        }
        setPreviewUrl(null);
    }, [value, s3BaseUrl]);

    const handleDrop = useCallback(
        async (_dropFiles, acceptedFiles, _rejectedFiles) => {
            const file = acceptedFiles[0];
            if (!file) {
                onChange(null);
                return;
            }

            if ((maxW || maxH || minW || minH) && file.type.startsWith("image/")) {
                const err = await validateImageDimensions(file, { maxW, maxH, minW, minH });
                if (err) {
                    if (onError) onError(err);
                    return;
                }
            }

            setFiles(acceptedFiles);
            onChange(file);
        },
        [maxW, maxH, minW, minH, onChange, onError]
    );

    const fileUpload = !files.length && <DropZone.FileUpload />;

    const uploadedFile = value && previewUrl && (
        <BlockStack gap="200" align="center">
            <Thumbnail
                size="large"
                alt={label}
                source={previewUrl}
            />
            {value instanceof File && (
                <Text variant="bodySm" tone="subdued">
                    {(value.size / 1024).toFixed(1)} KB
                </Text>
            )}
        </BlockStack>
    );

    return (
        <BlockStack gap="200">
            <InlineStack align="space-between" blockAlign="center">
                <BlockStack gap="100">
                    <Text variant="bodyMd" fontWeight="semibold">{label}</Text>
                    <Text variant="bodySm" tone="subdued">{hint}</Text>
                </BlockStack>
                {value && (
                    <Button
                        icon={DeleteIcon}
                        onClick={() => {
                            setFiles([]);
                            onChange(null);
                        }}
                        size="slim"
                    />
                )}
            </InlineStack>
            <DropZone
                accept={accept}
                type="image"
                onDrop={handleDrop}
                allowMultiple={false}
            >
                {uploadedFile || fileUpload}
            </DropZone>
        </BlockStack>
    );
}

// ─── LayoutPicker ─────────────────────────────────────────────────────────────
const LAYOUT_META = {
    standard: { label: "Standard", description: "Status overview, shipment details, and map modules." },
    timeline: { label: "Timeline", description: "Story-like progress steps with a clean timeline." },
    pristine: { label: "Pristine", description: "Premium visuals with space for merchandising blocks." },
    builder: { label: "Builder", description: "Fully custom layout built with the page builder." },
};

function LayoutPicker({ value, onChange }) {
    const [previewModal, setPreviewModal] = useState(null);

    return (
        <>
            <BlockStack gap="300">
                {Object.keys(LAYOUT_META).map((layout) => {
                    const active = value === layout;
                    const { label, description } = LAYOUT_META[layout];

                    return (
                        <div
                            key={layout}
                            onClick={() => onChange(layout)}
                            style={{
                                padding: '16px',
                                border: active ? '2px solid #000' : '1px solid #e1e3e5',
                                borderRadius: '12px',
                                cursor: 'pointer',
                                backgroundColor: active ? '#f6f6f7' : '#fff',
                                transition: 'all 0.2s',
                            }}
                        >
                            <InlineStack align="space-between" blockAlign="center">
                                <BlockStack gap="100">
                                    <Text variant="bodyMd" fontWeight="semibold">{label}</Text>
                                    <Text variant="bodySm" tone="subdued">{description}</Text>
                                </BlockStack>
                                {active && layout !== "builder" && (
                                    <Button
                                        plain
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setPreviewModal(layout);
                                        }}
                                    >
                                        Preview
                                    </Button>
                                )}
                            </InlineStack>
                        </div>
                    );
                })}
            </BlockStack>

            <Modal
                open={!!previewModal}
                onClose={() => setPreviewModal(null)}
                title={`${previewModal && LAYOUT_META[previewModal].label} Layout Preview`}
            >
                <Modal.Section>
                    <Box padding="400">
                        <img
                            src={previewModal ? LAYOUT_PREVIEW_IMG[previewModal] : ""}
                            alt="Layout preview"
                            style={{ maxWidth: '100%', borderRadius: '8px' }}
                        />
                    </Box>
                </Modal.Section>
            </Modal>
        </>
    );
}

function IntegrationKeyRow({ title, description, checked, apiKey, onCheckedChange, onApiKeyChange }) {
    return (
        <Card>
            <BlockStack gap="300">
                <InlineStack align="space-between" blockAlign="start">
                    <BlockStack gap="100">
                        <Checkbox
                            label={title}
                            checked={checked}
                            onChange={onCheckedChange}
                        />
                        <Text variant="bodySm" tone="subdued">{description}</Text>
                    </BlockStack>
                </InlineStack>
                {checked && (
                    <TextField
                        value={apiKey}
                        onChange={onApiKeyChange}
                        placeholder="API key"
                        autoComplete="off"
                    />
                )}
            </BlockStack>
        </Card>
    );
}

// ─── Plan Locked Overlay ──────────────────────────────────────────────────────
function PlanLockedOverlay() {
    return (
        <div
            style={{
                position: 'absolute',
                inset: 0,
                zIndex: 10,
                backgroundColor: 'rgba(239,239,239,0.72)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '12px',
            }}
        >
            <Card>
                <BlockStack gap="300" align="center">
                    <Text variant="headingMd" as="h2">Feature Locked</Text>
                    <Text variant="bodyMd" as="p" alignment="center">
                        To start using this feature, unlock <strong>Legacy Pro</strong> on your current plan.
                    </Text>
                    <Button
                        variant="primary"
                        url="/legacyplan"
                    >
                        Upgrade Plan
                    </Button>
                </BlockStack>
            </Card>
        </div>
    );
}

export default function CustomizeTrackingPage() {
    const [config, setConfig] = useState(getDefault);
    const [tokenValue, setTokenValue] = useState("");
    const [saving, setSaving] = useState(false);
    const [previewing, setPreviewing] = useState(false);
    const [loading, setLoading] = useState(true);
    const [toastActive, setToastActive] = useState(false);
    const [toastMessage, setToastMessage] = useState("");
    const [toastError, setToastError] = useState(false);
    const [errors, setErrors] = useState({});
    const [s3BaseUrl, setS3BaseUrl] = useState("");

    // Custom domain modal
    const [domainModal, setDomainModal] = useState(false);
    const [domainSslLoading, setDomainSslLoading] = useState(false);
    const [domainSslSaving, setDomainSslSaving] = useState(false);
    const [domainSslData, setDomainSslData] = useState({
        customDomainName: "",
        privateKey: "",
        primaryCert: "",
        intermediaryCert: "",
    });

    const trackingUrl = useMemo(() => getTrackingPageUrl(config), [config]);
    const isBuilder = config.layout === "builder";
    const isPristine = config.layout === "pristine";

    // State updaters
    const upd = (p) => setConfig((c) => ({ ...c, ...p }));
    const updB = (p) => setConfig((c) => ({ ...c, branding: { ...c.branding, ...p } }));
    const updE = (p) => setConfig((c) => ({ ...c, enhancements: { ...c.enhancements, ...p } }));
    const updF = (p) => setConfig((c) => ({ ...c, footer: { ...c.footer, ...p } }));
    const updS = (p) => setConfig((c) => ({ ...c, social: { ...c.social, ...p } }));

    const notify = (msg, isError = false) => {
        setToastMessage(msg);
        setToastError(isError);
        setToastActive(true);
    };

    const clearErr = (key) => setErrors((e) => { const n = { ...e }; delete n[key]; return n; });

    // Load saved config
    useEffect(() => {
        customTrackingService
            .getCustomSettings()
            .then((data) => {
                if (!data) return;
                if (data.s3url) setS3BaseUrl(data.s3url);
                setConfig((prev) => ({
                    ...prev,
                    subdomain: data.domain ?? prev.subdomain,
                    layout: backendThemeToLayout(data.themeid),
                    branding: {
                        ...prev.branding,
                        logoFile: data.logo ?? null,
                        faviconFile: data.favicon ?? null,
                        logoClickUrl: data.logo_url ?? "",
                        headerText: data.header ?? "",
                        stickyBannerText: data.stickeycontent ?? "",
                        headerColor: data.headercolor ?? "#026BB2",
                        bannerImageFile: data.banner ?? null,
                        brandImageFiles: [
                            data.assetone ?? data.assetthree ?? data.assetfive ?? null,
                            data.assettwo ?? data.assetfour ?? data.assetsix ?? null,
                        ],
                        brandImageUrls: [
                            data.destination_url_theme_3_asset_one ??
                            data.destination_url_theme_4_asset_one ??
                            data.destination_url_theme_5_asset_one ?? "",
                            data.destination_url_theme_3_asset_two ??
                            data.destination_url_theme_4_asset_two ??
                            data.destination_url_theme_5_asset_two ?? "",
                        ],
                    },
                    enhancements: {
                        ...prev.enhancements,
                        enableRebuy: !!(data.rebuy_api_key),
                        rebuyApiKey: data.rebuy_api_key ?? "",
                        enableNosto: !!(data.nosto_api_key),
                        nostoApiKey: data.nosto_api_key ?? "",
                    },
                    footer: {
                        contactUrl: data.footer_contactpage ?? "",
                        termsUrl: data.footer_termspage ?? "",
                        privacyUrl: data.footer_privacypage ?? "",
                    },
                    social: {
                        facebook: data.footer_facebook ?? "",
                        twitter: data.footer_twitter ?? "",
                        instagram: data.footer_instagram ?? "",
                        linkedin: data.footer_linkedin ?? "",
                        youtube: data.footer_youtube ?? "",
                        pinterest: data.footer_pinterest ?? "",
                    },
                    googleAnalyticsId: data.analytics_id ?? "",
                    shopifyEmbedCode: data.shopify_embed_code ?? "",
                    showStickyBanner: data.show_sticky_banner ?? false,
                    planLocked: data.branded_tracking_page === "N",
                    isDemoUser: data.is_demo_user ?? false,
                }));
            })
            .catch((err) => notify(err.message ?? "Failed to load settings.", true))
            .finally(() => setLoading(false));
    }, []);

   
    function validate() {
        const errs = {};

        const domain = config.subdomain.trim();
        if (!domain) {
            errs.subdomain = "Tracking page URL is required.";
        } else if (!ALPHANUM_RE.test(domain)) {
            errs.subdomain = "Domain should contain only letters, numbers and hyphens.";
        }

        if (!isBuilder && !config.branding.headerText.trim()) {
            errs.headerText = "Header message is required.";
        }

        const sticky = config.branding.stickyBannerText.trim();
        if (sticky) {
            if (sticky.length < 10) errs.stickyBannerText = "Sticky banner must be at least 10 characters.";
            if (sticky.length > 200) errs.stickyBannerText = "Sticky banner must not exceed 200 characters.";
        }

        if (config.branding.logoClickUrl.trim() && !isValidUrl(config.branding.logoClickUrl.trim())) {
            errs.logoClickUrl = "Logo click URL is not in the correct format.";
        }

        if (config.footer.contactUrl.trim() && !isUrl(config.footer.contactUrl.trim())) {
            errs.contactUrl = "Contact URL is not in the correct format.";
        }
        if (config.footer.termsUrl.trim() && !isUrl(config.footer.termsUrl.trim())) {
            errs.termsUrl = "Terms URL is not in the correct format.";
        }
        if (config.footer.privacyUrl.trim() && !isUrl(config.footer.privacyUrl.trim())) {
            errs.privacyUrl = "Privacy URL is not in the correct format.";
        }

        ["facebook", "twitter", "instagram", "linkedin", "youtube", "pinterest"].forEach((field) => {
            const val = config.social[field].trim();
            if (val && isUrl(val)) {
                const name = field.charAt(0).toUpperCase() + field.slice(1);
                errs[`social_${field}`] = `Enter only your ${name} username, not a full URL.`;
            }
        });

        config.branding.brandImageUrls.forEach((url, idx) => {
            if (url.trim() && !isValidUrl(url.trim())) {
                errs[`brandUrl_${idx}`] = `Brand image ${idx + 1} click URL is not in the correct format.`;
            }
        });

        return errs;
    }

    // Save
    async function handleSave() {
        if (config.isDemoUser) return;
        const errs = validate();
        if (Object.keys(errs).length > 0) {
            setErrors(errs);
            notify("Please fix the errors before saving.", true);
            return;
        }
        setErrors({});
        setSaving(true);
        try {
            const result = await customTrackingService.saveCustomSettings(config, tokenValue);
            if (result.newToken) setTokenValue(result.newToken);
            notify(result.message, result.type !== "success");
        } catch (err) {
            notify(err.message ?? "Network error. Please try again.", true);
        } finally {
            setSaving(false);
        }
    }

    // Auth-gate helper
    const WEBAPP_BASE_URL = import.meta.env.VITE_WEBAPP_BASE_URL ?? "https://devappservice.lateshipment.com";

    async function authoriseAndOpen(intent, previewToken = null) {
        const token = sessionStorage.getItem('ls_access_token');;
        if (!token) {
            notify("Authentication required.", true);
            return;
        }

        const body = {
            intent,
            redirectBackUrl: window.location.href,
        };
        if (intent === "preview" && previewToken) body.previewToken = previewToken;

        const res = await fetch(
            `${import.meta.env.VITE_API_BASE_URL}/customsettingsapi/authoriseRedirect`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`,
                },
                body: JSON.stringify(body),
            }
        );

        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error(err.message ?? `Auth error: ${res.status}`);
        }

        const data = await res.json();
        if (!data.success || !data.redirectUrl) {
            throw new Error(data.message ?? "Failed to authorise redirect.");
        }

        window.open(data.redirectUrl, "_blank", "noopener,noreferrer");
    }

    // Preview
    async function handlePreview() {
        if (config.isDemoUser) return;
        const errs = validate();
        if (Object.keys(errs).length > 0) {
            setErrors(errs);
            notify("Please fix the errors before previewing.", true);
            return;
        }
        setErrors({});
        setPreviewing(true);
        try {
            const result = await customTrackingService.previewCustomSettings(config, tokenValue);
            if (result.newToken) setTokenValue(result.newToken);
            if (result.type !== "success") {
                notify(result.message, true);
                return;
            }

            if (!result.previewToken) {
                notify("Preview prepared but no token received. Please try again.", true);
                return;
            }

            await authoriseAndOpen("preview", result.previewToken);
            notify("Preview opened in a new tab.");
        } catch (err) {
            notify(err.message ?? "Network error.", true);
        } finally {
            setPreviewing(false);
        }
    }

    // Custom domain modal handlers
    async function handleDomainModalOpen() {
        setDomainModal(true);
        setDomainSslLoading(true);
        try {
            const token = sessionStorage.getItem('ls_access_token');;
            const res = await fetch(
                `${import.meta.env.VITE_API_BASE_URL}/domainsslapi/getdomainssl`,
                {
                    method: "GET",
                    headers: {
                        "Content-Type": "application/json",
                        ...(token ? { Authorization: `Bearer ${token}` } : {}),
                    },
                }
            );
            if (res.ok) {
                const data = await res.json();
                setDomainSslData({
                    customDomainName: data.cus_domainname ?? "",
                    privateKey: data.private_key ?? "",
                    primaryCert: data.primary_certificate ?? "",
                    intermediaryCert: data.intermediary_certificate ?? "",
                });
            }
        } catch {
            // silently ignore
        } finally {
            setDomainSslLoading(false);
        }
    }

    async function handleDomainSslSave() {
        if (!domainSslData.customDomainName.trim()) {
            notify("Custom domain name is required.", true);
            return;
        }
        setDomainSslSaving(true);
        try {
            const token = sessionStorage.getItem('ls_access_token');;
            const fd = new FormData();
            fd.append("customerdomainname", domainSslData.customDomainName.trim());
            fd.append("privatekey", domainSslData.privateKey.trim());
            fd.append("primarycertificate", domainSslData.primaryCert.trim());
            fd.append("intermediarycertificate", domainSslData.intermediaryCert.trim());
            const res = await fetch(
                `${import.meta.env.VITE_API_BASE_URL}/domainsslapi/domainsslview`,
                {
                    method: "POST",
                    headers: token ? { Authorization: `Bearer ${token}` } : {},
                    body: fd,
                }
            );
            if (!res.ok) throw new Error(`Server error: ${res.status}`);
            const data = await res.json();
            if (data.success === false) throw new Error(data.message ?? "Save failed");
            notify("Your details will be updated in 24–48 hours. Thank you");
            setDomainModal(false);
        } catch (err) {
            notify(err.message ?? "Failed to save custom domain settings.", true);
        } finally {
            setDomainSslSaving(false);
        }
    }

    if (loading) {
        return (
            <Frame>
                <Page>
                    <div style={{ display: 'flex', justifyContent: 'center', padding: '60px' }}>
                        <Spinner size="large" />
                    </div>
                </Page>
            </Frame>
        );
    }

    const brandConstraints = BRAND_IMAGE_CONSTRAINTS[config.layout] ?? BRAND_IMAGE_CONSTRAINTS.standard;
    const logoConstraints = LOGO_CONSTRAINTS[config.layout] ?? LOGO_CONSTRAINTS.standard;

    const toastMarkup = toastActive ? (
        <Toast
            content={toastMessage}
            onDismiss={() => setToastActive(false)}
            error={toastError}
        />
    ) : null;

    // Render
    return (
        <Frame>
            <Page
                title="Customize tracking page"
                subtitle="Create an on-brand tracking experience that keeps customers informed, helps reduce support tickets, and unlocks opportunities for cross-sell."
                primaryAction={{
                    content: saving ? "Saving..." : "Update",
                    onAction: handleSave,
                    loading: saving,
                    disabled: previewing || config.isDemoUser,
                    icon: SaveIcon,
                }}
                secondaryActions={[
                    {
                        content: previewing ? "Previewing..." : "Preview",
                        onAction: handlePreview,
                        loading: previewing,
                        disabled: saving || config.isDemoUser,
                        icon: ViewIcon,
                    },
                ]}
            >
                <Layout>
                    {/* Plan Locked Overlay */}
                    {config.planLocked && (
                        <Layout.Section>
                            <div style={{ position: 'relative' }}>
                                <PlanLockedOverlay />
                            </div>
                        </Layout.Section>
                    )}

                    <Layout.Section>
                        <div style={{
                            opacity: config.planLocked ? 0.5 : 1,
                            pointerEvents: config.planLocked ? 'none' : 'auto',
                        }}>
                            <BlockStack gap="500">
                                {/* Tracking page domain */}
                                <SectionCard
                                    title="Tracking page domain"
                                    description="Choose a URL that customers will recognize."
                                >
                                    <FormLayout>
                                        <FormLayout.Group>
                                            <TextField
                                                label="Subdomain"
                                                value={config.subdomain}
                                                onChange={(value) => {
                                                    upd({ subdomain: normalizeSubdomain(value) });
                                                    clearErr("subdomain");
                                                }}
                                                placeholder="my-store"
                                                error={errors.subdomain}
                                                autoComplete="off"
                                                connectedRight={
                                                    <div style={{
                                                        padding: '8px 12px',
                                                        background: '#f6f6f7',
                                                        border: '1px solid #c9cccf',
                                                        borderLeft: 'none',
                                                        borderRadius: '0 8px 8px 0',
                                                    }}>
                                                        <Text variant="bodyMd" tone="subdued">
                                                            .{TRACKING_HOST_SUFFIX}
                                                        </Text>
                                                    </div>
                                                }
                                            />
                                        </FormLayout.Group>
                                    </FormLayout>

                                    <Box paddingBlockStart="400">
                                        <Card background="bg-surface-secondary">
                                            <InlineStack align="space-between" blockAlign="center" wrap={false}>
                                                <Button
                                                    plain
                                                    icon={ExternalIcon}
                                                    onClick={handleDomainModalOpen}
                                                >
                                                    Use a custom domain
                                                </Button>
                                                <InlineStack gap="200">
                                                    <Button
                                                        icon={ClipboardIcon}
                                                        onClick={() =>
                                                            navigator.clipboard
                                                                .writeText(trackingUrl)
                                                                .then(() => notify("Copied to clipboard"))
                                                                .catch(() => notify("Copy failed", true))
                                                        }
                                                    >
                                                        Copy URL
                                                    </Button>
                                                    <Button
                                                        icon={ExternalIcon}
                                                        onClick={() =>
                                                            window.open(trackingUrl, "_blank", "noopener,noreferrer")
                                                        }
                                                    >
                                                        Open
                                                    </Button>
                                                </InlineStack>
                                            </InlineStack>
                                        </Card>
                                    </Box>
                                </SectionCard>

                                {/* Layout */}
                                <SectionCard
                                    title="Layout"
                                    description="Select the structure that best matches your brand."
                                >
                                    <LayoutPicker value={config.layout} onChange={(layout) => upd({ layout })} />
                                </SectionCard>

                                {/* Branding assets */}
                                <SectionCard
                                    title="Branding assets"
                                    description="Upload your logo and favicon."
                                >
                                    <BlockStack gap="400">
                                        <FormLayout>
                                            <FormLayout.Group condensed>
                                                {!isBuilder && (
                                                    <AssetUploadTile
                                                        label="Logo"
                                                        hint={isPristine ? "Formats: JPG, PNG, GIF" : "Max 200×100px. JPG, PNG, GIF"}
                                                        accept="image/*"
                                                        value={config.branding.logoFile}
                                                        maxW={logoConstraints.maxW}
                                                        maxH={logoConstraints.maxH}
                                                        onError={(msg) => notify(`Logo: ${msg}`, true)}
                                                        onChange={(f) => updB({ logoFile: f })}
                                                        s3BaseUrl={s3BaseUrl}
                                                    />
                                                )}
                                                <AssetUploadTile
                                                    label="Favicon"
                                                    hint="Max 32×32px. ICO, PNG"
                                                    accept=".png,.ico,image/png,image/x-icon"
                                                    value={config.branding.faviconFile}
                                                    maxW={32}
                                                    maxH={32}
                                                    onError={(msg) => notify(`Favicon: ${msg}`, true)}
                                                    onChange={(f) => updB({ faviconFile: f })}
                                                    s3BaseUrl={s3BaseUrl}
                                                />
                                            </FormLayout.Group>
                                        </FormLayout>

                                        {/* Builder: Custom Page Builder button */}
                                        {isBuilder && (
                                            <Button
                                                variant="primary"
                                                fullWidth
                                                onClick={async () => {
                                                    try {
                                                        await authoriseAndOpen("builder");
                                                    } catch (err) {
                                                        notify(err.message ?? "Could not open page builder.", true);
                                                    }
                                                }}
                                            >
                                                Custom Page Builder <sup>(beta)</sup>
                                            </Button>
                                        )}

                                        {/* Non-builder branding fields */}
                                        {!isBuilder && (
                                            <BlockStack gap="400">
                                                <FormLayout>
                                                    <FormLayout.Group>
                                                        <TextField
                                                            label="Logo click URL"
                                                            value={config.branding.logoClickUrl}
                                                            onChange={(value) => {
                                                                updB({ logoClickUrl: value });
                                                                clearErr("logoClickUrl");
                                                            }}
                                                            placeholder="https://yourbrand.com"
                                                            error={errors.logoClickUrl}
                                                            autoComplete="off"
                                                        />
                                                        <TextField
                                                            label={
                                                                <InlineStack gap="100">
                                                                    <span>Header label</span>
                                                                    <Text tone="critical">*</Text>
                                                                </InlineStack>
                                                            }
                                                            value={config.branding.headerText}
                                                            onChange={(value) => {
                                                                updB({ headerText: value });
                                                                clearErr("headerText");
                                                            }}
                                                            placeholder="Track your package"
                                                            error={errors.headerText}
                                                            autoComplete="off"
                                                        />
                                                    </FormLayout.Group>

                                                    {config.showStickyBanner && (
                                                        <TextField
                                                            label="Sticky banner"
                                                            value={config.branding.stickyBannerText}
                                                            onChange={(value) => {
                                                                updB({ stickyBannerText: value });
                                                                clearErr("stickyBannerText");
                                                            }}
                                                            placeholder="Add your banner text here"
                                                            multiline={2}
                                                            error={errors.stickyBannerText}
                                                            helpText="10–200 characters"
                                                            autoComplete="off"
                                                        />
                                                    )}

                                                    <div>
                                                        <Text variant="bodyMd" fontWeight="semibold">Header color</Text>
                                                        <Box paddingBlockStart="200">
                                                            <InlineStack gap="200" blockAlign="center">
                                                                <input
                                                                    type="color"
                                                                    value={config.branding.headerColor}
                                                                    onChange={(e) => updB({ headerColor: e.target.value })}
                                                                    style={{
                                                                        width: '44px',
                                                                        height: '40px',
                                                                        border: '1px solid #c9cccf',
                                                                        borderRadius: '8px',
                                                                        cursor: 'pointer',
                                                                    }}
                                                                />
                                                                <div style={{ flex: 1 }}>
                                                                    <TextField
                                                                        value={config.branding.headerColor}
                                                                        onChange={(value) => updB({ headerColor: value })}
                                                                        placeholder="#026BB2"
                                                                        autoComplete="off"
                                                                    />
                                                                </div>
                                                            </InlineStack>
                                                        </Box>
                                                    </div>
                                                </FormLayout>

                                                {/* Banner image for Pristine */}
                                                {isPristine && (
                                                    <AssetUploadTile
                                                        label="Banner image"
                                                        hint="Min 1600×500px, max 1920×1080px. JPG, PNG, GIF"
                                                        accept="image/*"
                                                        value={config.branding.bannerImageFile}
                                                        minW={1600}
                                                        minH={500}
                                                        maxW={1920}
                                                        maxH={1080}
                                                        onError={(msg) => notify(`Banner: ${msg}`, true)}
                                                        onChange={(f) => updB({ bannerImageFile: f })}
                                                        s3BaseUrl={s3BaseUrl}
                                                    />
                                                )}

                                                {/* Brand images */}
                                                <BlockStack gap="300">
                                                    <Text variant="headingSm" as="h3">Brand images</Text>
                                                    <Text variant="bodySm" tone="subdued">{brandConstraints.hint}</Text>
                                                    <FormLayout>
                                                        <FormLayout.Group>
                                                            {config.branding.brandImageFiles.map((file, idx) => (
                                                                <BlockStack gap="300" key={idx}>
                                                                    <AssetUploadTile
                                                                        label={`Brand image ${idx + 1}`}
                                                                        hint={brandConstraints.hint}
                                                                        accept="image/*"
                                                                        value={file}
                                                                        maxW={brandConstraints.maxW}
                                                                        maxH={brandConstraints.maxH}
                                                                        onError={(msg) => notify(`Brand image ${idx + 1}: ${msg}`, true)}
                                                                        s3BaseUrl={s3BaseUrl}
                                                                        onChange={(f) =>
                                                                            setConfig((p) => ({
                                                                                ...p,
                                                                                branding: {
                                                                                    ...p.branding,
                                                                                    brandImageFiles: p.branding.brandImageFiles.map(
                                                                                        (x, i) => (i === idx ? f : x)
                                                                                    ),
                                                                                },
                                                                            }))
                                                                        }
                                                                    />
                                                                    <TextField
                                                                        label={`Click URL for image ${idx + 1}`}
                                                                        value={config.branding.brandImageUrls[idx] ?? ""}
                                                                        onChange={(value) => {
                                                                            clearErr(`brandUrl_${idx}`);
                                                                            setConfig((p) => ({
                                                                                ...p,
                                                                                branding: {
                                                                                    ...p.branding,
                                                                                    brandImageUrls: p.branding.brandImageUrls.map((u, i) =>
                                                                                        i === idx ? value : u
                                                                                    ),
                                                                                },
                                                                            }));
                                                                        }}
                                                                        placeholder="https://yourbrand.com/promo"
                                                                        error={errors[`brandUrl_${idx}`]}
                                                                        autoComplete="off"
                                                                    />
                                                                </BlockStack>
                                                            ))}
                                                        </FormLayout.Group>
                                                    </FormLayout>
                                                </BlockStack>
                                            </BlockStack>
                                        )}
                                    </BlockStack>
                                </SectionCard>

                                {/* Enhancements - shown for ALL layouts */}
                                <SectionCard
                                    title="Enhancements"
                                    description="Turn on modules that drive engagement and reduce support."
                                >
                                    <BlockStack gap="300">
                                        <IntegrationKeyRow
                                            title="Product recommendations with Rebuy"
                                            description="Paste your API key to pull personalized recommendations."
                                            checked={config.enhancements.enableRebuy}
                                            apiKey={config.enhancements.rebuyApiKey}
                                            onCheckedChange={(v) => updE({ enableRebuy: v })}
                                            onApiKeyChange={(v) => updE({ rebuyApiKey: v })}
                                        />
                                        <IntegrationKeyRow
                                            title="Product recommendations with Nosto"
                                            description="Paste your API key to pull personalized recommendations."
                                            checked={config.enhancements.enableNosto}
                                            apiKey={config.enhancements.nostoApiKey}
                                            onCheckedChange={(v) => updE({ enableNosto: v })}
                                            onApiKeyChange={(v) => updE({ nostoApiKey: v })}
                                        />
                                    </BlockStack>
                                </SectionCard>

                                {/* Footer & social - HIDDEN for Builder */}
                                {!isBuilder && (
                                    <SectionCard
                                        title="Footer & social"
                                        description="Add links and social handles to build trust."
                                    >
                                        <BlockStack gap="400">
                                            <FormLayout>
                                                <FormLayout.Group>
                                                    <TextField
                                                        label="Contact Us Page"
                                                        value={config.footer.contactUrl}
                                                        onChange={(value) => {
                                                            updF({ contactUrl: value });
                                                            clearErr("contactUrl");
                                                        }}
                                                        placeholder="https://yourbrand.com/contact"
                                                        error={errors.contactUrl}
                                                        autoComplete="off"
                                                    />
                                                    <TextField
                                                        label="Terms And Conditions Page"
                                                        value={config.footer.termsUrl}
                                                        onChange={(value) => {
                                                            updF({ termsUrl: value });
                                                            clearErr("termsUrl");
                                                        }}
                                                        placeholder="https://yourbrand.com/terms"
                                                        error={errors.termsUrl}
                                                        autoComplete="off"
                                                    />
                                                    <TextField
                                                        label="Privacy Policy Page"
                                                        value={config.footer.privacyUrl}
                                                        onChange={(value) => {
                                                            updF({ privacyUrl: value });
                                                            clearErr("privacyUrl");
                                                        }}
                                                        placeholder="https://yourbrand.com/privacy"
                                                        error={errors.privacyUrl}
                                                        autoComplete="off"
                                                    />
                                                </FormLayout.Group>
                                            </FormLayout>

                                            <Divider />

                                            <FormLayout>
                                                <FormLayout.Group>
                                                    {[
                                                        { key: "facebook", label: "Facebook" },
                                                        { key: "twitter", label: "Twitter" },
                                                        { key: "instagram", label: "Instagram" },
                                                        { key: "linkedin", label: "LinkedIn" },
                                                        { key: "youtube", label: "YouTube" },
                                                        { key: "pinterest", label: "Pinterest" },
                                                    ].map(({ key: platform, label }) => (
                                                        <TextField
                                                            key={platform}
                                                            label={label}
                                                            value={config.social[platform]}
                                                            onChange={(value) => {
                                                                updS({ [platform]: value });
                                                                clearErr(`social_${platform}`);
                                                            }}
                                                            placeholder={`${label} username`}
                                                            error={errors[`social_${platform}`]}
                                                            helpText="Username only — do not paste a full URL"
                                                            autoComplete="off"
                                                        />
                                                    ))}
                                                </FormLayout.Group>
                                            </FormLayout>
                                        </BlockStack>
                                    </SectionCard>
                                )}

                                {/* Analytics - shown for ALL layouts */}
                                <SectionCard
                                    title="Analytics & embed"
                                    description="Measure performance and embed tracking on Shopify."
                                >
                                    <BlockStack gap="400">
                                        <TextField
                                            label="Google Analytics ID"
                                            value={config.googleAnalyticsId}
                                            onChange={(value) => upd({ googleAnalyticsId: value })}
                                            placeholder="G-XXXXXXXXXX"
                                            autoComplete="off"
                                        />

                                        {config.shopifyEmbedCode && (
                                            <BlockStack gap="200">
                                                <Text variant="bodyMd" fontWeight="semibold">Tracking on Shopify</Text>
                                                <Box
                                                    padding="400"
                                                    background="bg-surface-secondary"
                                                    borderRadius="200"
                                                >
                                                    <pre style={{
                                                        fontFamily: 'monospace',
                                                        fontSize: '13px',
                                                        margin: 0,
                                                        whiteSpace: 'pre-wrap',
                                                        wordBreak: 'break-all',
                                                    }}>
                                                        {config.shopifyEmbedCode}
                                                    </pre>
                                                </Box>
                                                <InlineStack align="space-between">
                                                    <Text variant="bodySm" tone="subdued">
                                                        Add your LateShipment.com tracking page to your Shopify store.
                                                    </Text>
                                                    <Button
                                                        icon={ClipboardIcon}
                                                        onClick={() =>
                                                            navigator.clipboard
                                                                .writeText(config.shopifyEmbedCode)
                                                                .then(() => notify("Snippet copied"))
                                                                .catch(() => notify("Copy failed", true))
                                                        }
                                                    >
                                                        Copy snippet
                                                    </Button>
                                                </InlineStack>
                                            </BlockStack>
                                        )}
                                    </BlockStack>
                                </SectionCard>
                            </BlockStack>
                        </div>
                    </Layout.Section>
                </Layout>
            </Page>

            {/* Custom domain modal */}
            <Modal
                open={domainModal}
                onClose={() => setDomainModal(false)}
                title="Set up custom domain & SSL"
                primaryAction={{
                    content: domainSslSaving ? "Saving..." : "Save",
                    onAction: handleDomainSslSave,
                    loading: domainSslSaving,
                }}
                secondaryActions={[
                    {
                        content: "Cancel",
                        onAction: () => setDomainModal(false),
                    },
                ]}
            >
                <Modal.Section>
                    {domainSslLoading ? (
                        <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
                            <Spinner size="large" />
                        </div>
                    ) : (
                        <FormLayout>
                            <Text variant="bodyMd" as="p" tone="subdued">
                                Setting up a custom domain lets you use a URL like track.yourbrand.com instead of
                                username.lateshipment.com.
                            </Text>

                            <TextField
                                label="LateShipment domain name"
                                value="track.lateshipment.com"
                                disabled
                                autoComplete="off"
                            />

                            <TextField
                                label="Your custom domain name"
                                value={domainSslData.customDomainName}
                                onChange={(value) =>
                                    setDomainSslData((d) => ({ ...d, customDomainName: value }))
                                }
                                placeholder="track.yourbrand.com"
                                autoComplete="off"
                            />

                            <TextField
                                label="Private key"
                                value={domainSslData.privateKey}
                                onChange={(value) => setDomainSslData((d) => ({ ...d, privateKey: value }))}
                                placeholder="-- BEGIN PRIVATE KEY --"
                                multiline={3}
                                autoComplete="off"
                            />

                            <TextField
                                label="Primary certificate"
                                value={domainSslData.primaryCert}
                                onChange={(value) => setDomainSslData((d) => ({ ...d, primaryCert: value }))}
                                placeholder="-- BEGIN CERTIFICATE --"
                                multiline={3}
                                autoComplete="off"
                            />

                            <TextField
                                label="Intermediary certificate"
                                value={domainSslData.intermediaryCert}
                                onChange={(value) =>
                                    setDomainSslData((d) => ({ ...d, intermediaryCert: value }))
                                }
                                placeholder="-- BEGIN CERTIFICATE --"
                                multiline={3}
                                autoComplete="off"
                            />
                        </FormLayout>
                    )}
                </Modal.Section>
            </Modal>

            {toastMarkup}
        </Frame>
    );
}