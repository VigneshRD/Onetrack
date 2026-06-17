import React, { useEffect, useState } from "react";
import {
    Page,
    Layout,
    Card,
    Text,
    Button,
    Tabs,
    Banner,
    Badge,
    Spinner,
    Frame,
    Toast,
    Modal,
    TextField,
    Checkbox,
    Select,
    FormLayout,
    ButtonGroup,
    SkeletonBodyText,
    SkeletonDisplayText,
    Link,
    Box,
    BlockStack,
    InlineStack,
    Divider,
} from '@shopify/polaris';
import { onetrackService } from '../../src/services/onetrackService';
import {
    EmailAutomationsContent,
    SmsAutomationsContent,
} from "./NotificationSections";
import {
    EmailIntegrationsContent,
    SmsIntegrationsContent,
} from "./IntegrationSections";
import { EmailSendLoginSheet } from "./Templatecomponents";
import { EmailTemplateSheet } from "./Templatecomponents";
import { EmailSplitTemplateSheet } from "./Allremainingtemplates";
import { SmsTemplateSheet } from "./Allremainingtemplates";
import { EmailTemplatePreviewSheet } from "./Allremainingtemplates";
import { EmailSplitTemplatePreviewSheet } from "./Allremainingtemplates";
import { SmsTemplatePreviewSheet } from "./Allremainingtemplates";

function NotificationSkeleton() {
    return (
        <Box paddingBlockEnd="400">
            <Card>
                <BlockStack gap="400">
                    <SkeletonDisplayText size="small" />
                    <SkeletonBodyText lines={2} />
                    <Divider />
                    {[1, 2, 3].map((i) => (
                        <BlockStack key={i} gap="200">
                            <InlineStack align="space-between" blockAlign="center">
                                <SkeletonBodyText lines={1} />
                                <SkeletonBodyText lines={1} />
                            </InlineStack>
                            {i < 3 && <Divider />}
                        </BlockStack>
                    ))}
                </BlockStack>
            </Card>
        </Box>
    );
}

const SPLIT_EMAIL_LABELS = ["Shipped", "Delivered"];

export default function NotificationsPage() {
    

    const [notificationData, setNotificationData] = useState(null);
    const [emailTool, setEmailTool] = useState("klaviyo");
    const [smsProvider, setSmsProvider] = useState("attentive");
    const [toastActive, setToastActive] = useState(false);
    const [toastContent, setToastContent] = useState("");
    const [toastError, setToastError] = useState(false);
    const [loading, setLoading] = useState(false);

    const [modeTab, setModeTab] = useState(0);
    const [emailMode, setEmailMode] = useState(0);
    const [smsMode, setSmsMode] = useState(0);

    const [emailLoginOpen, setEmailLoginOpen] = useState(false);
    const [emailSendLoggedIn, setEmailSendLoggedIn] = useState(() => {
        if (typeof window === "undefined") return false;
        return window.localStorage.getItem("onetrack-email-send-logged-in") === "true";
    });
    const [emailLoginBannerDismissed, setEmailLoginBannerDismissed] = useState(() => {
        if (typeof window === "undefined") return false;
        return window.localStorage.getItem("onetrack-email-send-login-banner-dismissed") === "true";
    });

    const [templateEditorContext, setTemplateEditorContext] = useState(null);

    useEffect(() => {
        window.localStorage.setItem("onetrack-email-send-logged-in", String(emailSendLoggedIn));
    }, [emailSendLoggedIn]);

    useEffect(() => {
        window.localStorage.setItem("onetrack-email-send-login-banner-dismissed", String(emailLoginBannerDismissed));
    }, [emailLoginBannerDismissed]);

    const showEmailLoginBanner = !emailSendLoggedIn && !emailLoginBannerDismissed;

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                setLoading(true);
                const data = await onetrackService.getNotificationSettings();
                setNotificationData(data);
            } catch (error) {
                console.error("Failed to fetch notification settings:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchSettings();
    }, []);

    useEffect(() => {
        const hash = window.location.hash;
        const split = hash.split("=");
        const toolValue = split[1];

        const searchParams = new URLSearchParams(window.location.search);
        const crmType = searchParams.get("crm_type");

        if (crmType) {
            const normalised = crmType.toLowerCase();
            if (normalised === "klaviyo") {
                setModeTab(0);
                setEmailMode(1);
                setEmailTool("klaviyo");
            } else if (normalised === "omnisend") {
                setModeTab(0);
                setEmailMode(1);
                setEmailTool("omnisend");
            } else if (normalised === "attentive") {
                setModeTab(1);
                setSmsMode(1);
                setSmsProvider("attentive");
            } else if (normalised === "yotpo") {
                setModeTab(1);
                setSmsMode(1);
                setSmsProvider("yotpo");
            }
            window.history.replaceState({}, "", window.location.pathname);
        } else if (toolValue === "Yotpo") {
            setModeTab(1);
            setSmsMode(1);
            setSmsProvider("yotpo");
        } else if (toolValue === "Attentive") {
            setModeTab(1);
            setSmsMode(1);
            setSmsProvider("attentive");
        } else if (toolValue === "Klaviyo") {
            setModeTab(0);
            setEmailMode(1);
            setEmailTool("klaviyo");
        } else if (toolValue === "Omnisend") {
            setModeTab(0);
            setEmailMode(1);
            setEmailTool("omnisend");
        } else {
            const pathParts = window.location.pathname.split("/");
            if (pathParts.includes("yotposms")) {
                setModeTab(1);
                setSmsMode(1);
                setSmsProvider("yotpo");
            }
        }

        if (hash) {
            const cleanUrl = window.location.href.split("#")[0];
            window.history.replaceState({}, "", cleanUrl);
        }
    }, []);

    const handleEmailAutomateToggle = async (apiKey, checked) => {
        if (checked) {
            const domainVerifyFlag = notificationData?.data?.domainVerifyFlag;
            if (domainVerifyFlag !== 'Y') {
                return {
                    type: "contenterror",
                    message: "Domain Verification Pending"
                };
            }
        }

        const payload = {
            notifystatus: apiKey,
            checkStatus: checked ? "1" : "0"
        };

        return await onetrackService.EmailAutomate(payload);
    };

    const handleSmsToggle = async (apiKey, checked) => {
        const payload = {
            notifystatus: apiKey,
            checkStatus: checked ? "1" : "0"
        };

        return await onetrackService.SmsAutomate(payload);
    };

    const showToast = (message, isError = false) => {
        setToastContent(message);
        setToastError(isError);
        setToastActive(true);
    };

    const toastMarkup = toastActive ? (
        <Toast
            content={toastContent}
            onDismiss={() => setToastActive(false)}
            error={toastError}
        />
    ) : null;

    const tabs = [
        {
            id: 'email-notification',
            content: 'Email notification',
            panelID: 'email-notification-panel',
        },
        {
            id: 'sms-notification',
            content: 'SMS notification',
            panelID: 'sms-notification-panel',
        },
    ];

    if (loading) {
        return (
            <Page title="Notifications">
                <Layout>
                    <Layout.Section>
                        <BlockStack gap="400">
                            <SkeletonDisplayText size="large" />
                            <SkeletonBodyText lines={2} />
                            <NotificationSkeleton />
                            <NotificationSkeleton />
                        </BlockStack>
                    </Layout.Section>
                </Layout>
            </Page>
        );
    }

    return (
        <Frame>
            <Page
                title="Notifications"
                subtitle="Configure email and SMS notifications that keep your customers informed about shipment status, exceptions, and predicted delivery issues."
            >
                <Layout>
                    <Layout.Section>
                        <BlockStack gap="400">
                            <Link url="https://support.lateshipment.com/en/support/solutions/folders/1070000492432" external>
                                Learn more
                            </Link>

                            <Tabs tabs={tabs} selected={modeTab} onSelect={setModeTab}>
                                <Box paddingBlockStart="400">
                                    {modeTab === 0 && (
                                        <BlockStack gap="400">
                                            {showEmailLoginBanner && (
                                                <EmailSendLoginBanner
                                                    onLogin={() => setEmailLoginOpen(true)}
                                                    onUseIntegrations={() => setEmailMode(1)}
                                                    onDismiss={() => setEmailLoginBannerDismissed(true)}
                                                    domainVerifyFlag={notificationData?.data?.domainVerifyFlag}
                                                />
                                            )}

                                            <Card>
                                                <BlockStack gap="400">
                                                    <InlineStack align="space-between" blockAlign="start" wrap={false}>
                                                        <BlockStack gap="200">
                                                            <Text variant="headingSm" as="h3">EMAIL NOTIFICATION</Text>
                                                            <Text variant="bodyMd" as="p" tone="subdued">
                                                                Send proactive shipment updates from your own domain or your connected email marketing tools.
                                                            </Text>
                                                        </BlockStack>

                                                        <ButtonGroup variant="segmented">
                                                            <Button
                                                                pressed={emailMode === 0}
                                                                onClick={() => setEmailMode(0)}
                                                            >
                                                                Automate
                                                            </Button>
                                                            <Button
                                                                pressed={emailMode === 1}
                                                                onClick={() => setEmailMode(1)}
                                                            >
                                                                Integrate Email Tools
                                                            </Button>
                                                        </ButtonGroup>
                                                    </InlineStack>

                                                    <Divider />

                                                    {emailMode === 0 ? (
                                                        <EmailAutomationsContent
                                                            notificationData={notificationData}
                                                            onToggleEvent={handleEmailAutomateToggle}
                                                            onEditTemplate={(context) => setTemplateEditorContext({ ...context, mode: "edit" })}
                                                            onPreviewTemplate={(context) => setTemplateEditorContext({ ...context, mode: "preview" })}
                                                            showToast={showToast}
                                                        />
                                                    ) : (
                                                        <EmailIntegrationsContent
                                                            notificationData={notificationData}
                                                            emailTool={emailTool}
                                                            setEmailTool={setEmailTool}
                                                            showToast={showToast}
                                                        />
                                                    )}
                                                </BlockStack>
                                            </Card>
                                        </BlockStack>
                                    )}

                                    {modeTab === 1 && (
                                        <Card>
                                            <BlockStack gap="400">
                                                <InlineStack align="space-between" blockAlign="start" wrap={false}>
                                                    <BlockStack gap="200">
                                                        <Text variant="headingSm" as="h3">SMS NOTIFICATION</Text>
                                                        <Text variant="bodyMd" as="p" tone="subdued">
                                                            Send shipment status updates via SMS to keep customers informed on the go.
                                                        </Text>
                                                    </BlockStack>

                                                    <ButtonGroup variant="segmented">
                                                        <Button
                                                            pressed={smsMode === 0}
                                                            onClick={() => setSmsMode(0)}
                                                        >
                                                            Automate
                                                        </Button>
                                                        <Button
                                                            pressed={smsMode === 1}
                                                            onClick={() => setSmsMode(1)}
                                                        >
                                                            Integrate SMS Tools
                                                        </Button>
                                                    </ButtonGroup>
                                                </InlineStack>

                                                <Divider />

                                                {smsMode === 0 ? (
                                                    <SmsAutomationsContent
                                                        notificationData={notificationData}
                                                        onToggleEvent={handleSmsToggle}
                                                        onEditTemplate={(context) => setTemplateEditorContext({ ...context, mode: "edit" })}
                                                        onPreviewTemplate={(context) => setTemplateEditorContext({ ...context, mode: "preview" })}
                                                        showToast={showToast}
                                                    />
                                                ) : (
                                                    <SmsIntegrationsContent
                                                        notificationData={notificationData}
                                                        smsProvider={smsProvider}
                                                        setSmsProvider={setSmsProvider}
                                                        showToast={showToast}
                                                    />
                                                )}
                                            </BlockStack>
                                        </Card>
                                    )}
                                </Box>
                            </Tabs>
                        </BlockStack>
                    </Layout.Section>
                </Layout>

                <EmailSendLoginSheet
                    open={emailLoginOpen}
                    onOpenChange={setEmailLoginOpen}
                    domainVerifyFlag={notificationData?.data?.domainVerifyFlag}
                    onLogin={(email) => {
                        setEmailSendLoggedIn(true);
                        showToast(`You can now send notifications from ${email}.`);
                    }}
                />

                {templateEditorContext?.mode === "edit" && templateEditorContext?.channel === "email" &&
                    SPLIT_EMAIL_LABELS.includes(templateEditorContext?.eventLabel) && (
                        <EmailSplitTemplateSheet
                            context={templateEditorContext}
                            open
                            onRequestPreview={() =>
                                setTemplateEditorContext((prev) =>
                                    prev ? { ...prev, mode: "preview" } : prev
                                )
                            }
                            onOpenChange={(open) => { if (!open) setTemplateEditorContext(null); }}
                            showToast={showToast}
                        />
                    )}

                {templateEditorContext?.mode === "edit" && templateEditorContext?.channel === "email" &&
                    !SPLIT_EMAIL_LABELS.includes(templateEditorContext?.eventLabel) && (
                        <EmailTemplateSheet
                            context={templateEditorContext}
                            open
                            onRequestPreview={() =>
                                setTemplateEditorContext((prev) =>
                                    prev ? { ...prev, mode: "preview" } : prev
                                )
                            }
                            onOpenChange={(open) => { if (!open) setTemplateEditorContext(null); }}
                            showToast={showToast}
                        />
                    )}

                {templateEditorContext?.mode === "edit" && templateEditorContext?.channel === "sms" && (
                    <SmsTemplateSheet
                        context={templateEditorContext}
                        open
                        onOpenChange={(open) => {
                            if (!open) setTemplateEditorContext(null);
                        }}
                        showToast={showToast}
                    />
                )}

                {templateEditorContext?.mode === "preview" && templateEditorContext?.channel === "email" &&
                    SPLIT_EMAIL_LABELS.includes(templateEditorContext?.eventLabel) && (
                        <EmailSplitTemplatePreviewSheet
                            context={templateEditorContext}
                            open
                            onOpenChange={(open) => { if (!open) setTemplateEditorContext(null); }}
                        />
                    )}

                {templateEditorContext?.mode === "preview" && templateEditorContext?.channel === "email" &&
                    !SPLIT_EMAIL_LABELS.includes(templateEditorContext?.eventLabel) && (
                        <EmailTemplatePreviewSheet
                            context={templateEditorContext}
                            open
                            onOpenChange={(open) => { if (!open) setTemplateEditorContext(null); }}
                        />
                    )}

                {templateEditorContext?.mode === "preview" && templateEditorContext?.channel === "sms" && (
                    <SmsTemplatePreviewSheet
                        context={templateEditorContext}
                        open
                        onOpenChange={(open) => {
                            if (!open) setTemplateEditorContext(null);
                        }}
                    />
                )}

                {toastMarkup}
            </Page>
        </Frame>
    );
}

function EmailSendLoginBanner({ onLogin, onUseIntegrations, onDismiss, domainVerifyFlag }) {

   
    const isDomainVerified = domainVerifyFlag === 'Y';

    return (
        <Banner
            title={isDomainVerified ? "Your domain has been verified successfully" : "Verify your email domain"}
            status={isDomainVerified ? "success" : "warning"}
            action={{
                content: isDomainVerified ? "Edit" : "Verify",
                onAction: onLogin
            }}
            secondaryAction={{
                content: "Use email tools",
                onAction: onUseIntegrations
            }}
            // onDismiss={onDismiss}
        >
            <Text as="p">
                {isDomainVerified
                    ? "We have auto-populated the domain that was verified as part of your D.E.M setup."
                    : "This is an essential step to setting up customer notifications as it improves your email deliverability and keeps them out of spam."}
            </Text>
        </Banner>
    );
}