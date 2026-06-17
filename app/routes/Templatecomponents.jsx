// ============================================================================
// ALL TEMPLATE EDITOR COMPONENTS FOR SHOPIFY POLARIS
// ============================================================================
// This file contains: EmailSendLoginSheet, EmailTemplateSheet, 
// EmailSplitTemplateSheet, SmsTemplateSheet, and all Preview sheets
// ============================================================================

import React, { useState, useEffect } from "react";
import {
    Modal,
    TextField,
    Button,
    BlockStack,
    InlineStack,
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

// ============================================================================
// EMAIL SEND LOGIN SHEET - Domain Verification Modal
// ============================================================================

export function EmailSendLoginSheet({ open, onOpenChange, onLogin, domainVerifyFlag }) {
    const [fromNameForDomain, setFromNameForDomain] = useState("");
    const [fromEmailForDomain, setFromEmailForDomain] = useState("");
    const [fromEmailForDomainDefault, setFromEmailForDomainDefault] = useState("");
    const [domainLoading, setDomainLoading] = useState(false);
    const [verifyStatus, setVerifyStatus] = useState("");
    const [showVerifyButton, setShowVerifyButton] = useState(false);
    const [showAddButton, setShowAddButton] = useState(false);
    const [domainAlert, setDomainAlert] = useState(null);
    const [editingName, setEditingName] = useState(false);
    const [editingEmail, setEditingEmail] = useState(false);
    const [dnsDialogOpen, setDnsDialogOpen] = useState(false);
    const [dnsDialogLoading, setDnsDialogLoading] = useState(false);
    const [dnsDialogAlert, setDnsDialogAlert] = useState(null);
    const [dnsRecords, setDnsRecords] = useState({ 
        cname1: "", value1: "", cname2: "", value2: "", cname3: "", value3: "" 
    });

    useEffect(() => {
        if (!domainAlert) return;
        const timer = setTimeout(() => setDomainAlert(null), 3000);
        return () => clearTimeout(timer);
    }, [domainAlert]);

    useEffect(() => {
        if (!dnsDialogAlert) return;
        const timer = setTimeout(() => setDnsDialogAlert(null), 3000);
        return () => clearTimeout(timer);
    }, [dnsDialogAlert]);

    useEffect(() => {
        if (!open) return;

        const loadViewDetails = async () => {
            setDomainLoading(true);
            setDomainAlert(null);
            setEditingName(false);
            setEditingEmail(false);
            try {
                const data = await onetrackService.getViewDetails();
                const d = data?.data ?? data;
                const nameForDomain = d?.userNameDomain || "";
                const emailForDomain = d?.emailForDomain || "";
                const verifyStatusFromApi = d?.verifyStatus || "";

                setFromNameForDomain(nameForDomain);
                setFromEmailForDomain(emailForDomain);
                setFromEmailForDomainDefault(emailForDomain);
                setVerifyStatus(verifyStatusFromApi);

                if (emailForDomain !== "") {
                    setShowAddButton(false);
                    setShowVerifyButton(verifyStatusFromApi !== "VERIFIED");
                } else {
                    setShowAddButton(true);
                    setShowVerifyButton(false);
                }
            } catch (err) {
                console.error("Failed to load view details:", err);
            } finally {
                setDomainLoading(false);
            }
        };

        loadViewDetails();
    }, [open]);

    const handleAdd = async () => {
        const emailRegex = /^[a-zA-Z0-9.!#$%&'*+\/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
        if (!fromEmailForDomain.trim()) {
            setDomainAlert({ type: "error", message: "Please enter sender email." });
            return;
        }
        if (!emailRegex.test(fromEmailForDomain)) {
            setDomainAlert({ type: "error", message: "Please enter a valid email address." });
            return;
        }
        setDomainLoading(true);
        try {
            const result = await onetrackService.domainVerification({
                fromNameForDomain: fromNameForDomain,
                fromEmailForDomain: fromEmailForDomain
            });

            if (result.success) {
                setDomainAlert({ type: "success", message: result.message });
                setShowAddButton(false);
                setShowVerifyButton(true);
                setVerifyStatus("UNVERIFIED");
                setFromEmailForDomainDefault(fromEmailForDomain);
            } else {
                if (result.message === "3") {
                    setDomainAlert({ type: "error", message: "The email id already exists in our system." });
                } else {
                    setDomainAlert({ type: "error", message: result.message || "Something went wrong. Please try again." });
                }
            }
        } catch (err) {
            setDomainAlert({ type: "error", message: "Something went wrong. Please try again." });
        } finally {
            setDomainLoading(false);
        }
    };

    const handleVerifyDomain = async () => {
        setDomainLoading(true);
        try {
            const result = await onetrackService.domainVerificationDNS({
                fromNameForDomain: fromNameForDomain,
                fromEmailForDomain: fromEmailForDomain
            });

            if (result?.type === "1" || result?.success) {
                const d = result.data || {};
                setDnsRecords({
                    cname1: d.mailCnameHost || "",
                    value1: d.mailCnameData || "",
                    cname2: d.dkim1CnameHost || "",
                    value2: d.dkim1CnameData || "",
                    cname3: d.dkim2CnameHost || "",
                    value3: d.dkim2CnameData || ""
                });
                setDnsDialogAlert(null);
                setDnsDialogOpen(true);
            } else {
                setDomainAlert({ type: "error", message: result?.message || "Failed to get DNS records." });
            }
        } catch (err) {
            setDomainAlert({ type: "error", message: "Something went wrong. Please try again." });
        } finally {
            setDomainLoading(false);
        }
    };

    const handleVerifyStatus = async () => {
        setDnsDialogLoading(true);
        try {
            const result = await onetrackService.domainVerificationStatus({
                fromEmailForDomain: fromEmailForDomain
            });

            if (result?.type === "1" || result?.success) {
                setVerifyStatus("VERIFIED");
                setShowVerifyButton(false);
                setDnsDialogOpen(false);
                setDomainAlert({ type: "success", message: result?.message || "Domain verified successfully!" });

                setTimeout(() => {
                    window.location.reload();
                }, 1500);
            } else {
                setDnsDialogAlert({ type: "error", message: result?.message || "Verification failed. Please try again." });
            }
        } catch (err) {
            setDnsDialogAlert({ type: "error", message: "Something went wrong. Please try again." });
        } finally {
            setDnsDialogLoading(false);
        }
    };

    const handleSaveName = async () => {
        if (!fromNameForDomain.trim()) {
            setDomainAlert({ type: "error", message: "Name cannot be empty." });
            return;
        }
        setDomainLoading(true);
        try {
            const result = await onetrackService.domainEmailNameUpdate({ fromNameForDomain: fromNameForDomain });
            if (result?.success) {
                setDomainAlert({ type: "success", message: result.message || "Name updated successfully." });
                setEditingName(false);
            } else {
                setDomainAlert({ type: "error", message: result?.message || "Failed to update name." });
            }
        } catch (err) {
            setDomainAlert({ type: "error", message: "Something went wrong." });
        } finally {
            setDomainLoading(false);
        }
    };

    const handleSaveEmail = async () => {
        const emailRegex = /^[a-zA-Z0-9.!#$%&'*+\/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
        if (!fromEmailForDomain.trim() || !emailRegex.test(fromEmailForDomain)) {
            setDomainAlert({ type: "error", message: "Please enter a valid email address." });
            return;
        }

        setDomainLoading(true);
        try {
            const result = await onetrackService.domainEmailUpdate({
                fromEmailForDomain: fromEmailForDomain,
                fromEmailForDomainDefalut: fromEmailForDomainDefault
            });

            if (result?.success) {
                if (result.verified === true) {
                    setVerifyStatus("VERIFIED");
                    setShowVerifyButton(false);
                    setEditingEmail(false);
                    setFromEmailForDomainDefault(fromEmailForDomain);
                    setDomainAlert({ type: "success", message: "Email updated successfully." });
                } else {
                    setVerifyStatus("UNVERIFIED");
                    setShowVerifyButton(true);
                    setEditingEmail(false);
                    setFromEmailForDomainDefault(fromEmailForDomain);
                    setDomainAlert({ type: "success", message: "Email updated. Please verify your domain." });
                }
            } else {
                if (result?.message === "3") {
                    setDomainAlert({ type: "error", message: "The email id already exists in our system." });
                } else {
                    setDomainAlert({ type: "error", message: result?.message || "Failed to update email." });
                }
            }
        } catch (err) {
            setDomainAlert({ type: "error", message: "Something went wrong." });
        } finally {
            setDomainLoading(false);
        }
    };

    const isDomainVerifiedFlag = domainVerifyFlag === 'Y' || verifyStatus === "VERIFIED";

    return (
        <>
            <Modal
                open={open}
                onClose={() => onOpenChange(false)}
                title={isDomainVerifiedFlag ? "Edit Domain Setup" : "Verify Email Domain"}
                primaryAction={
                    showAddButton
                        ? { content: "Add", onAction: handleAdd, loading: domainLoading }
                        : showVerifyButton
                        ? { content: "Verify Domain", onAction: handleVerifyDomain, loading: domainLoading }
                        : undefined
                }
                secondaryActions={[{ content: "Cancel", onAction: () => onOpenChange(false) }]}
            >
                <Modal.Section>
                    <BlockStack gap="400">
                        {domainAlert && (
                            <Banner status={domainAlert.type === "success" ? "success" : "critical"}>
                                <Text as="p">{domainAlert.message}</Text>
                            </Banner>
                        )}

                        {domainLoading ? (
                            <div style={{ textAlign: 'center', padding: '2rem' }}>
                                <Spinner size="large" />
                            </div>
                        ) : (
                            <>
                                <Text variant="bodyMd" as="p" tone="subdued">
                                    This is an essential step to setting up customer notifications as it improves your email
                                    deliverability and keeps them out of spam. You only need to do this once for your domain.
                                    <br /><br />
                                    Need help with verification? Contact{' '}
                                    <a href="mailto:support@lateshipment.com">support@lateshipment.com</a>
                                </Text>

                                <BlockStack gap="200">
                                    <TextField
                                        label="Sender Name"
                                        value={fromNameForDomain}
                                        onChange={setFromNameForDomain}
                                        disabled={!showAddButton && !editingName}
                                        autoComplete="off"
                                        connectedRight={
                                            !showAddButton && !editingName ? (
                                                <Button onClick={() => setEditingName(true)}>✏️</Button>
                                            ) : !showAddButton && editingName ? (
                                                <InlineStack gap="100">
                                                    <Button variant="primary" onClick={handleSaveName}>Save</Button>
                                                    <Button onClick={() => setEditingName(false)}>Cancel</Button>
                                                </InlineStack>
                                            ) : null
                                        }
                                    />
                                </BlockStack>

                                <BlockStack gap="200">
                                    <TextField
                                        label="Sender Email ID"
                                        value={fromEmailForDomain}
                                        onChange={setFromEmailForDomain}
                                        disabled={!showAddButton && !editingEmail}
                                        autoComplete="email"
                                        helpText="You can use any valid domain for which you have access to manage DNS records"
                                        connectedRight={
                                            !showAddButton && !editingEmail ? (
                                                <Button onClick={() => setEditingEmail(true)}>✏️</Button>
                                            ) : !showAddButton && editingEmail ? (
                                                <InlineStack gap="100">
                                                    <Button variant="primary" onClick={handleSaveEmail}>Save</Button>
                                                    <Button onClick={() => {
                                                        setEditingEmail(false);
                                                        setFromEmailForDomain(fromEmailForDomainDefault);
                                                    }}>Cancel</Button>
                                                </InlineStack>
                                            ) : null
                                        }
                                    />
                                </BlockStack>

                                {!showAddButton && (
                                    <Card>
                                        <InlineStack gap="200" align="space-between">
                                            <Text variant="bodyMd" as="p">Verification Status:</Text>
                                            <Text variant="bodyMd" as="p" fontWeight="bold">
                                                {verifyStatus === "VERIFIED" ? "✓ Verified" : "✗ Unverified"}
                                            </Text>
                                        </InlineStack>
                                    </Card>
                                )}
                            </>
                        )}
                    </BlockStack>
                </Modal.Section>
            </Modal>

            {/* DNS Records Modal */}
            <Modal
                open={dnsDialogOpen}
                onClose={() => setDnsDialogOpen(false)}
                title="Verify your Sender Email domain"
                primaryAction={{
                    content: dnsDialogLoading ? "Verifying..." : "Verify",
                    onAction: handleVerifyStatus,
                    loading: dnsDialogLoading
                }}
            >
                <Modal.Section>
                    <BlockStack gap="400">
                        {dnsDialogAlert && (
                            <Banner status={dnsDialogAlert.type === "success" ? "success" : "critical"}>
                                <Text as="p">{dnsDialogAlert.message}</Text>
                            </Banner>
                        )}

                        <Text variant="bodyMd" as="p">
                            <strong>Step 1</strong> — In your domain's DNS settings, create the 3 CNAME records provided below.
                        </Text>
                        <Text variant="bodyMd" as="p">
                            <strong>Step 2</strong> — Once the changes take effect, hit Verify below.
                        </Text>

                        <Card>
                            <div style={{ overflowX: 'auto' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                                    <thead>
                                        <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
                                            <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: 600 }}>CNAME</th>
                                            <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: 600 }}>Value</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {[
                                            { cname: dnsRecords.cname1, value: dnsRecords.value1 },
                                            { cname: dnsRecords.cname2, value: dnsRecords.value2 },
                                            { cname: dnsRecords.cname3, value: dnsRecords.value3 },
                                        ].map((row, i) => (
                                            <tr key={i} style={{ borderBottom: i < 2 ? '1px solid #f3f4f6' : 'none' }}>
                                                <td style={{ padding: '0.75rem', wordBreak: 'break-all' }}>{row.cname}</td>
                                                <td style={{ padding: '0.75rem', wordBreak: 'break-all' }}>{row.value}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </Card>
                    </BlockStack>
                </Modal.Section>
            </Modal>
        </>
    );
}

// ============================================================================
// EMAIL TEMPLATE SHEET - Regular Template Editor
// ============================================================================

export function EmailTemplateSheet({ context, open, onOpenChange, onRequestPreview, showToast }) {
    const [templateName, setTemplateName] = useState("");
    const [subject, setSubject] = useState("");
    const [content, setContent] = useState("");
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!context || !context.eventStatus || !context.eventLabel) return;

        const loadTemplate = async () => {
            setLoading(true);
            try {
                const payload = {
                    notifystatus: context.eventStatus,
                    emaildisplaystatus: context.eventLabel
                };

                const data = await onetrackService.getEmailTemplate(payload);

                if (data?.type === "success") {
                    setTemplateName(context.eventLabel || "");
                    setSubject(data.subject || "");

                    let html = data.emailContent || "";
                    try {
                        if (typeof html === "string" && html.startsWith('"')) {
                            html = JSON.parse(html);
                        }
                    } catch (e) { }

                    html = html
                        .replace(/\\"/g, '"')
                        .replace(/\\n/g, '')
                        .replace(/\\r/g, '');

                    const txt = document.createElement("textarea");
                    txt.innerHTML = html;
                    html = txt.value;

                    setContent(html);
                }
            } catch (error) {
                console.error("Error loading email template:", error);
            } finally {
                setLoading(false);
            }
        };

        loadTemplate();
    }, [context]);

    const saveTemplate = async () => {
        const contentText = content.replace(/<[^>]*>/g, "").trim();

        if (!subject.trim()) {
            showToast("Please complete the subject mandatory field", true);
            return;
        }

        if (!contentText) {
            showToast("Please complete the email content mandatory field", true);
            return;
        }

        setLoading(true);

        try {
            const payload = {
                notifystatus: context.eventStatus,
                subject: subject,
                emailContent: content
            };

            const data = await onetrackService.saveEmailContent(payload);

            if (data?.type === "success") {
                showToast(data.message || "Successfully Updated", false);
            } else {
                showToast(data.message || "Failed to save", true);
            }
        } catch (error) {
            console.error("Save error:", error);
            showToast("Something went wrong", true);
        } finally {
            setLoading(false);
        }
    };

    if (!context) {
        return null;
    }

    return (
        <Modal
            large
            open={open}
            onClose={() => onOpenChange(false)}
            title="Email Template"
            primaryAction={{
                content: "Save Changes",
                onAction: saveTemplate,
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
                            value={templateName}
                            onChange={setTemplateName}
                            autoComplete="off"
                        />

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
            </Modal.Section>
        </Modal>
    );
}

// ============================================================================
// Continue in next message due to length...
// ============================================================================