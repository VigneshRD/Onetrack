import React, { useState, useEffect } from "react";
import {
    Page,
    Layout,
    Card,
    FormLayout,
    TextField,
    Select,
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
    Icon,
    Tooltip,
    ChoiceList,
} from '@shopify/polaris';
import { InfoIcon } from '@shopify/polaris-icons';
import { onetrackService } from '../../src/services/onetrackService';

// ─────────────────────────── Constants ───────────────────────────────────────
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

function authHeaders() {
    const token = sessionStorage.getItem('ls_access_token');
    const h = { "Content-Type": "application/x-www-form-urlencoded" };
    if (token) h["Authorization"] = `Bearer ${token}`;
    return h;
}

const WIDGET_TYPES = [
    { value: "trackNumOnly", label: "Input Box – Classic" },
    { value: "trackNumOnlyNew", label: "Input Box – Modern" },
    { value: "trackNumWithEmail", label: "Input Box – Modern (with Email Validation)" },
    { value: "prepopulated", label: "Pre-Populated Tracking" },
];

const SIZE_OPTIONS = [
    { value: "normal", label: "Medium" },
    { value: "small", label: "Small" },
    { value: "large", label: "Large" },
];

const decodeHtml = (html) => {
    const txt = document.createElement("textarea");
    txt.innerHTML = html;
    return txt.value;
};

// Only these types show width controls and Step 3 CSS snippet
const MODERN_TYPES = ["trackNumOnlyNew", "trackNumWithEmail"];

const STEP2_CODE =
    '<script src="https://app.lateshipment.com/cdn/trackingbtnls.js"></script> <script type="text/JavaScript"> displayTrackingWidget();</script>';
const STEP3_CODE =
    '<link rel="stylesheet" href="https://app.lateshipment.com/cdn/trackingbtnls.css"></link>';

// ─────────────────────────── Widget Preview Component ────────────────────────

function WidgetPreview({ widgetType, size, buttonColor }) {
    const buttonSize = size === "small" ? "slim" : size === "large" ? "large" : "medium";

    const buttonStyle = {
        backgroundColor: buttonColor,
        color: '#fff',
        border: 'none',
        padding: size === "small" ? '8px 16px' : size === "large" ? '14px 24px' : '10px 20px',
        borderRadius: '4px',
        cursor: 'pointer',
        fontSize: size === "small" ? '13px' : size === "large" ? '16px' : '14px',
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: '1px',
    };

    if (widgetType === "prepopulated") {
        return (
            <Box padding="400" background="bg-surface-secondary" borderRadius="200">
                <div style={{ display: 'flex', justifyContent: 'center' }}>
                    <button style={buttonStyle}>TRACK</button>
                </div>
            </Box>
        );
    }

    if (widgetType === "trackNumOnly") {
        // Classic — horizontal input + button
        return (
            <Box padding="400" background="bg-surface-secondary" borderRadius="200">
                <div style={{ display: 'flex', gap: '0' }}>
                    <input
                        type="text"
                        placeholder="Enter Your Tracking Number"
                        readOnly
                        style={{
                            flex: 1,
                            padding: size === "small" ? '8px 12px' : size === "large" ? '14px 16px' : '10px 14px',
                            border: '1px solid #c9cccf',
                            borderRight: 'none',
                            borderRadius: '4px 0 0 4px',
                            fontSize: size === "small" ? '13px' : size === "large" ? '16px' : '14px',
                        }}
                    />
                    <button style={{ ...buttonStyle, borderRadius: '0 4px 4px 0', minWidth: '90px' }}>
                        TRACK
                    </button>
                </div>
            </Box>
        );
    }

    if (widgetType === "trackNumOnlyNew") {
        return (
            <Box padding="400" background="bg-surface-secondary" borderRadius="200">
                <BlockStack gap="300">
                    <input
                        type="text"
                        placeholder="Enter Your Tracking Number"
                        readOnly
                        style={{
                            width: '100%',
                            padding: size === "small" ? '8px 12px' : size === "large" ? '14px 16px' : '10px 14px',
                            border: '1px solid #c9cccf',
                            borderRadius: '4px',
                            fontSize: size === "small" ? '13px' : size === "large" ? '16px' : '14px',
                        }}
                    />
                    <button style={{ ...buttonStyle, width: '100%' }}>
                        TRACK
                    </button>
                </BlockStack>
            </Box>
        );
    }

    if (widgetType === "trackNumWithEmail") {
        return (
            <Box padding="400" background="bg-surface-secondary" borderRadius="200">
                <BlockStack gap="300">
                    <input
                        type="text"
                        placeholder="Enter Your Tracking Number"
                        readOnly
                        style={{
                            width: '100%',
                            padding: size === "small" ? '8px 12px' : size === "large" ? '14px 16px' : '10px 14px',
                            border: '1px solid #c9cccf',
                            borderRadius: '4px',
                            fontSize: size === "small" ? '13px' : size === "large" ? '16px' : '14px',
                        }}
                    />
                    <input
                        type="email"
                        placeholder="Email Id"
                        readOnly
                        style={{
                            width: '100%',
                            padding: size === "small" ? '8px 12px' : size === "large" ? '14px 16px' : '10px 14px',
                            border: '1px solid #c9cccf',
                            borderRadius: '4px',
                            fontSize: size === "small" ? '13px' : size === "large" ? '16px' : '14px',
                        }}
                    />
                    <button style={{ ...buttonStyle, width: '100%' }}>
                        TRACK
                    </button>
                </BlockStack>
            </Box>
        );
    }

    return null;
}

// ─────────────────────────── Code Snippet Box ────────────────────────────────

function CodeBox({ code, onCopy, copied }) {
    return (
        <Box
            padding="400"
            background="bg-surface-secondary"
            borderRadius="200"
            position="relative"
        >
            <pre style={{
                fontSize: '12px',
                color: '#2c3e50',
                fontFamily: "'Courier New', Courier, monospace",
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-all',
                margin: 0,
                paddingRight: '40px',
                lineHeight: '1.6',
            }}>
                {code}
            </pre>
            <div style={{ position: 'absolute', top: '12px', right: '12px' }}>
                <Button
                    onClick={onCopy}
                    size="slim"
                    icon={copied ? '✓' : '📋'}
                >
                    {copied ? 'Copied' : 'Copy'}
                </Button>
            </div>
        </Box>
    );
}

// ─────────────────────────── Main Page Component ─────────────────────────────

export default function TrackingWidget() {
    // ── Form state ────────────────────────────────────────────────────────────
    const [widgetType, setWidgetType] = useState("trackNumOnly");
    const [size, setSize] = useState("normal");
    const [buttonColor, setButtonColor] = useState("#22b8fe");
    const [widthInput, setWidthInput] = useState("450");
    const [fullWidth, setFullWidth] = useState(false);

    // ── UI state ──────────────────────────────────────────────────────────────
    const [showCodeSection, setShowCodeSection] = useState(false);
    const [widgetDataLoad, setWidgetDataLoad] = useState("");
    const [loading, setLoading] = useState(false);
    const [initialLoading, setInitialLoading] = useState(true);
    const [toastActive, setToastActive] = useState(false);
    const [toastMessage, setToastMessage] = useState("");
    const [toastError, setToastError] = useState(false);
    const [copiedKey, setCopiedKey] = useState(null);

    // ── Initial load → GET widget/getviewdetails ──────────────────────────────
    useEffect(() => {
        const load = async () => {
            try {
                const json = await onetrackService.getWidgetDetails();
                const record = json?.data ?? json;
                const widgetData = json?.data?.widgetData || {};

                if (record) {
                    if (widgetData.widgettype) setWidgetType(widgetData.widgettype);
                    if (widgetData.sizevalue) setSize(widgetData.sizevalue);
                    if (widgetData.colorpicked) setButtonColor(widgetData.colorpicked);
                    if (widgetData.widthvalue) setWidthInput(String(widgetData.widthvalue) || "450");
                    if (widgetData.widthpercetage) setFullWidth(widgetData.widthpercetage === "1");
                }

                // If widgetdataLoad already exists, show code section immediately
                if (record.widgetdataLoad) {
                    const decodedHtml = decodeHtml(record.widgetdataLoad);
                    setWidgetDataLoad(decodedHtml);
                    setShowCodeSection(true);
                }
            } catch (err) {
                console.error("Failed to load widget details:", err);
            } finally {
                setInitialLoading(false);
            }
        };
        load();
    }, []);

    // ── Hide code section when any field is changed ───────────────────────────
    const onFieldChange = (setter) => (value) => {
        setter(value);
        setShowCodeSection(false);
    };

    // ── Copy helper ───────────────────────────────────────────────────────────
    const handleCopy = (text, key) => {
        navigator.clipboard
            .writeText(text)
            .then(() => {
                setCopiedKey(key);
                setTimeout(() => setCopiedKey(null), 1500);
            })
            .catch(() => { });
    };

    // ── Show toast ────────────────────────────────────────────────────────────
    const showToast = (message, isError = false) => {
        setToastMessage(message);
        setToastError(isError);
        setToastActive(true);
    };

    // ── Save & Get Code ───────────────────────────────────────────────────────
    const handleSave = async () => {
        // Validate width for modern types
        if (MODERN_TYPES.includes(widgetType)) {
            const width = Number(widthInput);
            if (width < 270 || width > 450) {
                showToast("Widget width must be between 270 and 450 pixels.", true);
                return;
            }
        }

        setLoading(true);
        try {
            const formData = new FormData();
            formData.append("sizevalue", size);
            formData.append("colorpicked", buttonColor);
            formData.append("optionwidget", widgetType);
            formData.append("widthInput", widthInput);
            formData.append("widgetWidthPercentage", fullWidth ? "1" : "0");

            const res = await fetch(`${API_BASE_URL}/widgetapi/addeditwidget`, {
                method: "POST",
                headers: authHeaders(),
                body: new URLSearchParams(formData),
            });
            const json = await res.json();
            const response = json?.data ?? json;

            if (response.type === "success") {
                showToast("Code has been successfully updated below.");
                setWidgetDataLoad(response.widgetdataLoad || "");
                setShowCodeSection(true);
                // Scroll to code section
                setTimeout(() => {
                    document.getElementById("tracking-widget-code")?.scrollIntoView({
                        behavior: "smooth",
                        block: "start",
                    });
                }, 300);
            } else {
                showToast(response.message || "Something went wrong.", true);
            }
        } catch {
            showToast("Something went wrong. Please try again.", true);
        } finally {
            setLoading(false);
        }
    };

    // ─────────────────────────── Derived ─────────────────────────────────────
    const showWidthControls = MODERN_TYPES.includes(widgetType);
    const showStep3 = MODERN_TYPES.includes(widgetType);
    const showPrepopNote = widgetType === "prepopulated";

    // ─────────────────────────── Render ──────────────────────────────────────

    if (initialLoading) {
        return (
            <Page>
                <div style={{ display: 'flex', justifyContent: 'center', padding: '60px' }}>
                    <Spinner size="large" />
                </div>
            </Page>
        );
    }

    const toastMarkup = toastActive ? (
        <Toast
            content={toastMessage}
            onDismiss={() => setToastActive(false)}
            error={toastError}
        />
    ) : null;

    return (
        <Frame>
            <Page
                title="Tracking widget"
                subtitle="Generate a lightweight tracking widget for your storefront, help center, or post-purchase pages."
                titleMetadata={<Badge tone="info">OneTrack</Badge>}
            >
                <Layout>
                    {/* Info Banner */}
                    <Layout.Section>
                        <Banner tone="info">
                            <BlockStack gap="200">
                                <Text variant="headingSm" as="h3">How it works</Text>
                                <Text as="p">
                                    Configure your widget, copy the embed snippets, and paste them into your website. 
                                    You can update the styling anytime without changing the integration steps.
                                </Text>
                            </BlockStack>
                        </Banner>
                    </Layout.Section>

                    {/* Main Content */}
                    <Layout.Section>
                        <Layout>
                            {/* LEFT COLUMN - Customization Form */}
                            <Layout.Section variant="oneThird">
                                <Card>
                                    <BlockStack gap="400">
                                        <BlockStack gap="200">
                                            <Text variant="headingMd" as="h2">Customize your widget</Text>
                                            <Text variant="bodyMd" as="p" tone="subdued">
                                                Choose the widget style, sizing, and placement behavior.
                                            </Text>
                                        </BlockStack>

                                        <FormLayout>
                                            {/* Widget Type */}
                                            <Select
                                                label={
                                                    <InlineStack gap="100" blockAlign="center">
                                                        <Text as="span">Widget type</Text>
                                                        <Tooltip content="Choose the style of your tracking widget.">
                                                            <Icon source={InfoIcon} tone="base" />
                                                        </Tooltip>
                                                    </InlineStack>
                                                }
                                                options={WIDGET_TYPES.map(o => ({ label: o.label, value: o.value }))}
                                                value={widgetType}
                                                onChange={(value) => onFieldChange(setWidgetType)(value)}
                                            />

                                            {/* Size */}
                                            <Select
                                                label={
                                                    <InlineStack gap="100" blockAlign="center">
                                                        <Text as="span">Size</Text>
                                                        <Tooltip content="Controls padding and overall widget height.">
                                                            <Icon source={InfoIcon} tone="base" />
                                                        </Tooltip>
                                                    </InlineStack>
                                                }
                                                options={SIZE_OPTIONS.map(o => ({ label: o.label, value: o.value }))}
                                                value={size}
                                                onChange={(value) => onFieldChange(setSize)(value)}
                                            />

                                            {/* Button Color */}
                                            <div>
                                                <InlineStack gap="100" blockAlign="center">
                                                    <Text as="span" variant="bodyMd" fontWeight="semibold">Button color</Text>
                                                    <Tooltip content="Used for the Track button background.">
                                                        <Icon source={InfoIcon} tone="base" />
                                                    </Tooltip>
                                                </InlineStack>
                                                <Box paddingBlockStart="200">
                                                    <InlineStack gap="200" blockAlign="center">
                                                        <div style={{ 
                                                            width: '44px', 
                                                            height: '44px', 
                                                            borderRadius: '8px', 
                                                            border: '1px solid #c9cccf',
                                                            position: 'relative',
                                                            overflow: 'hidden'
                                                        }}>
                                                            <input
                                                                type="color"
                                                                value={buttonColor}
                                                                onChange={(e) => onFieldChange(setButtonColor)(e.target.value)}
                                                                style={{
                                                                    width: '100%',
                                                                    height: '100%',
                                                                    border: 'none',
                                                                    cursor: 'pointer',
                                                                }}
                                                            />
                                                        </div>
                                                        <div style={{ flex: 1 }}>
                                                            <TextField
                                                                value={buttonColor}
                                                                onChange={(value) => onFieldChange(setButtonColor)(value)}
                                                                autoComplete="off"
                                                            />
                                                        </div>
                                                    </InlineStack>
                                                </Box>
                                            </div>

                                            {/* Fixed Widget Width */}
                                            {showWidthControls && (
                                                <div style={{ opacity: fullWidth ? 0.5 : 1 }}>
                                                    <InlineStack gap="100" blockAlign="center">
                                                        <Text as="span" variant="bodyMd" fontWeight="semibold">Fixed widget width</Text>
                                                        <Tooltip content="If disabled, the widget will expand to match the container width.">
                                                            <Icon source={InfoIcon} tone="base" />
                                                        </Tooltip>
                                                    </InlineStack>
                                                    <Box paddingBlockStart="200">
                                                        <InlineStack gap="200" blockAlign="center">
                                                            <div style={{ flex: 1 }}>
                                                                <TextField
                                                                    type="number"
                                                                    value={widthInput}
                                                                    onChange={(value) => onFieldChange(setWidthInput)(value)}
                                                                    min={270}
                                                                    max={450}
                                                                    disabled={fullWidth}
                                                                    autoComplete="off"
                                                                />
                                                            </div>
                                                            <Text as="span" variant="bodyMd" fontWeight="semibold">px</Text>
                                                        </InlineStack>
                                                    </Box>
                                                </div>
                                            )}

                                            {/* Set widget width to 100% */}
                                            {showWidthControls && (
                                                <Card background="bg-surface-secondary">
                                                    <InlineStack align="space-between" blockAlign="start">
                                                        <BlockStack gap="100">
                                                            <Text variant="bodyMd" fontWeight="semibold">Set widget width to 100%</Text>
                                                            <Text variant="bodySm" tone="subdued">
                                                                Best for responsive layouts and full-width sections.
                                                            </Text>
                                                        </BlockStack>
                                                        <input
                                                            type="checkbox"
                                                            checked={fullWidth}
                                                            onChange={(e) => onFieldChange(setFullWidth)(e.target.checked)}
                                                            style={{ width: '20px', height: '20px', cursor: 'pointer' }}
                                                        />
                                                    </InlineStack>
                                                </Card>
                                            )}
                                        </FormLayout>

                                        <Button
                                            variant="primary"
                                            onClick={handleSave}
                                            loading={loading}
                                            fullWidth
                                        >
                                            Save & Get Code
                                        </Button>
                                    </BlockStack>
                                </Card>
                            </Layout.Section>

                            {/* RIGHT COLUMN - Widget Preview */}
                            <Layout.Section variant="oneThird">
                                <Card>
                                    <BlockStack gap="400">
                                        <BlockStack gap="200">
                                            <Text variant="headingMd" as="h2">Widget preview</Text>
                                            <Text variant="bodyMd" as="p" tone="subdued">
                                                Preview updates live as you change settings.
                                            </Text>
                                        </BlockStack>

                                        <WidgetPreview
                                            widgetType={widgetType}
                                            size={size}
                                            buttonColor={buttonColor}
                                        />

                                        <Banner tone="info">
                                            <BlockStack gap="100">
                                                <Text variant="bodyMd" fontWeight="semibold">Placement note</Text>
                                                <Text variant="bodyMd">
                                                    Embed this widget in your store theme or CMS. If you use a helpdesk portal, 
                                                    place it on your order status page.
                                                </Text>
                                            </BlockStack>
                                        </Banner>
                                    </BlockStack>
                                </Card>
                            </Layout.Section>
                        </Layout>
                    </Layout.Section>

                    {/* Code Section */}
                    {showCodeSection && (
                        <Layout.Section>
                            <Card id="tracking-widget-code">
                                <BlockStack gap="400">
                                    <BlockStack gap="200">
                                        <Text variant="headingMd" as="h2">Add the widget to your preferred page</Text>
                                        <Text variant="bodyMd" as="p" tone="subdued">
                                            Copy each snippet and paste it into your website in the order shown.
                                        </Text>
                                    </BlockStack>

                                    <Divider />

                                    {/* Step 1 */}
                                    <BlockStack gap="300">
                                        <BlockStack gap="200">
                                            <Text variant="headingSm" as="h3">Step 1: Paste immediately after &lt;body&gt; tag</Text>
                                            {showPrepopNote && (
                                                <Text variant="bodyMd" tone="subdued">
                                                    You will need to pass the <code>data-tracking-number</code> attribute value 
                                                    dynamically in the page to retrieve corresponding tracking details.
                                                </Text>
                                            )}
                                        </BlockStack>
                                        <CodeBox
                                            code={widgetDataLoad}
                                            onCopy={() => handleCopy(widgetDataLoad, "step1")}
                                            copied={copiedKey === "step1"}
                                        />
                                    </BlockStack>

                                    <Divider />

                                    {/* Step 2 */}
                                    <BlockStack gap="300">
                                        <Text variant="headingSm" as="h3">
                                            Step 2: Paste between &lt;body&gt; and &lt;/body&gt; tags
                                        </Text>
                                        <CodeBox
                                            code={STEP2_CODE}
                                            onCopy={() => handleCopy(STEP2_CODE, "step2")}
                                            copied={copiedKey === "step2"}
                                        />
                                    </BlockStack>

                                    {/* Step 3 — only for modern types */}
                                    {showStep3 && (
                                        <>
                                            <Divider />
                                            <BlockStack gap="300">
                                                <Text variant="headingSm" as="h3">
                                                    Step 3: Paste between &lt;head&gt; and &lt;/head&gt; tags
                                                </Text>
                                                <CodeBox
                                                    code={STEP3_CODE}
                                                    onCopy={() => handleCopy(STEP3_CODE, "step3")}
                                                    copied={copiedKey === "step3"}
                                                />
                                            </BlockStack>
                                        </>
                                    )}
                                </BlockStack>
                            </Card>
                        </Layout.Section>
                    )}
                </Layout>
            </Page>
            {toastMarkup}
        </Frame>
    );
}