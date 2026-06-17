import React, { useState, useEffect, useCallback } from "react";
import {
    Modal, Text, Box, Select, Button, Spinner, TextField, BlockStack, InlineStack, Divider, Tag, FormLayout
} from "@shopify/polaris";
import { XIcon, EmailIcon } from "@shopify/polaris-icons";

import  lstrackparceldetailsService  from '../../src/services/lstrackparceldetailsService';

const TEMPLATES = [
    "Awaiting pickup",
    "Shipped",
    "Partially Shipped",
    "Out for delivery",
    "Delivered",
    "Partially Delivered",
    "Fulfilment delay",
    "Delay in transit",
    "Delayed delivery",
    "Failed delivery",
    "Lost/Damaged",
    "Returned",
    "Predicted delay",
    "Suspected lost",
    "Customer feedback - Post delivery"
];

export default function OneTrackSendEmail({ open, onClose, trackingnumber, customerEmail = "customer@example.com" }) {
    const [selectedTemplate, setSelectedTemplate] = useState("");
    const [loading, setLoading] = useState(false);
    const [emailData, setEmailData] = useState(null);
    const [error, setError] = useState("");
    const [recipientEmails, setRecipientEmails] = useState(
        customerEmail && customerEmail !== "-" ? [customerEmail] : []
    );
    const [previewOpen, setPreviewOpen] = useState(false);
    const [previewLoading, setPreviewLoading] = useState(false);
    const [previewData, setPreviewData] = useState({ subject: "", html: "" });
    const [sending, setSending] = useState(false);
    const [emailInputValue, setEmailInputValue] = useState("");

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    // Reset state on open
    useEffect(() => {
        if (open) {
            setSelectedTemplate("");
            setEmailData(null);
            setError("");
            setEmailInputValue("");
            setRecipientEmails(customerEmail && customerEmail !== "-" ? [customerEmail] : []);
        }
    }, [open, customerEmail]);

    // Fetch email content when a template is selected
    useEffect(() => {
        if (!selectedTemplate || !trackingnumber) return;
        
        const fetchContent = async () => {
            setLoading(true);
            setError("");
            setEmailData(null);
            try {
                const res = await lstrackparceldetailsService.getSendMailContent({
                    trackingnumber,
                    event: selectedTemplate
                });
                if (res.success && res.data) {
                    const templateData = res.data.template || {};
                    setEmailData({
                        subject: templateData.subject || res.data.subject || "",
                        htmlContent: templateData.emailcontent || res.data.emailcontent || ""
                    });
                } else {
                    setError(res.error || res.message || "Failed to load template content.");
                }
            } catch (err) {
                setError("An error occurred while fetching the template content.");
            } finally {
                setLoading(false);
            }
        };

        fetchContent();
    }, [selectedTemplate, trackingnumber]);

    const handlePreview = () => {
        if (!selectedTemplate) return;
        setPreviewData({
            subject: emailData?.subject || "",
            html: emailData?.htmlContent || ""
        });
        setPreviewOpen(true);
    };

    const handleSend = async () => {
        if (recipientEmails.length === 0) {
            setError("Please add at least one recipient email.");
            return;
        }
        setSending(true);
        setError("");
        try {
            const payload = {
                trackingnumber,
                event: selectedTemplate,
                to_email: recipientEmails.join(','),
                subject: emailData?.subject,
                emailcontent: emailData?.htmlContent
            };
            const res = await lstrackparceldetailsService.sendMail(payload);
            if (res.success) {
                onClose();
            } else {
                setError(res.error || res.message || "Failed to send email.");
            }
        } catch (err) {
            setError("An error occurred while sending the email.");
        } finally {
            setSending(false);
        }
    };

    const handleAddEmail = useCallback(() => {
        if (!emailInputValue) return;
        const val = emailInputValue.trim();
        if (!emailRegex.test(val)) {
            setError("Please enter a valid email address.");
            return;
        }
        if (recipientEmails.length >= 3) {
            setError("You can only add up to 3 email IDs.");
            return;
        }
        if (!recipientEmails.includes(val)) {
            setRecipientEmails([...recipientEmails, val]);
        }
        setEmailInputValue("");
        setError("");
    }, [emailInputValue, emailRegex, recipientEmails]);

    const handleRemoveEmail = useCallback((email) => {
        setRecipientEmails((prev) => prev.filter(e => e !== email));
    }, []);

    const templateOptions = [
        { label: "-- SELECT --", value: "" },
        ...TEMPLATES.map(t => ({ label: t, value: t }))
    ];

    return (
        <Modal
            open={open}
            onClose={onClose}
            title="Send Email"
            large
            primaryAction={
                emailData ? {
                    content: 'Send Email',
                    onAction: handleSend,
                    disabled: sending || recipientEmails.length === 0,
                    loading: sending
                } : undefined
            }
            secondaryActions={
                emailData ? [
                    {
                        content: 'Preview Email',
                        onAction: handlePreview
                    }
                ] : [
                    {
                        content: 'Cancel',
                        onAction: onClose
                    }
                ]
            }
        >
            <Modal.Section>
                <FormLayout>
                    <Select
                        label="Pick a Template"
                        options={templateOptions}
                        value={selectedTemplate}
                        onChange={setSelectedTemplate}
                    />

                    <BlockStack gap="200">
                        <TextField
                            label="Recipient Emails (Up to 3)"
                            placeholder={recipientEmails.length < 3 ? "Type email and press Enter" : "Maximum recipients reached"}
                            value={emailInputValue}
                            onChange={setEmailInputValue}
                            onBlur={handleAddEmail}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    e.preventDefault();
                                    handleAddEmail();
                                }
                            }}
                            disabled={recipientEmails.length >= 3}
                            autoComplete="off"
                        />
                        {recipientEmails.length > 0 && (
                            <InlineStack gap="200">
                                {recipientEmails.map(email => (
                                    <Tag key={email} onRemove={() => handleRemoveEmail(email)}>{email}</Tag>
                                ))}
                            </InlineStack>
                        )}
                    </BlockStack>

                    {loading ? (
                        <Box padding="800">
                            <InlineStack align="center" blockAlign="center">
                                <Spinner size="large" />
                            </InlineStack>
                        </Box>
                    ) : error ? (
                        <Box padding="400">
                            <Text tone="critical" variant="bodyMd">{error}</Text>
                        </Box>
                    ) : emailData ? (
                        <BlockStack gap="400">
                            <TextField
                                label="Subject"
                                value={emailData.subject || ""}
                                onChange={(value) => setEmailData({ ...emailData, subject: value })}
                                autoComplete="off"
                            />

                            {/* Rich Text Editor Mockup */}
                            <Box borderColor="border" borderWidth="025" borderRadius="100">
                                {/* Toolbar Mock */}
                                <Box borderColor="border" borderBlockEndWidth="025" padding="200">
                                    <InlineStack gap="300" blockAlign="center">
                                        <Text fontWeight="bold" as="span">B</Text>
                                        <Text as="span">I</Text>
                                        <Text as="span">U</Text>
                                        <Text as="span">S</Text>
                                    </InlineStack>
                                </Box>
                                {/* Editor Content Area */}
                                <Box padding="400" background="bg-surface-secondary" minHeight="250px">
                                    <div
                                        style={{ overflowY: 'auto' }}
                                        dangerouslySetInnerHTML={{ __html: emailData.htmlContent || emailData.content || `
                                            <div style="background-color: #e2e8f0; padding: 20px; border-radius: 8px; text-align: center; height: 150px; display: flex; align-items: center; justify-content: center;">
                                                <h2 style="color: #334155; margin: 0; font-family: sans-serif;">Your order shipped!</h2>
                                            </div>
                                        `}}
                                    />
                                </Box>
                            </Box>

                            <Box background="bg-surface-secondary" borderRadius="200" padding="400" borderWidth="025" borderColor="border">
                                <BlockStack gap="200">
                                    <Text variant="bodyMd">
                                        <Text fontWeight="bold" as="span">Merge Tags</Text> let you insert dynamic content into your emails.
                                    </Text>
                                    <Text variant="bodySm" tone="subdued">
                                        Here are the merge tags you can use:
                                    </Text>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                                        <Text variant="bodySm"><Text fontWeight="bold" tone="info" as="span">[customer_name]</Text> - Customer Name</Text>
                                        <Text variant="bodySm"><Text fontWeight="bold" tone="info" as="span">[order_id]</Text> - Order Id</Text>
                                        <Text variant="bodySm"><Text fontWeight="bold" tone="info" as="span">[tracking_number]</Text> - Tracking Number</Text>
                                        <Text variant="bodySm"><Text fontWeight="bold" tone="info" as="span">[tracking_link]</Text> - Tracking link</Text>
                                        <Text variant="bodySm"><Text fontWeight="bold" tone="info" as="span">[carrier]</Text> - Carrier</Text>
                                        <Text variant="bodySm"><Text fontWeight="bold" tone="info" as="span">[service_type]</Text> - Service Type</Text>
                                        <Text variant="bodySm"><Text fontWeight="bold" tone="info" as="span">[estimated_date]</Text> - Estimated date</Text>
                                    </div>
                                </BlockStack>
                            </Box>
                        </BlockStack>
                    ) : null}
                </FormLayout>
            </Modal.Section>

            {/* Email Preview Modal */}
            {previewOpen && (
                <Modal
                    open={previewOpen}
                    onClose={() => setPreviewOpen(false)}
                    title="Email Preview"
                    primaryAction={{
                        content: 'Close',
                        onAction: () => setPreviewOpen(false)
                    }}
                >
                    <Modal.Section>
                        {previewLoading ? (
                            <Box padding="800">
                                <InlineStack align="center" blockAlign="center">
                                    <Spinner size="large" />
                                </InlineStack>
                            </Box>
                        ) : (
                            <BlockStack gap="400">
                                <BlockStack gap="100">
                                    <Text tone="subdued" variant="bodySm" fontWeight="bold">SUBJECT</Text>
                                    <Text variant="bodyMd">{previewData.subject}</Text>
                                </BlockStack>
                                <Divider />
                                <Box>
                                    <div dangerouslySetInnerHTML={{ __html: previewData.html }} />
                                </Box>
                            </BlockStack>
                        )}
                    </Modal.Section>
                </Modal>
            )}
        </Modal>
    );
}
