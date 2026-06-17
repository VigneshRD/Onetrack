import { useState } from "react";
import {
  Page,
  Layout,
  Card,
  TextField,
  Select,
  Checkbox,
  Button,
  BlockStack,
  InlineStack,
  Text,
  Divider,
  Banner,
} from "@shopify/polaris";

export default function SettingsPage() {
  const [formData, setFormData] = useState({
    storeName: "My Awesome Store",
    email: "admin@mystore.com",
    syncInterval: "60",
    autoSync: true,
    emailNotifications: true,
    notifyShipped: true,
    notifyDelivered: true,
    notifyException: true,
    brandColor: "#008060",
    trackingPageEnabled: true,
  });

  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleChange = (field) => (value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    // Simulate API call
    setTimeout(() => {
      setIsSaving(false);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    }, 1000);
  };

  const syncIntervalOptions = [
    { label: "Every 30 minutes", value: "30" },
    { label: "Every hour", value: "60" },
    { label: "Every 2 hours", value: "120" },
    { label: "Every 4 hours", value: "240" },
  ];

  return (
    <Page
      title="Settings"
      subtitle="Configure your tracking app preferences"
      primaryAction={{
        content: "Save",
        loading: isSaving,
        onAction: handleSave,
      }}
    >
      <Layout>
        {showSuccess && (
          <Layout.Section>
            <Banner tone="success" onDismiss={() => setShowSuccess(false)}>
              Settings saved successfully!
            </Banner>
          </Layout.Section>
        )}

        {/* General Settings */}
        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <Text variant="headingMd" as="h2">
                General Settings
              </Text>
              <Divider />
              <TextField
                label="Store Name"
                value={formData.storeName}
                onChange={handleChange("storeName")}
                autoComplete="off"
              />
              <TextField
                label="Contact Email"
                type="email"
                value={formData.email}
                onChange={handleChange("email")}
                helpText="Email for notifications and support"
                autoComplete="email"
              />
            </BlockStack>
          </Card>
        </Layout.Section>

        {/* Tracking Settings */}
        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <Text variant="headingMd" as="h2">
                Tracking Settings
              </Text>
              <Divider />

              <Checkbox
                label="Enable automatic tracking sync"
                checked={formData.autoSync}
                onChange={handleChange("autoSync")}
                helpText="Automatically sync tracking information from carriers"
              />

              {formData.autoSync && (
                <Select
                  label="Sync interval"
                  options={syncIntervalOptions}
                  value={formData.syncInterval}
                  onChange={handleChange("syncInterval")}
                />
              )}

              <Checkbox
                label="Enable branded tracking page"
                checked={formData.trackingPageEnabled}
                onChange={handleChange("trackingPageEnabled")}
                helpText="Allow customers to track shipments on your branded page"
              />

              {formData.trackingPageEnabled && (
                <TextField
                  label="Brand Color"
                  type="color"
                  value={formData.brandColor}
                  onChange={handleChange("brandColor")}
                  helpText="Color for your tracking page branding"
                />
              )}
            </BlockStack>
          </Card>
        </Layout.Section>

        {/* Notification Settings */}
        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <Text variant="headingMd" as="h2">
                Email Notifications
              </Text>
              <Divider />

              <Checkbox
                label="Enable email notifications"
                checked={formData.emailNotifications}
                onChange={handleChange("emailNotifications")}
                helpText="Send email updates to customers about their shipments"
              />

              {formData.emailNotifications && (
                <BlockStack gap="300">
                  <Text variant="headingSm" tone="subdued">
                    Notify customers when:
                  </Text>
                  <Checkbox
                    label="Order is shipped"
                    checked={formData.notifyShipped}
                    onChange={handleChange("notifyShipped")}
                  />
                  <Checkbox
                    label="Package is delivered"
                    checked={formData.notifyDelivered}
                    onChange={handleChange("notifyDelivered")}
                  />
                  <Checkbox
                    label="There's a delivery exception"
                    checked={formData.notifyException}
                    onChange={handleChange("notifyException")}
                  />
                </BlockStack>
              )}
            </BlockStack>
          </Card>
        </Layout.Section>

        {/* Carrier API Keys */}
        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <Text variant="headingMd" as="h2">
                Carrier API Keys
              </Text>
              <Divider />

              <BlockStack gap="300">
                <TextField
                  label="FedEx API Key"
                  value=""
                  onChange={() => {}}
                  placeholder="Enter FedEx API key"
                  type="password"
                  autoComplete="off"
                />
                <TextField
                  label="UPS Client ID"
                  value=""
                  onChange={() => {}}
                  placeholder="Enter UPS Client ID"
                  type="password"
                  autoComplete="off"
                />
                <TextField
                  label="USPS User ID"
                  value=""
                  onChange={() => {}}
                  placeholder="Enter USPS User ID"
                  autoComplete="off"
                />
              </BlockStack>

              <Banner tone="info">
                <p>
                  API keys are encrypted and stored securely. Get your API
                  credentials from the respective carrier developer portals.
                </p>
              </Banner>
            </BlockStack>
          </Card>
        </Layout.Section>

        {/* Plan Information */}
        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <InlineStack align="space-between" blockAlign="center">
                <BlockStack gap="100">
                  <Text variant="headingMd" as="h2">
                    Current Plan
                  </Text>
                  <Text variant="bodySm" tone="subdued">
                    Free Plan - 50 shipments per month
                  </Text>
                </BlockStack>
                <Button>Upgrade Plan</Button>
              </InlineStack>

              <Divider />

              <BlockStack gap="200">
                <InlineStack align="space-between">
                  <Text>Shipments this month</Text>
                  <Text fontWeight="semibold">24 / 50</Text>
                </InlineStack>
                <div
                  style={{
                    height: "8px",
                    backgroundColor: "#e1e3e5",
                    borderRadius: "4px",
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      height: "100%",
                      width: "48%",
                      backgroundColor: "#008060",
                      borderRadius: "4px",
                    }}
                  />
                </div>
              </BlockStack>
            </BlockStack>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}