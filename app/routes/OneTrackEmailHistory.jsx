import React, { useEffect, useState } from "react";
import {
    Modal, Button, Spinner, Box, Text, IndexTable, Badge, Tooltip, BlockStack, InlineStack, Divider, Scrollable
} from "@shopify/polaris";
import { ViewIcon, EmailIcon, XIcon, ClockIcon } from "@shopify/polaris-icons";
import lstrackparceldetailsService from '../../src/services/lstrackparceldetailsService'; // ✅ No curly braces

export default function OneTrackEmailHistory({ open, onClose, trackingnumber }) {
    const [loading, setLoading] = useState(false);
    const [history, setHistory] = useState([]);
    const [error, setError] = useState(null);
    const [viewingEmail, setViewingEmail] = useState(null);
    const [emailContent, setEmailContent] = useState("");
    const [emailContentLoading, setEmailContentLoading] = useState(false);
    const [emailContentError, setEmailContentError] = useState("");

    useEffect(() => {
        if (open && trackingnumber) {
            setLoading(true);
            setError(null);

            lstrackparceldetailsService.getemailhistoryapi({ trackingnumber: trackingnumber })
                .then(({ success, data, error: err }) => {
                    if (success) {
                        // The response contains items under numeric keys "0", "1", ...
                        const rawData = data?.data || data || {};
                        const historyArray = Object.keys(rawData)
                            .filter(key => /^\d+$/.test(key))
                            .map(key => rawData[key]);
                        setHistory(historyArray);
                    } else {
                        setError(err || "Failed to fetch email history");
                    }
                })
                .catch(() => {
                    setError("An error occurred while fetching email history.");
                })
                .finally(() => {
                    setLoading(false);
                });
        } else {
            setHistory([]);
        }
    }, [open, trackingnumber]);

    useEffect(() => {
        if (viewingEmail) {
            setEmailContent("");
            setEmailContentLoading(true);
            setEmailContentError("");

            const payload = {
                trackno: viewingEmail.trackingnumber || "",
                statustype: viewingEmail.shipmentstatustype || "",
                subject: viewingEmail.subject || "",
                templatename: viewingEmail.templatename || "",
                senton: viewingEmail.senton || "",
                sentto: viewingEmail.sentto || "",
                mdata: viewingEmail.docId?.$id || ""
            };

            lstrackparceldetailsService.getEmailTemplateView(payload)
                .then(({ success, data, error: err }) => {
                    if (success) {
                        setEmailContent(data?.emailContent || "No content returned.");
                    } else {
                        setEmailContentError(err || "Failed to load email content.");
                    }
                })
                .catch(() => {
                    setEmailContentError("An error occurred loading email content.");
                })
                .finally(() => {
                    setEmailContentLoading(false);
                });
        }
    }, [viewingEmail]);

    const getStatusBadge = (status) => {
        if (!status) return null;
        let tone = "info";
        const lower = status.toLowerCase();
        if (lower === "sent") tone = "success";
        else if (lower === "failed" || lower === "bounced" || lower === "dropped") tone = "critical";
        else if (lower === "delivered") tone = "success";

        return <Badge tone={tone}>{status}</Badge>;
    };

    const rowMarkup = history.map((item, index) => (
        <IndexTable.Row id={index.toString()} key={index} position={index}>
            <IndexTable.Cell>{item.senton || "-"}</IndexTable.Cell>
            <IndexTable.Cell>{item.sentto || "-"}</IndexTable.Cell>
            <IndexTable.Cell>{item.templatename || "-"}</IndexTable.Cell>
            <IndexTable.Cell>{item.subject || "-"}</IndexTable.Cell>
            <IndexTable.Cell>{item.event || "-"}</IndexTable.Cell>
            <IndexTable.Cell>{getStatusBadge(item.mailstatus)}</IndexTable.Cell>
            <IndexTable.Cell>
                <Tooltip content="View Email">
                    <Button variant="plain" icon={ViewIcon} onClick={() => setViewingEmail(item)} />
                </Tooltip>
            </IndexTable.Cell>
        </IndexTable.Row>
    ));

    return (
        <Modal
            open={open}
            onClose={onClose}
            title="Email History"
            large
            primaryAction={{
                content: 'Close',
                onAction: onClose,
            }}
        >
            <Modal.Section>
                {loading ? (
                    <Box padding="800">
                        <InlineStack align="center" blockAlign="center">
                            <Spinner accessibilityLabel="Loading email history" size="large" />
                        </InlineStack>
                    </Box>
                ) : error ? (
                    <Box padding="800">
                        <InlineStack align="center" blockAlign="center">
                            <Text tone="critical" variant="bodyMd">{error}</Text>
                        </InlineStack>
                    </Box>
                ) : history.length === 0 ? (
                    <Box padding="800">
                        <InlineStack align="center" blockAlign="center">
                            <Text tone="subdued" variant="bodyMd">No email history found.</Text>
                        </InlineStack>
                    </Box>
                ) : (
                    <IndexTable
                        resourceName={{ singular: 'email', plural: 'emails' }}
                        itemCount={history.length}
                        headings={[
                            { title: 'Sent On' },
                            { title: 'Sent To' },
                            { title: 'Template Name' },
                            { title: 'Subject' },
                            { title: 'Event' },
                            { title: 'Status' },
                            { title: 'Action', alignment: 'center' },
                        ]}
                        selectable={false}
                    >
                        {rowMarkup}
                    </IndexTable>
                )}
            </Modal.Section>

            {/* Inner Modal for Viewing Email Details */}
            {viewingEmail && (
                <Modal
                    open={!!viewingEmail}
                    onClose={() => setViewingEmail(null)}
                    title="Email Details"
                    large
                >
                    <Modal.Section>
                        <BlockStack gap="400">
                            <BlockStack gap="100">
                                <Text tone="subdued" variant="bodySm" fontWeight="bold">TEMPLATE</Text>
                                <Text variant="bodyMd">{viewingEmail.templatename || "-"}</Text>
                            </BlockStack>
                            <BlockStack gap="100">
                                <Text tone="subdued" variant="bodySm" fontWeight="bold">SUBJECT</Text>
                                <Text variant="bodyMd">{viewingEmail.subject || "-"}</Text>
                            </BlockStack>
                            <InlineStack gap="600">
                                <BlockStack gap="100">
                                    <Text tone="subdued" variant="bodySm" fontWeight="bold">SENT TO</Text>
                                    <Text variant="bodyMd">{viewingEmail.sentto || "-"}</Text>
                                </BlockStack>
                                <BlockStack gap="100">
                                    <Text tone="subdued" variant="bodySm" fontWeight="bold">SENT ON</Text>
                                    <Text variant="bodyMd">{viewingEmail.senton || "-"}</Text>
                                </BlockStack>
                                <BlockStack gap="050">
                                    <Text tone="subdued" variant="bodySm" fontWeight="bold">STATUS</Text>
                                    {getStatusBadge(viewingEmail.mailstatus)}
                                </BlockStack>
                            </InlineStack>

                            <Divider />

                            <Box
                                background="bg-surface-secondary"
                                borderRadius="200"
                                padding="400"
                                borderWidth="025"
                                borderColor="border"
                                style={{
                                    height: '400px',
                                }}
                            >
                                <Scrollable style={{ height: '100%' }}>
                                    {emailContentLoading ? (
                                        <InlineStack align="center" blockAlign="center" style={{ height: '100%' }}>
                                            <Spinner size="small" />
                                        </InlineStack>
                                    ) : emailContentError ? (
                                        <InlineStack align="center" blockAlign="center" style={{ height: '100%' }}>
                                            <Text tone="critical" variant="bodyMd">{emailContentError}</Text>
                                        </InlineStack>
                                    ) : (
                                        <Box>
                                            <div
                                                style={{ wordBreak: 'break-word', overflowWrap: 'break-word' }}
                                                dangerouslySetInnerHTML={{ __html: emailContent }}
                                            />
                                        </Box>
                                    )}
                                </Scrollable>
                            </Box>
                        </BlockStack>
                    </Modal.Section>
                </Modal>
            )}
        </Modal>
    );
}
