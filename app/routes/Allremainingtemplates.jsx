// ===========================================================================
// REMAINING TEMPLATE COMPONENTS - SMS & PREVIEW SHEETS
// ===========================================================================
// File contains: SmsTemplateSheet, EmailSplitTemplateSheet, 
// All Preview Sheets (Email, Split Email, SMS)
// ===========================================================================

import React, { useState, useEffect } from "react";
import {
    Modal,
    TextField,
    Button,
    BlockStack,
    Text,
    Banner,
    Spinner,
    Card,
    Tabs,
    Checkbox,
    Box,
} from '@shopify/polaris';
import { onetrackService } from '../../src/services/onetrackService';
import { RichTextEditor } from '../../src/components/RichTextEditor';

// ===========================================================================
// SMS TEMPLATE SHEET
// ===========================================================================

export function SmsTemplateSheet({ context, open, onOpenChange, showToast }) {
    const [templateName, setTemplateName] = useState("");
    const [smsContent, setSmsContent] = useState("");
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!context?.eventStatus || !context?.eventLabel) return;

        const loadSmsTemplate = async () => {
            setLoading(true);
            try {
                const payload = {
                    notifystatus: context.eventStatus,
                    smsdisplaystatus: context.eventLabel
                };

                const data = await onetrackService.getSmsTemplate(payload);

                if (data?.type === "success") {
                    setTemplateName(context.eventLabel);
                    setSmsContent(data.smsContent || "");
                }
            } catch (error) {
                console.error("SMS template load error:", error);
            } finally {
                setLoading(false);
            }
        };

        loadSmsTemplate();
    }, [context]);

    const handleSave = async () => {
        if (!smsContent.trim()) {
            showToast("Please complete the SMS content mandatory field", true);
            return;
        }

        setLoading(true);

        try {
            const payload = {
                notifystatus: context.eventStatus,
                smsContent: smsContent
            };

            const data = await onetrackService.saveSmsContent(payload);

            if (data?.type === "success") {
                showToast(data.message || "Successfully Updated", false);
            } else {
                showToast(data.message || "Failed to save SMS", true);
            }
        } catch (error) {
            console.error("SMS save error:", error);
            showToast("Something went wrong", true);
        } finally {
            setLoading(false);
        }
    };

    if (!context) return null;

    return (
        <Modal
            open={open}
            onClose={() => onOpenChange(false)}
            title="SMS Template"
            primaryAction={{
                content: "Save",
                onAction: handleSave,
                loading: loading
            }}
            secondaryActions={[
                { content: "Close", onAction: () => onOpenChange(false) }
            ]}
        >
            <Modal.Section>
                {loading ? (
                    <div style={{ textAlign: 'center', padding: '2rem' }}>
                        <Spinner size="large" />
                    </div>
                ) : (
                    <BlockStack gap="400">
                        <Text variant="headingMd" as="h3">{templateName}</Text>
                        <Text variant="bodyMd" as="p" tone="subdued">
                            There's a character limit of 145 on the SMS content to ensure it goes out as a single SMS.
                        </Text>

                        <TextField
                            label="SMS Content"
                            value={smsContent}
                            onChange={setSmsContent}
                            multiline={5}
                            autoComplete="off"
                        />

                        <Card>
                            <BlockStack gap="200">
                                <Text variant="headingSm" as="h4">Merge tags you can use</Text>
                                <BlockStack gap="100">
                                    <Text variant="bodySm" as="p" tone="subdued">
                                        [customer_name] - Inserts Customer Name dynamically
                                    </Text>
                                    <Text variant="bodySm" as="p" tone="subdued">
                                        [carrier] - To insert Carrier dynamically
                                    </Text>
                                    <Text variant="bodySm" as="p" tone="subdued">
                                        [order_id] - Inserts Order Id dynamically
                                    </Text>
                                    <Text variant="bodySm" as="p" tone="subdued">
                                        [service_type] - To insert Service Type dynamically
                                    </Text>
                                    <Text variant="bodySm" as="p" tone="subdued">
                                        [tracking_number] - Inserts Tracking Number dynamically
                                    </Text>
                                    <Text variant="bodySm" as="p" tone="subdued">
                                        [estimated_date] - To insert Estimated date dynamically
                                    </Text>
                                </BlockStack>
                            </BlockStack>
                        </Card>
                    </BlockStack>
                )}
            </Modal.Section>
        </Modal>
    );
}

// ===========================================================================
// EMAIL SPLIT TEMPLATE SHEET (Shipped/Delivered with Partial Options)
// ===========================================================================

export function EmailSplitTemplateSheet({ context, open, onOpenChange, onRequestPreview, showToast }) {
    const [splitTab, setSplitTab] = useState(0);
    const [subject, setSubject] = useState("");
    const [content, setContent] = useState("");
    const [partialSubject, setPartialSubject] = useState("");
    const [partialContent, setPartialContent] = useState("");
    const [partialEnabled, setPartialEnabled] = useState(false);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!open || !context?.eventStatus || !context?.eventLabel) return;

        const load = async () => {
            setLoading(true);
            setSplitTab(0);
            try {
                const payload = {
                    notifystatus: context.eventStatus,
                    emaildisplaystatus: context.eventLabel,
                };
                const data = await onetrackService.getEmailSplitTemplate(payload);

                if (data?.type === "success") {
                    const cleanHtml = (raw = "") => {
                        let h = raw;
                        try {
                            if (typeof h === "string" && h.startsWith('"')) h = JSON.parse(h);
                        } catch (e) {}
                        h = h.replace(/\\"/g, '"').replace(/\\n/g, "").replace(/\\r/g, "").replace(/\\\//g, "/");
                        const txt = document.createElement("textarea");
                        txt.innerHTML = h;
                        return txt.value;
                    };
                    setSubject(data.subject || "");
                    setContent(cleanHtml(data.emailContent));
                    setPartialSubject(data.partialSubject || "");
                    setPartialContent(cleanHtml(data.partialContent));
                    setPartialEnabled(String(data.partialEnableStatus) === "1");
                }
            } catch (err) {
                console.error("Split template load error:", err);
            } finally {
                setLoading(false);
            }
        };

        load();
    }, [open, context]);

    const handleSave = async () => {
        const fullText = content.replace(/<[^>]*>/g, "").trim();
        if (!subject.trim()) {
            showToast("Please complete the subject field.", true);
            return;
        }
        if (!fullText) {
            showToast("Please complete the email content field.", true);
            return;
        }

        setLoading(true);
        try {
            const payload = {
                notifystatus: context.eventStatus,
                subject,
                emailContent: content,
                partialEnableStatus: partialEnabled ? "1" : "0",
                partialSubject,
                partialContent,
            };
            const data = await onetrackService.saveEmailSplitContent(payload);

            if (data?.type === "success") {
                showToast(data.message || "Saved successfully!", false);
            } else {
                showToast(data.message || "Failed to save.", true);
            }
        } catch (err) {
            console.error("Split save error:", err);
            showToast("Something went wrong.", true);
        } finally {
            setLoading(false);
        }
    };

    if (!context) return null;

    const isShipped = context.eventLabel === "Shipped";
    const fullyLabel = isShipped ? "Fully Shipped Template" : "Fully Delivered Template";
    const partialLabel = isShipped ? "Partially Shipped Template" : "Partially Delivered Template";
    const toggleLabel = isShipped
        ? "Notify customers when an order is partially shipped"
        : "Notify customers when an order is partially delivered";

    const tabs = [
        { id: 'fully', content: fullyLabel },
        { id: 'partially', content: partialLabel },
    ];

    return (
        <Modal
            large
            open={open}
            onClose={() => onOpenChange(false)}
            title="Email Template"
            primaryAction={{
                content: "Save Changes",
                onAction: handleSave,
                loading: loading
            }}
            secondaryActions={[
                { content: "Preview", onAction: onRequestPreview },
                { content: "Close", onAction: () => onOpenChange(false) }
            ]}
        >
            <Modal.Section>
                {loading ? (
                    <div style={{ textAlign: 'center', padding: '2rem' }}>
                        <Spinner size="large" />
                    </div>
                ) : (
                    <BlockStack gap="400">
                        <Text variant="bodyMd" as="p" tone="subdued">
                            Configure the email your customers receive when this event is triggered.
                        </Text>
                        <Text variant="bodyMd" as="p" tone="subdued">
                            {context.sectionTitle} · {context.eventLabel}
                        </Text>

                        <TextField
                            label="Template Name"
                            value={context.eventLabel}
                            disabled
                            autoComplete="off"
                        />

                        <Card>
                            <Checkbox
                                label={toggleLabel}
                                checked={partialEnabled}
                                onChange={setPartialEnabled}
                            />
                        </Card>

                        <Tabs tabs={tabs} selected={splitTab} onSelect={setSplitTab}>
                            <Box paddingBlockStart="400">
                                {splitTab === 0 && (
                                    <BlockStack gap="300">
                                        <TextField
                                            label="Subject"
                                            value={subject}
                                            onChange={setSubject}
                                            autoComplete="off"
                                        />
                                        <RichTextEditor
                                            value={content}
                                            onChange={setContent}
                                            mergeTags={[
                                                { tag: '[customer_name]', description: 'Inserts the customer name dynamically.' },
                                                { tag: '[tracking_link]', description: 'Inserts the tracking page link dynamically.' },
                                                { tag: '[order_id]', description: 'Inserts the order ID for the shipment.' },
                                                { tag: '[carrier]', description: 'Inserts the carrier name dynamically.' },
                                            ]}
                                            label="Content"
                                            placeholder="Write your email content here..."
                                        />
                                    </BlockStack>
                                )}

                                {splitTab === 1 && (
                                    <BlockStack gap="300">
                                        <TextField
                                            label="Subject"
                                            value={partialSubject}
                                            onChange={setPartialSubject}
                                            autoComplete="off"
                                        />
                                        <RichTextEditor
                                            value={partialContent}
                                            onChange={setPartialContent}
                                            mergeTags={[
                                                { tag: '[customer_name]', description: 'Inserts the customer name dynamically.' },
                                                { tag: '[tracking_link]', description: 'Inserts the tracking page link dynamically.' },
                                                { tag: '[order_id]', description: 'Inserts the order ID for the shipment.' },
                                                { tag: '[carrier]', description: 'Inserts the carrier name dynamically.' },
                                            ]}
                                            label="Content"
                                            placeholder="Write your partial template content here..."
                                        />
                                    </BlockStack>
                                )}
                            </Box>
                        </Tabs>
                    </BlockStack>
                )}
            </Modal.Section>
        </Modal>
    );
}

// ===========================================================================
// EMAIL TEMPLATE PREVIEW SHEET
// ===========================================================================

export function EmailTemplatePreviewSheet({ context, open, onOpenChange }) {
    const [subject, setSubject] = useState("");
    const [content, setContent] = useState("");
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!open || !context?.eventStatus || !context?.eventLabel) return;

        const loadPreview = async () => {
            setLoading(true);
            try {
                const payload = {
                    notifystatus: context.eventStatus,
                    emaildisplaystatus: context.eventLabel
                };

                const data = await onetrackService.getEmailTemplatePreview(payload);

                if (data.type === "success") {
                    let html = data.emailContent;
                    html = html
                        .replace(/\\"/g, '"')
                        .replace(/\\n/g, "")
                        .replace(/\\\//g, "/");
                    setSubject(data.subject);
                    setContent(html);
                }
            } catch (err) {
                console.error("Preview API error:", err);
            }
            setLoading(false);
        };

        loadPreview();
    }, [open, context]);

    return (
        <Modal
            large
            open={open}
            onClose={() => onOpenChange(false)}
            title="Email Template Preview"
            secondaryActions={[
                { content: "Close", onAction: () => onOpenChange(false) }
            ]}
        >
            <Modal.Section>
                {loading ? (
                    <div style={{ textAlign: 'center', padding: '2rem' }}>
                        <Spinner size="large" />
                    </div>
                ) : (
                    <BlockStack gap="400">
                        <Text variant="bodyMd" as="p" tone="subdued">
                            {context.sectionTitle} · {context.eventLabel}
                        </Text>

                        <Card>
                            <BlockStack gap="200">
                                <Text variant="headingSm" as="h4">Subject</Text>
                                <Text variant="bodyMd" as="p">{subject}</Text>
                            </BlockStack>
                        </Card>

                        <Card>
                            <div dangerouslySetInnerHTML={{ __html: content }} />
                        </Card>
                    </BlockStack>
                )}
            </Modal.Section>
        </Modal>
    );
}

// ===========================================================================
// EMAIL SPLIT TEMPLATE PREVIEW SHEET
// ===========================================================================

export function EmailSplitTemplatePreviewSheet({ context, open, onOpenChange }) {
    const [splitTab, setSplitTab] = useState(0);
    const [subject, setSubject] = useState("");
    const [content, setContent] = useState("");
    const [partialSubject, setPartialSubject] = useState("");
    const [partialContent, setPartialContent] = useState("");
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!open || !context?.eventStatus || !context?.eventLabel) return;

        const load = async () => {
            setLoading(true);
            setSplitTab(0);
            try {
                const payload = {
                    notifystatus: context.eventStatus,
                    emaildisplaystatus: context.eventLabel,
                };
                const data = await onetrackService.getEmailSplitTemplatePreview(payload);

                if (data?.type === "success") {
                    const cleanHtml = (raw = "") => {
                        let h = raw;
                        try {
                            if (typeof h === "string" && h.startsWith('"')) h = JSON.parse(h);
                        } catch (e) {}
                        h = h.replace(/\\"/g, '"').replace(/\\n/g, "").replace(/\\\//g, "/");
                        return h;
                    };
                    setSubject(data.subject || "");
                    setContent(cleanHtml(data.emailContent));
                    setPartialSubject(data.partialSubject || "");
                    setPartialContent(cleanHtml(data.partialContent));
                }
            } catch (err) {
                console.error("Split preview load error:", err);
            } finally {
                setLoading(false);
            }
        };

        load();
    }, [open, context]);

    if (!context) return null;

    const isShipped = context.eventLabel === "Shipped";
    const fullyLabel = isShipped ? "Fully Shipped Template" : "Fully Delivered Template";
    const partialLabel = isShipped ? "Partially Shipped Template" : "Partially Delivered Template";

    const tabs = [
        { id: 'fully', content: fullyLabel },
        { id: 'partially', content: partialLabel },
    ];

    return (
        <Modal
            large
            open={open}
            onClose={() => onOpenChange(false)}
            title="Email Template Preview"
            secondaryActions={[
                { content: "Close", onAction: () => onOpenChange(false) }
            ]}
        >
            <Modal.Section>
                {loading ? (
                    <div style={{ textAlign: 'center', padding: '2rem' }}>
                        <Spinner size="large" />
                    </div>
                ) : (
                    <BlockStack gap="400">
                        <Text variant="headingMd" as="h3">{context.eventLabel}</Text>

                        <Tabs tabs={tabs} selected={splitTab} onSelect={setSplitTab}>
                            <Box paddingBlockStart="400">
                                {splitTab === 0 && (
                                    <BlockStack gap="300">
                                        <Card>
                                            <BlockStack gap="200">
                                                <Text variant="headingSm" as="h4">Subject</Text>
                                                <Text variant="bodyMd" as="p">{subject}</Text>
                                            </BlockStack>
                                        </Card>
                                        <Card>
                                            <div dangerouslySetInnerHTML={{ __html: content }} />
                                        </Card>
                                    </BlockStack>
                                )}

                                {splitTab === 1 && (
                                    <BlockStack gap="300">
                                        <Card>
                                            <BlockStack gap="200">
                                                <Text variant="headingSm" as="h4">Subject</Text>
                                                <Text variant="bodyMd" as="p">{partialSubject}</Text>
                                            </BlockStack>
                                        </Card>
                                        <Card>
                                            <div dangerouslySetInnerHTML={{ __html: partialContent }} />
                                        </Card>
                                    </BlockStack>
                                )}
                            </Box>
                        </Tabs>
                    </BlockStack>
                )}
            </Modal.Section>
        </Modal>
    );
}

// ===========================================================================
// SMS TEMPLATE PREVIEW SHEET
// ===========================================================================

export function SmsTemplatePreviewSheet({ context, open, onOpenChange }) {
    const [smsContent, setSmsContent] = useState("");
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!context?.eventStatus || !context?.eventLabel) return;

        const loadPreview = async () => {
            setLoading(true);
            try {
                const payload = {
                    notifystatus: context.eventStatus,
                    smsdisplaystatus: context.eventLabel
                };

                const data = await onetrackService.getSmsTemplatePreview(payload);

                if (data?.type === "success") {
                    setSmsContent(data.smsContent || "");
                }
            } catch (err) {
                console.error("SMS preview error:", err);
            } finally {
                setLoading(false);
            }
        };

        loadPreview();
    }, [context]);

    return (
        <Modal
            open={open}
            onClose={() => onOpenChange(false)}
            title="SMS Template Preview"
            secondaryActions={[
                { content: "Close", onAction: () => onOpenChange(false) }
            ]}
        >
            <Modal.Section>
                {loading ? (
                    <div style={{ textAlign: 'center', padding: '2rem' }}>
                        <Spinner size="large" />
                    </div>
                ) : (
                    <BlockStack gap="400">
                        <Text variant="headingMd" as="h3">{context.eventLabel}</Text>
                        <Card>
                            <Text variant="bodyMd" as="p">{smsContent}</Text>
                        </Card>
                    </BlockStack>
                )}
            </Modal.Section>
        </Modal>
    );
}