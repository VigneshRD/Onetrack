import { useState } from "react";
import {
  Page,
  Layout,
  Card,
  TextField,
  Button,
  BlockStack,
  Text,
  Badge,
  InlineStack,
  Divider,
  Banner,
} from "@shopify/polaris";

export default function TrackingPage() {
  const [trackingNumber, setTrackingNumber] = useState("");
  const [showResults, setShowResults] = useState(false);

  // Static tracking data
  const trackingData = {
    trackingNumber: "1Z999AA10123456784",
    carrier: "UPS",
    status: "in_transit",
    estimatedDelivery: "May 17, 2024",
    currentLocation: "Los Angeles, CA",
    checkpoints: [
      {
        date: "May 15, 2024",
        time: "10:30 AM",
        location: "Los Angeles, CA",
        status: "In Transit",
        description: "Package is in transit",
      },
      {
        date: "May 15, 2024",
        time: "6:15 AM",
        location: "Phoenix, AZ",
        status: "Departed Facility",
        description: "Departed from UPS facility",
      },
      {
        date: "May 14, 2024",
        time: "8:45 PM",
        location: "Phoenix, AZ",
        status: "Arrived at Facility",
        description: "Arrived at UPS facility",
      },
      {
        date: "May 14, 2024",
        time: "2:20 PM",
        location: "Dallas, TX",
        status: "Departed Facility",
        description: "Departed from origin facility",
      },
      {
        date: "May 14, 2024",
        time: "11:00 AM",
        location: "Dallas, TX",
        status: "Origin Scan",
        description: "Package picked up and scanned",
      },
      {
        date: "May 14, 2024",
        time: "9:30 AM",
        location: "Dallas, TX",
        status: "Label Created",
        description: "Shipping label created",
      },
    ],
  };

  const handleSearch = () => {
    if (trackingNumber) {
      setShowResults(true);
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      delivered: { tone: "success", label: "Delivered" },
      in_transit: { tone: "info", label: "In Transit" },
      out_for_delivery: { tone: "attention", label: "Out for Delivery" },
      exception: { tone: "warning", label: "Exception" },
    };

    const config = statusConfig[status] || { tone: "new", label: "Unknown" };
    return <Badge tone={config.tone}>{config.label}</Badge>;
  };

  return (
    <Page
      title="Track Shipments"
      subtitle="Enter a tracking number to view shipment details"
    >
      <Layout>
        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <Text variant="headingMd" as="h2">
                Enter Tracking Number
              </Text>
              <InlineStack gap="400" align="start">
                <div style={{ flex: 1 }}>
                  <TextField
                    placeholder="e.g., 1Z999AA10123456784"
                    value={trackingNumber}
                    onChange={setTrackingNumber}
                    autoComplete="off"
                  />
                </div>
                <Button variant="primary" onClick={handleSearch}>
                  Track
                </Button>
              </InlineStack>

              {!showResults && (
                <Banner tone="info">
                  <p>
                    Supported carriers: FedEx, UPS, USPS, DHL, Canada Post, and
                    more
                  </p>
                </Banner>
              )}
            </BlockStack>
          </Card>
        </Layout.Section>

        {showResults && (
          <>
            <Layout.Section>
              <Card>
                <BlockStack gap="400">
                  <InlineStack align="space-between" blockAlign="center">
                    <Text variant="headingLg" as="h2">
                      Tracking Details
                    </Text>
                    {getStatusBadge(trackingData.status)}
                  </InlineStack>

                  <Divider />

                  <InlineStack gap="800" wrap={false}>
                    <BlockStack gap="200">
                      <Text variant="headingSm" tone="subdued">
                        Tracking Number
                      </Text>
                      <Text variant="bodyMd" fontWeight="semibold">
                        {trackingData.trackingNumber}
                      </Text>
                    </BlockStack>

                    <BlockStack gap="200">
                      <Text variant="headingSm" tone="subdued">
                        Carrier
                      </Text>
                      <Text variant="bodyMd" fontWeight="semibold">
                        {trackingData.carrier}
                      </Text>
                    </BlockStack>

                    <BlockStack gap="200">
                      <Text variant="headingSm" tone="subdued">
                        Estimated Delivery
                      </Text>
                      <Text variant="bodyMd" fontWeight="semibold">
                        {trackingData.estimatedDelivery}
                      </Text>
                    </BlockStack>

                    <BlockStack gap="200">
                      <Text variant="headingSm" tone="subdued">
                        Current Location
                      </Text>
                      <Text variant="bodyMd" fontWeight="semibold">
                        {trackingData.currentLocation}
                      </Text>
                    </BlockStack>
                  </InlineStack>
                </BlockStack>
              </Card>
            </Layout.Section>

            <Layout.Section>
              <Card>
                <BlockStack gap="400">
                  <Text variant="headingMd" as="h2">
                    Tracking History
                  </Text>

                  <div style={{ position: "relative" }}>
                    {/* Timeline */}
                    <div
                      style={{
                        position: "absolute",
                        left: "15px",
                        top: "30px",
                        bottom: "30px",
                        width: "2px",
                        backgroundColor: "#e1e3e5",
                      }}
                    />

                    <BlockStack gap="500">
                      {trackingData.checkpoints.map((checkpoint, index) => (
                        <div key={index} style={{ position: "relative" }}>
                          <InlineStack gap="400" wrap={false}>
                            {/* Timeline dot */}
                            <div
                              style={{
                                width: "32px",
                                height: "32px",
                                borderRadius: "50%",
                                backgroundColor:
                                  index === 0 ? "#008060" : "#e1e3e5",
                                border:
                                  index === 0
                                    ? "4px solid #b5e3d8"
                                    : "4px solid #f1f2f3",
                                flexShrink: 0,
                                zIndex: 1,
                              }}
                            />

                            <BlockStack gap="100" inlineAlign="start">
                              <InlineStack gap="200" blockAlign="center">
                                <Text
                                  variant="bodyMd"
                                  fontWeight={index === 0 ? "bold" : "regular"}
                                >
                                  {checkpoint.status}
                                </Text>
                                {index === 0 && (
                                  <Badge tone="info">Latest</Badge>
                                )}
                              </InlineStack>

                              <Text variant="bodySm" tone="subdued">
                                {checkpoint.description}
                              </Text>

                              <InlineStack gap="300">
                                <Text variant="bodySm" tone="subdued">
                                  📍 {checkpoint.location}
                                </Text>
                                <Text variant="bodySm" tone="subdued">
                                  🕐 {checkpoint.date} at {checkpoint.time}
                                </Text>
                              </InlineStack>
                            </BlockStack>
                          </InlineStack>
                        </div>
                      ))}
                    </BlockStack>
                  </div>
                </BlockStack>
              </Card>
            </Layout.Section>
          </>
        )}
      </Layout>
    </Page>
  );
}