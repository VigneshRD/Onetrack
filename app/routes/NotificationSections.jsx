import React, { useState } from "react";
import {
    BlockStack,
    Card,
    Text,
    Button,
    InlineStack,
    Badge,
    Checkbox,
    Spinner,
    Divider,
    Tooltip,
    Icon,
    Box,
    Banner,
    TextField,
    Modal,
} from '@shopify/polaris';
import { InfoIcon } from '@shopify/polaris-icons';
import { onetrackService } from '../../src/services/onetrackService';
import { useAlert } from "./ConfirmationModal";

const AUTOMATE_SECTIONS = [
    {
        title: "Shipping status",
        description: "These cover key shipping and delivery events associated with every package.",
        items: [
            { label: "Awaiting pickup", status: "drafting" },
            { label: "Shipped", status: "live" },
            { label: "Out for delivery", status: "live" },
            { label: "Delivered", status: "live" },
            { label: "Customer feedback · Post delivery", status: "drafting" },
        ],
    },
    {
        title: "Exceptions",
        description: "We recommend turning these on to proactively keep customers informed about potential delays or delivery issues.",
        items: [
            { label: "Fulfilment delay", status: "drafting" },
            { label: "Delay in transit", status: "live" },
            { label: "Delayed delivery", status: "drafting" },
            { label: "Failed delivery", status: "live" },
            { label: "Lost / damaged", status: "live" },
            { label: "Returned", status: "drafting" },
        ],
    },
    {
        title: "Predicted",
        description: "Predicted delivery errors as identified by your shipment data.",
        items: [
            { label: "Predicted delay", status: "live" },
            { label: "Suspected lost", status: "live" },
        ],
    },
];

const SMS_AUTOMATE_SECTIONS = [
    {
        title: "Shipping status",
        description: "These cover key shipping events as updated by the shipping carrier.",
        items: [
            { label: "Order shipped", status: "drafting" },
            { label: "Out for delivery", status: "live" },
            { label: "Delivered", status: "live" },
            { label: "Failed deliveries", status: "drafting" },
            { label: "Customer feedback · Post delivery", status: "drafting" },
        ],
    },
    {
        title: "Predicted delivery errors",
        description: "Statuses that indicate probable delivery errors identified from your data.",
        items: [
            { label: "Predicted delays", status: "live" },
            { label: "Package suspected lost", status: "live" },
        ],
    },
    {
        title: "Delivery errors",
        description: "Statuses that indicate delivery errors encountered by packages in transit.",
        items: [
            { label: "In-transit with delays", status: "live" },
            { label: "Packages delivered with delays", status: "live" },
            { label: "Lost / damaged shipments", status: "live" },
        ],
    },
    {
        title: "Returns",
        description: "Notifications triggered when a package has been returned to the sender.",
        items: [{ label: "Returned shipments", status: "live" }],
    },
];

const EVENT_KEY_MAP = {
    "Awaiting pickup": "Awaiting",
    "Shipped": "Shipped",
    "Out for delivery": "Outfordelivery",
    "Delivered": "Delivered",
    "Customer feedback · Post delivery": "Postdelivery",
    "Fulfilment delay": "Unused",
    "Delay in transit": "Intransitdelays",
    "Delayed delivery": "Delivereddelays",
    "Failed delivery": "Failed",
    "Lost / damaged": "Lostdamaged",
    "Lost / damaged shipments": "Lostdamaged",
    "Returned": "Returned",
    "Failed deliveries": "Failed",
    "Predicted delay": "Predicteddelays",
    "Suspected lost": "Lostsuspected",
    "Order shipped": "Shipped",
    "Predicted delays": "Predicteddelays",
    "Package suspected lost": "Lostsuspected",
    "In-transit with delays": "Intransitdelays",
    "Packages delivered with delays": "Delivereddelays",
    "Returned shipments": "Returns",
};

export function EmailAutomationsContent({ onEditTemplate, onPreviewTemplate, notificationData, onToggleEvent, showToast }) {
    if (notificationData?.visibility?.emailAutomations === false) return null;

    return (
        <BlockStack gap="400">
            <Banner>
                <Text as="p" variant="bodyMd">
                    Select the events for which you would like automated email notifications
                    to be sent to your customers. You can edit the email content for each
                    event using the Edit and Preview actions.
                </Text>
            </Banner>

            <BlockStack gap="400">
                {AUTOMATE_SECTIONS.map((section) => (
                    <NotificationSection
                        key={section.title}
                        section={section}
                        showToast={showToast}
                        notificationData={notificationData}
                        onToggleEvent={onToggleEvent}
                        onEditTemplate={(item) => onEditTemplate({
                            channel: "email",
                            sectionTitle: section.title,
                            eventLabel: item.label,
                            eventStatus: EVENT_KEY_MAP[item.label]
                        })}
                        onPreviewTemplate={(item) => onPreviewTemplate({
                            mode: "preview",
                            channel: "email",
                            sectionTitle: section.title,
                            eventLabel: item.label,
                            eventStatus: EVENT_KEY_MAP[item.label]
                        })}
                        apiArray={notificationData?.data?.DemMailArray}
                    />
                ))}
            </BlockStack>
        </BlockStack>
    );
}

export function SmsAutomationsContent({ notificationData, onToggleEvent, onEditTemplate, onPreviewTemplate, showToast }) {
    const [smsPricingAccepted, setSmsPricingAccepted] = useState(false);

    React.useEffect(() => {
        if (notificationData?.data?.SMSenable != null) {
            setSmsPricingAccepted(notificationData.data.SMSenable == 1);
        }
    }, [notificationData]);

    const handleSmsToggleWithPricingCheck = async (apiKey, checked) => {
        if (checked && !smsPricingAccepted) {
            return {
                type: "contenterror",
                message: "Please select the check box above to let us know you're aware of our SMS pricing."
            };
        }
        return onToggleEvent(apiKey, checked);
    };

    if (notificationData?.visibility?.smsAutomations === false) return null;

    return (
        <BlockStack gap="400">
            <Card>
                <BlockStack gap="300">
                    <Text variant="headingMd" as="h3">SMS Notifications</Text>
                    <Text variant="bodyMd" as="p" tone="subdued">
                        Set order status notifications on auto-pilot to keep customers
                        informed of relevant order status updates via SMS.
                    </Text>
                    <Button
                        plain
                        url="https://support.lateshipment.com/support/solutions/articles/1070000124223-getting-started-with-sms-notifications"
                        external
                    >
                        Learn more
                    </Button>
                </BlockStack>
            </Card>

            <Card>
                <InlineStack align="space-between" blockAlign="start" wrap={false}>
                    <BlockStack gap="200">
                        <Text variant="headingMd" as="h3">SMS Pricing</Text>
                        <Text variant="bodyMd" as="p" tone="subdued">
                            SMS notifications have additional charges. Based on your
                            location, you are charged a cost for every SMS sent from your
                            account.
                        </Text>
                    </BlockStack>
                    <Box minWidth="200px">
                        <Checkbox
                            label="I'm on board with your SMS pricing."
                            checked={smsPricingAccepted}
                            onChange={setSmsPricingAccepted}
                        />
                    </Box>
                </InlineStack>
            </Card>

            <Banner>
                <Text as="p" variant="bodyMd">
                    Select the events for which you would like SMS notifications to be triggered.
                </Text>
            </Banner>

            <Banner status="info">
                <Text as="p" variant="bodyMd">
                    We have created default SMS templates for each status. Be sure to
                    preview the default content before you enable notifications.
                </Text>
            </Banner>

            <BlockStack gap="400">
                {SMS_AUTOMATE_SECTIONS.map((section) => (
                    <NotificationSection
                        key={section.title}
                        showToast={showToast}
                        section={section}
                        onToggleEvent={handleSmsToggleWithPricingCheck}
                        notificationData={notificationData}
                        apiArray={notificationData?.data?.SMSMailArray}
                        showTest={false}
                        onEditTemplate={(item) => onEditTemplate({
                            channel: "sms",
                            sectionTitle: section.title,
                            eventLabel: item.label,
                            eventStatus: EVENT_KEY_MAP[item.label]
                        })}
                        onPreviewTemplate={(item) => onPreviewTemplate({
                            channel: "sms",
                            sectionTitle: section.title,
                            eventLabel: item.label,
                            eventStatus: EVENT_KEY_MAP[item.label]
                        })}
                    />
                ))}
            </BlockStack>
        </BlockStack>
    );
}

function NotificationSection({ section, showActions = true, onEditTemplate, onPreviewTemplate, notificationData, apiArray, onToggleEvent, showToast, isIntegration, onPreCheck, showTest = true }) {
    if (notificationData?.visibility?.sections?.[section.title] === false) return null;

    return (
        <BlockStack gap="200">
            <BlockStack gap="100">
                <Text variant="headingMd" as="h3">{section.title}</Text>
                {section.description && (
                    <Text variant="bodyMd" as="p" tone="subdued">
                        {section.description}
                    </Text>
                )}
            </BlockStack>

            <Card>
                <BlockStack gap="0">
                    {section.items.map((item, index) => (
                        <React.Fragment key={item.label}>
                            <Box padding="400">
                                <NotificationRow
                                    item={item}
                                    showActions={showActions}
                                    onEditTemplate={onEditTemplate ? () => onEditTemplate(item) : undefined}
                                    onPreviewTemplate={onPreviewTemplate ? () => onPreviewTemplate(item) : undefined}
                                    notificationData={notificationData}
                                    apiArray={apiArray}
                                    onToggleEvent={onToggleEvent}
                                    onPreCheck={onPreCheck}
                                    showToast={showToast}
                                    isIntegration={isIntegration}
                                    showTest={showTest}
                                />
                            </Box>
                            {index !== section.items.length - 1 && <Divider />}
                        </React.Fragment>
                    ))}
                </BlockStack>
            </Card>
        </BlockStack>
    );
}

function NotificationRow({ item, showActions = true, onEditTemplate, onPreviewTemplate, notificationData, apiArray, onToggleEvent, showToast, isIntegration, onPreCheck, showTest = true }) {
    const [loading, setLoading] = useState(false);
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [pendingToggle, setPendingToggle] = useState(null);
    const [testExpanded, setTestExpanded] = useState(false);
    const [sendingTestEmail, setSendingTestEmail] = useState(false);

    const apiKey = EVENT_KEY_MAP[item.label];

    const defaultChecked = Boolean(
        apiArray &&
        apiKey &&
        apiArray[apiKey] &&
        Number(apiArray[apiKey].enablestatus) === 1
    );

    const [isLive, setIsLive] = useState(defaultChecked);

    React.useEffect(() => {
        if (!apiArray || !apiKey) {
            setIsLive(false);
            return;
        }

        const status = apiArray?.[apiKey]?.enablestatus;

        if (status === "1" || status === 1) {
            setIsLive(true);
        } else {
            setIsLive(false);
        }
    }, [apiArray, apiKey]);

    const emailForDomainDisplay = notificationData?.data?.emailForDomainDisplay || "";
    const showTestButton = emailForDomainDisplay && emailForDomainDisplay.trim() !== "";

    const SPLIT_EMAIL_LABELS = ["Shipped", "Delivered"];
    const isSplitEvent = SPLIT_EMAIL_LABELS.includes(item.label);

    const callToggleApi = async (checked) => {
        setIsLive(checked);
        setLoading(true);

        try {
            const response = await onToggleEvent(apiKey, checked);

            if (response?.type === "pending") {
                setLoading(false);
                setIsLive(!checked);
                return;
            }

            if (response?.type === "success") {
                showToast(response?.message, false);
            } else if (response?.type === "contenterror") {
                showToast(response?.message, true);
                setIsLive(false);
            } else if (response?.type === "failedtag") {
                showToast(response?.message + " Note: Ensure you maintain the same format used in the list of merge tags provided.", true);
                setIsLive(true);
            } else {
                showToast(response?.message, true);
                setIsLive(!checked);
            }
        } catch (error) {
            console.error("API failed:", error);
            showToast("API request failed", true);
            setIsLive(!checked);
        } finally {
            setLoading(false);
        }
    };

    const handleToggle = (checked) => {
        if (checked && isIntegration) {
            if (onPreCheck) {
                const preCheckResult = onPreCheck(apiKey, checked);
                if (preCheckResult?.type === "error") {
                    showToast(preCheckResult.message, true);
                    return;
                }
            }
            setPendingToggle(true);
            setConfirmOpen(true);
            return;
        }

        callToggleApi(checked);
    };

    const handleSendTestEmail = async () => {
        const emailRegex = /^[a-zA-Z0-9.!#$%&'*+\/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

        if (!emailForDomainDisplay || !emailForDomainDisplay.trim()) {
            showToast("Please Enter the Email-id", true);
            return;
        }

        if (!emailRegex.test(emailForDomainDisplay)) {
            showToast("Please enter a valid email address.", true);
            return;
        }

        setSendingTestEmail(true);

        try {
            const payload = {
                notifystatus: apiKey,
                emailValue: emailForDomainDisplay,
                emaildisplaystatus: item.label
            };

            let result;
            if (isSplitEvent) {
                result = await onetrackService.emailContentSendSplit(payload);
            } else {
                result = await onetrackService.emailContentSend(payload);
            }

            if (result?.type === "success") {
                showToast(result.message || "Test email sent successfully!", false);
            } else if (result?.type === "failedtag") {
                showToast(result.message + " Note: Ensure you maintain the same format used in the list of merge tags provided.", true);
            } else {
                showToast(result?.message || "Failed to send test email.", true);
            }
        } catch (error) {
            console.error("Test email error:", error);
            showToast("Something went wrong while sending test email.", true);
        } finally {
            setSendingTestEmail(false);
        }
    };

    const isDisabled = notificationData?.permissions?.canEdit === false;
    const uiShowActions = notificationData?.permissions?.allowActions !== undefined
        ? notificationData.permissions.allowActions
        : showActions;
    const canEdit = notificationData?.permissions?.canEdit !== false;
    const canPreview = notificationData?.permissions?.allowPreview !== false;

    return (
        <>
            <BlockStack gap="300">
                <InlineStack align="space-between" blockAlign="center">
                    <InlineStack gap="200" blockAlign="center">
                        <Text variant="headingSm" as="h4">{item.label}</Text>
                        <Tooltip content={`Information about ${item.label}`}>
                            <Icon source={InfoIcon} tone="base" />
                        </Tooltip>
                    </InlineStack>

                    <InlineStack gap="200" blockAlign="center">
                        <Badge tone={isLive ? "success" : "info"}>
                            {loading ? "Updating..." : (isLive ? "Active" : "Drafting")}
                        </Badge>
                        {loading && <Spinner size="small" />}
                        <Checkbox
                            label=""
                            checked={isLive}
                            onChange={handleToggle}
                            disabled={isDisabled || loading}
                        />
                    </InlineStack>
                </InlineStack>

                {uiShowActions && (
                    <BlockStack gap="200">
                        <InlineStack gap="200" wrap>
                            {onEditTemplate && canEdit && (
                                <Button size="slim" onClick={onEditTemplate}>Edit</Button>
                            )}
                            {onPreviewTemplate && canPreview && (
                                <Button size="slim" onClick={onPreviewTemplate}>Preview</Button>
                            )}
                            {showTestButton && showTest && (
                                <Button size="slim" onClick={() => setTestExpanded(!testExpanded)}>
                                    Test
                                </Button>
                            )}
                        </InlineStack>

                        {showTestButton && showTest && testExpanded && (
                            <Card>
                                <InlineStack gap="200" blockAlign="center">
                                    <Box width="100%">
                                        <Text variant="bodyMd" as="p">{emailForDomainDisplay}</Text>
                                    </Box>
                                    <Button
                                        onClick={handleSendTestEmail}
                                        loading={sendingTestEmail}
                                        disabled={sendingTestEmail}
                                    >
                                        Send email
                                    </Button>
                                </InlineStack>
                            </Card>
                        )}
                    </BlockStack>
                )}
            </BlockStack>

            <Modal
                open={confirmOpen}
                onClose={() => setConfirmOpen(false)}
                title="Confirmation"
                primaryAction={{
                    content: "YES",
                    onAction: () => {
                        setConfirmOpen(false);
                        if (pendingToggle !== null) {
                            callToggleApi(pendingToggle);
                        }
                    }
                }}
                secondaryActions={[
                    {
                        content: "Cancel",
                        onAction: () => setConfirmOpen(false)
                    }
                ]}
            >
                <Modal.Section>
                    <Text as="p">
                        Please ensure you have turned the flow for this event live on your connected tool
                    </Text>
                </Modal.Section>
            </Modal>
        </>
    );
}