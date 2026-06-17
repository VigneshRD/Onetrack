import React, { useState, useEffect } from "react";
import {
    BlockStack,
    Card,
    Text,
    Button,
    InlineStack,
    Select,
    TextField,
    Banner,
    Box,
    Grid,
    Divider,
    Badge,
    Checkbox,
    Spinner,
    Icon,
    Tooltip,
    Modal,
} from '@shopify/polaris';
import { InfoIcon } from '@shopify/polaris-icons';
import { onetrackService } from '../../src/services/onetrackService';
import { useAlert, useConfirm } from "./ConfirmationModal";

// ... Keep all the SECTIONS constants the same ...

const KLAVIYO_INTEGRATION_SECTIONS = [
    {
        title: "Shipping status events",
        description: "Events sent to your connected email marketing tool to trigger flows.",
        items: [
            { label: "LS-Label generated", status: "drafting" },
            { label: "LS-Shipped", status: "drafting" },
            { label: "LS-In transit", status: "drafting" },
            { label: "LS-Out for delivery", status: "drafting" },
            { label: "LS-Delivered", status: "live" },
            { label: "LS-Unused labels", status: "drafting" },
            { label: "LS-In transit with delays", status: "live" },
            { label: "LS-Delayed delivery", status: "live" },
            { label: "LS-Failed delivery", status: "live" },
            { label: "LS-Lost / damaged", status: "live" },
            { label: "LS-Returned", status: "drafting" },
            { label: "LS-Predicted delays", status: "drafting" },
            { label: "LS-Suspected lost", status: "live" },
            { label: "LS-Customer feedback · Post delivery", status: "live" }
        ]
    }
];

const OMNISEND_INTEGRATION_SECTIONS = [
    {
        title: "Shipping status events",
        description: "Events sent to Omnisend to trigger automation flows.",
        items: [
            { label: "LS-Shipped", status: "live" },
            { label: "LS-In transit", status: "drafting" },
            { label: "LS-Out for delivery", status: "live" },
            { label: "LS-Delivered", status: "live" },
            { label: "LS-Unused labels", status: "live" },
            { label: "LS-In transit with delays", status: "live" },
            { label: "LS-Delayed delivery", status: "drafting" },
            { label: "LS-Failed delivery", status: "live" },
            { label: "LS-Lost / damaged", status: "drafting" },
            { label: "LS-Returned", status: "live" },
            { label: "LS-Predicted delays", status: "drafting" },
            { label: "LS-Suspected lost", status: "live" },
            { label: "LS-Customer feedback · Post delivery", status: "live" }
        ]
    }
];

const ATTENTIVE_INTEGRATION_SECTIONS = [
    {
        title: "Shipping status events",
        description: "Events that will be sent to your SMS tool when enabled.",
        items: [
            { label: "LS-Shipped", status: "drafting" },
            { label: "LS-In transit", status: "drafting" },
            { label: "LS-Out for delivery", status: "drafting" },
            { label: "LS-Delivered", status: "drafting" },
            { label: "LS-Unused labels", status: "drafting" },
            { label: "LS-In transit with delays", status: "drafting" },
            { label: "LS-Delayed delivery", status: "drafting" },
            { label: "LS-Failed delivery", status: "drafting" },
            { label: "LS-Lost / damaged", status: "drafting" },
            { label: "LS-Returned", status: "drafting" },
            { label: "LS-Predicted delays", status: "drafting" },
            { label: "LS-Suspected lost", status: "drafting" },
            { label: "LS-Customer feedback · Post delivery", status: "live" },
        ],
    },
];

const YOTPO_INTEGRATION_SECTIONS = [
    {
        title: "Shipping status events",
        description: "Events that will be sent to Yotpo when enabled.",
        items: [
            { label: "LS-Shipped", status: "drafting" },
            { label: "LS-In transit", status: "drafting" },
            { label: "LS-Out for delivery", status: "drafting" },
            { label: "LS-Delivered", status: "drafting" },
            { label: "LS-In transit with delays", status: "drafting" },
            { label: "LS-Failed delivery", status: "drafting" }
        ]
    }
];

const EVENT_KEY_MAP = {
    "LS-Label generated": "Labelgenerated",
    "LS-Shipped": "Shipped",
    "LS-In transit": "Intransit",
    "LS-Out for delivery": "Outfordelivery",
    "LS-Delivered": "Delivered",
    "LS-Unused labels": "Unused",
    "LS-In transit with delays": "Intransitdelays",
    "LS-Delayed delivery": "Delivereddelays",
    "LS-Failed delivery": "Failed",
    "LS-Lost / damaged": "Lostdamaged",
    "LS-Returned": "Returned",
    "LS-Predicted delays": "Predicteddelays",
    "LS-Suspected lost": "Lostsuspected",
    "LS-Customer feedback · Post delivery": "Postdelivery"
};

export function EmailIntegrationsContent({ notificationData, emailTool, setEmailTool, showToast }) {
    const [omnisendApiKey, setOmnisendApiKey] = useState("");
    const [klaviyoApiKey, setKlaviyoApiKey] = useState("");
    const { showSuccess, showError, AlertComponent } = useAlert();
    const { showConfirm, ConfirmComponent } = useConfirm();

    const omnisendData = notificationData?.data?.OmnisendData?.crm_key_Omnisend;
    const klaviyoData = notificationData?.data?.KlaviyoData?.crm_key_Klaviyo;
    const klaviyoData_crm_trackingoption_Klaviyo = notificationData?.data?.KlaviyoData?.crm_trackingoption_Klaviyo;

    useEffect(() => {
        if (omnisendData) {
            setOmnisendApiKey(omnisendData);
        }
        if (klaviyoData) {
            setKlaviyoApiKey(klaviyoData);
        }
    }, [omnisendData, klaviyoData]);

    if (notificationData?.visibility?.emailIntegrations === false) return null;

    const sections = emailTool === "omnisend" ? OMNISEND_INTEGRATION_SECTIONS : KLAVIYO_INTEGRATION_SECTIONS;
    const apiArray = emailTool === "omnisend" ? notificationData?.data?.OmnisendMailArray : notificationData?.data?.KlaviyoMailArray;

    const preCheckEmailKey = (apiKey, checked) => {
        if (!checked) return null;

        if (emailTool === "klaviyo" && klaviyoData_crm_trackingoption_Klaviyo !== "Oauth" && !klaviyoData) {
            return { type: "error", message: "Please update your Klaviyo public API key" };
        }
        if (emailTool === "omnisend" && !omnisendData) {
            return { type: "error", message: "Please update your Omnisend public API key" };
        }
        return null;
    };

    const handleEmailIntegrationToggle = async (apiKey, checked) => {
        try {
            const payload = {
                notifystatus: apiKey,
                checkStatus: checked ? "1" : "0",
                sendType: emailTool
            };

            let response;
            if (emailTool === "klaviyo") {
                response = await onetrackService.KlaviyoIntegrate(payload);
            } else {
                response = await onetrackService.OmnisendIntegrate(payload);
            }

            return response?.data || response;
        } catch (error) {
            console.error("Email integration API error:", error);
            return { type: "error", message: "Something went wrong" };
        }
    };

    const emailAjaxCall = async (ajaxdataSend, formName) => {
        try {
            const response = await onetrackService.saveCustomerEmailDetails(ajaxdataSend);

            let successMessage = "";
            if (formName === "klaviyo_form" || formName === "omnisend_form") {
                successMessage = "Woohoo! We've successfully connected your account.";
            }

            if (response.status === 1) {
                showSuccess(successMessage);
            } else if (response.status === 3) {
                showError("We're having trouble connecting right now. Please try again in some time.");
            } else if (response.status === "storeerror") {
                showError(response.message);
            } else {
                showError("Something went wrong. Please try again.");
            }
        } catch (err) {
            showError("Network error. Please try again.");
        }
    };

    const handleOmnisendSave = () => {
        if (!omnisendApiKey) {
            showError("Please enter Omnisend API key");
            return;
        }

        const ajaxdataSend = {
            form_id: "omnisend_form",
            omnisend_api_key: omnisendApiKey
        };

        emailAjaxCall(ajaxdataSend, "omnisend_form");
    };

    const handleKlaviyoSave = () => {
        if (!klaviyoApiKey) {
            showError("Please enter Klaviyo API key");
            return;
        }

        const ajaxdataSend = {
            form_id: "klaviyo_form",
            klaviyo_api_key: klaviyoApiKey
        };

        emailAjaxCall(ajaxdataSend, "klaviyo_form");
    };

    const handleConnectKlaviyo = async () => {
        try {
            if (!notificationData) return;
    
            // Get values from sessionStorage
            const shopifyShop = sessionStorage.getItem("shopify_shop");
            const lsAccessToken = sessionStorage.getItem("ls_access_token");
            
            
           
    
            const baseUrl = notificationData?.data?.url;
    
            if (baseUrl) {
                // Build URL with query params
                const finalUrl = `${baseUrl}?shop=${encodeURIComponent(
                    shopifyShop || ""
                )}`;
    
                window.open(finalUrl, "_blank");
            }
    
            const result = await onetrackService.connectKlaviyo();
    
            if (result) {
                console.log("Success:", result);
            } else {
                console.log("Failed:", result);
            }
        } catch (error) {
            console.error("Error connecting Klaviyo:", error);
        }
    };

    const handleDisconnect = async () => {
        const tokenValue = notificationData?.data?.tokenValue;

        const confirmed = await showConfirm(
            "Do you want to disconnect the app?",
            "Are you sure?",
            true // destructive
        );

        if (!confirmed) return;

        try {
            const payload = { tokenValue: tokenValue };
            const response = await onetrackService.disConnectKlaviyo(payload);

            let final_status = "Disconnected";

            if (response === "expired") {
                window.location.reload();
                return;
            }

            if (response?.type === "success") {
                showSuccess(response?.message || `${final_status} Successfully`);
                setTimeout(() => window.location.reload(), 1500);
            } else {
                showSuccess(`${final_status} Successfully`);
                setTimeout(() => window.location.reload(), 1500);
            }
        } catch (error) {
            console.error(error);
            showError("Something went wrong!");
        }
    };

    const data = notificationData?.data;
    const crmTypeParam = data?.crm_type_param;
    const fromWhereParam = data?.from_where_param;
    const token = data?.tokn;
    const crmType = data?.crm_type;
    const trackingOption = data?.crm_trackingoption;
    const trackingStatus = data?.crm_trackingstatus;

    const isOauthKlaviyo = (crmTypeParam === "klaviyo" && fromWhereParam === "oauth") || (crmType === "Klaviyo" && trackingOption === "Oauth");
    const isTokenEmpty = token === "";
    const isActive = trackingStatus === "ACTIVE";
    const isInactive = trackingStatus && trackingStatus !== "ACTIVE";

    return (
        <>
            <BlockStack gap="400">
                {/* ... Rest of your JSX stays the same ... */}
                {/* Just replace the swal parts - I'll show the key sections */}
                
                <Card>
                    <Grid>
                        <Grid.Cell columnSpan={{ xs: 6, sm: 4, md: 4, lg: 5, xl: 5 }}>
                            <BlockStack gap="300">
                                <Text variant="headingSm" as="h3">SELECT YOUR EMAIL MARKETING TOOL</Text>
                                <Text variant="bodyMd" as="p" tone="subdued">
                                    These notifications are triggered when a package encounters an
                                    error while in transit to its destination.
                                </Text>
                                <BlockStack gap="200">
                                    <Text variant="headingSm" as="h4">Instructions for setup</Text>
                                    <Text variant="bodyMd" as="p">
                                        1. Connect your email marketing tool using the selector on the right.<br />
                                        2. Create email templates and flows inside your tool.<br />
                                        3. Return here to enable shipment events as triggers.
                                    </Text>
                                    <Button
                                        plain
                                        url="https://support.lateshipment.com/en/support/solutions/folders/1070000492432"
                                        external
                                    >
                                        Learn more
                                    </Button>
                                </BlockStack>
                            </BlockStack>
                        </Grid.Cell>

                        <Grid.Cell columnSpan={{ xs: 6, sm: 2, md: 2, lg: 7, xl: 7 }}>
                            <Card>
                                <BlockStack gap="300">
                                    <Select
                                        label="Email tool"
                                        options={[
                                            { label: 'Klaviyo', value: 'klaviyo' },
                                            { label: 'Omnisend', value: 'omnisend' },
                                        ]}
                                        value={emailTool}
                                        onChange={setEmailTool}
                                    />

                                    {emailTool === "klaviyo" && notificationData && (
                                        <BlockStack gap="300">
                                            {isOauthKlaviyo && isTokenEmpty && (
                                                <Banner status="warning">
                                                    <Text as="p">App not Connected, Please try again later</Text>
                                                </Banner>
                                            )}

                                            {isOauthKlaviyo && isActive && (
                                                <BlockStack gap="200">
                                                    <Banner status="success">
                                                        <Text as="p">
                                                            Your Klaviyo account is successfully connected with LateShipment.com
                                                        </Text>
                                                    </Banner>
                                                    <Button onClick={handleDisconnect}>Disconnect App</Button>
                                                    <Banner>
                                                        <Text as="p">Get back to Klaviyo to create email templates</Text>
                                                    </Banner>
                                                </BlockStack>
                                            )}

                                            {isOauthKlaviyo && isInactive && (
                                                <BlockStack gap="200">
                                                    <Banner status="critical">
                                                        <Text as="p">
                                                            Your Klaviyo account was disconnected with LateShipment.com
                                                        </Text>
                                                    </Banner>
                                                    <Button onClick={handleConnectKlaviyo}>Connect Klaviyo</Button>
                                                </BlockStack>
                                            )}

                                            {!isOauthKlaviyo && (
                                                <BlockStack gap="300">
                                                    <Text variant="bodyMd" as="p">
                                                        Get the private key from your Klaviyo account
                                                    </Text>
                                                    <Text variant="bodySm" as="p" tone="subdued">
                                                        It will be available under Profile &gt; Account &gt; API Keys
                                                    </Text>
                                                    <TextField
                                                        label="Paste API key here"
                                                        value={klaviyoApiKey}
                                                        onChange={setKlaviyoApiKey}
                                                        placeholder="Enter API key"
                                                        autoComplete="off"
                                                    />
                                                    <InlineStack gap="200">
                                                        <Button onClick={handleKlaviyoSave} variant="primary">Save</Button>
                                                        <Text variant="bodyMd" as="p">OR</Text>
                                                        <Button onClick={handleConnectKlaviyo}>Connect Klaviyo</Button>
                                                    </InlineStack>
                                                </BlockStack>
                                            )}
                                        </BlockStack>
                                    )}

                                    {emailTool === "omnisend" && (
                                        <BlockStack gap="300">
                                            <Text variant="headingSm" as="h4">1. Get the public key from your Omnisend account</Text>
                                            <Text variant="bodySm" as="p" tone="subdued">
                                                It will be available under your Profile &gt; Store settings &gt; Integrations & API &gt; API keys.
                                            </Text>

                                            <TextField
                                                label="2. Paste API key here"
                                                value={omnisendApiKey}
                                                onChange={setOmnisendApiKey}
                                                placeholder="Enter API key"
                                                autoComplete="off"
                                            />

                                            <Text variant="headingSm" as="h4">3. Get back to Omnisend to create email templates</Text>
                                            <Text variant="bodySm" as="p" tone="subdued">
                                                Create email with LateShipment.com events inside Omnisend
                                            </Text>

                                            <Button onClick={handleOmnisendSave} variant="primary">SAVE</Button>
                                        </BlockStack>
                                    )}
                                </BlockStack>
                            </Card>
                        </Grid.Cell>
                    </Grid>
                </Card>

                <BlockStack gap="400">
                    {sections.map((section) => (
                        <IntegrationSection
                            key={section.title}
                            section={section}
                            notificationData={notificationData}
                            showActions={false}
                            apiArray={apiArray}
                            onToggleEvent={handleEmailIntegrationToggle}
                            onPreCheck={preCheckEmailKey}
                            showToast={showToast}
                            isIntegration={true}
                        />
                    ))}
                </BlockStack>
            </BlockStack>

            <AlertComponent />
            <ConfirmComponent />
        </>
    );
}

export function SmsIntegrationsContent({ notificationData, smsProvider, setSmsProvider, showToast }) {
    const handleAttentiveToggle = async (apiKey, checked) => {
        const payload = {
            notifystatus: apiKey,
            checkStatus: checked ? "1" : "0",
            sendType: "attentive"
        };

        return await onetrackService.AttentiveIntegrate(payload);
    };

    const handleYotpoToggle = async (apiKey, checked) => {
        const payload = {
            notifystatus: apiKey,
            checkStatus: checked ? "1" : "0",
            sendType: "yotpo"
        };

        return await onetrackService.YotpoIntegrate(payload);
    };

    if (notificationData?.visibility?.smsIntegrations === false) return null;

    const sections = smsProvider === "attentive" ? ATTENTIVE_INTEGRATION_SECTIONS : YOTPO_INTEGRATION_SECTIONS;
    const apiArray = smsProvider === "attentive" ? notificationData?.data?.AttentiveMailArray : notificationData?.data?.YotpoMailArray;
    const toggleHandler = smsProvider === "attentive" ? handleAttentiveToggle : handleYotpoToggle;

    return (
        <BlockStack gap="400">
            <Card>
                <Grid>
                    <Grid.Cell columnSpan={{ xs: 6, sm: 3, md: 3, lg: 5, xl: 5 }}>
                        <BlockStack gap="300">
                            <Text variant="headingSm" as="h3">SELECT YOUR SMS TOOL</Text>
                            <Text variant="bodyMd" as="p" tone="subdued">
                                Integrate your SMS marketing tool to automatically update customers
                                when shipments move or encounter issues.
                            </Text>
                            <BlockStack gap="200">
                                <Text variant="headingSm" as="h4">Instructions for setup</Text>
                                <Button
                                    plain
                                    url="https://support.lateshipment.com/en/support/solutions/folders/1070000492432"
                                    external
                                >
                                    Learn more
                                </Button>

                                {smsProvider === "attentive" && (
                                    <BlockStack gap="200">
                                        <Text variant="bodyMd" as="p">
                                            1. Connect the LateShipment.com app from your provider's <a class="txt-link-btn txt-medium uline" href='https://ui.attentivemobile.com/signin?redir=%2Fintegrations%2Foauth-install%3Fclient_id%3D10845d57ad03402fb5e78542b6546e36%26redirect_uri%3Dhttps%253A%252F%252Fapp.lateshipment.com%252Foauth%252Fattentive%252Findex.php' target="_blank">Attentive Marketplace</a>.<br />
                                            2. Authorize the app to enable the integration. <br />
                                            3. Use the custom event triggers created inside your account to build journeys.<br />
                                            4. After creating journeys, return here to enable SMS events below.
                                        </Text>
                                    </BlockStack>
                                )}

                                {smsProvider === "yotpo" && (
                                    <BlockStack gap="200">
                                        <Text variant="bodyMd" as="p">
                                            1. Connect the LateShipment.com App from the <a class="txt-link-btn txt-medium uline" href='https://integrations-center.yotpo.com/app/#/install/applications/9thwu4demlijgmj0sjbirudw7oforvdl?state=79' target="_blank">Yotpo Marketplace</a>.<br />
                                            2. Authorize the app to enable the integration.<br />
                                            3. You can now use the event triggers created inside the global flows section of your Yotpo account to build flows.<br />
                                            4. After creating flows, be sure to come back here and enable SMS events below.
                                        </Text>
                                    </BlockStack>
                                )}
                            </BlockStack>
                        </BlockStack>
                    </Grid.Cell>

                    <Grid.Cell columnSpan={{ xs: 6, sm: 3, md: 3, lg: 7, xl: 7 }}>
                        <Card>
                            <BlockStack gap="300">
                                <Select
                                    label="SMS tool"
                                    options={[
                                        { label: 'Attentive', value: 'attentive' },
                                        { label: 'Yotpo SMS & Email', value: 'yotpo' },
                                    ]}
                                    value={smsProvider}
                                    onChange={setSmsProvider}
                                />
                                <Text variant="bodySm" as="p" tone="subdued">
                                    Make sure your provider has access to LateShipment.com events before turning on SMS triggers.
                                </Text>
                            </BlockStack>
                        </Card>
                    </Grid.Cell>
                </Grid>
            </Card>

            <Box paddingBlockStart="400">
                <Text variant="headingSm" as="h3" alignment="center">
                    SELECT THE EVENT(S) YOU WANT ACTIVE
                </Text>
            </Box>

            <BlockStack gap="400">
                {sections.map((section) => (
                    <IntegrationSection
                        key={section.title}
                        section={section}
                        notificationData={notificationData}
                        showActions={false}
                        apiArray={apiArray}
                        onToggleEvent={toggleHandler}
                        isIntegration={true}
                        showToast={showToast}
                    />
                ))}
            </BlockStack>
        </BlockStack>
    );
}

// ... Keep IntegrationSection and IntegrationRow components same as before ...

function IntegrationSection({ section, notificationData, apiArray, onToggleEvent, showToast, isIntegration, onPreCheck }) {
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
                                <IntegrationRow
                                    item={item}
                                    notificationData={notificationData}
                                    apiArray={apiArray}
                                    onToggleEvent={onToggleEvent}
                                    onPreCheck={onPreCheck}
                                    showToast={showToast}
                                    isIntegration={isIntegration}
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

function IntegrationRow({ item, notificationData, apiArray, onToggleEvent, showToast, isIntegration, onPreCheck }) {
    const [loading, setLoading] = useState(false);
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [pendingToggle, setPendingToggle] = useState(null);

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

    const isDisabled = notificationData?.permissions?.canEdit === false;

    return (
        <>
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