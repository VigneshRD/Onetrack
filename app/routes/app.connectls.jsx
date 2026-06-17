import { useState, useCallback } from "react";
import {
  Page,
  Card,
  FormLayout,
  TextField,
  Button,
  Banner,
  BlockStack,
  InlineStack,
  Text,
  Badge,
  Divider,
  Box,
  Icon,
  InlineGrid,
} from "@shopify/polaris";
import { CheckCircleIcon, AlertCircleIcon } from "@shopify/polaris-icons";

export default function ConnectLateShipment() {
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("idle"); // idle | success | error
  const [apiError, setApiError] = useState("");
  const [connectedEmail, setConnectedEmail] = useState("");

  // ── Validation ──────────────────────────────────────────────────────────────
  const validateEmail = (value) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

  const handleEmailChange = useCallback((value) => {
    setEmail(value);
    if (emailError) setEmailError("");
  }, [emailError]);

  // ── Connect ─────────────────────────────────────────────────────────────────
  const handleConnect = useCallback(async () => {
    setStatus("idle");
    setApiError("");

    if (!email.trim()) {
      setEmailError("Email is required.");
      return;
    }
    if (!validateEmail(email.trim())) {
      setEmailError("Please enter a valid email address.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        "https://devappservice.lateshipment.com/shopify/connect",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({ email: email.trim() }),
        }
      );

      let data = {};
      try {
        data = await response.json();
      } catch (_) {}

      if (response.ok) {
        setConnectedEmail(email.trim());
        setStatus("success");
      } else {
        const msg =
          data.message ||
          data.error ||
          "We couldn't connect your account. Please check your email and try again.";
        setApiError(msg);
        setStatus("error");
      }
    } catch (err) {
      setApiError("Network error. Please check your connection and try again.");
      setStatus("error");
    } finally {
      setLoading(false);
    }
  }, [email]);

  // ── Disconnect ───────────────────────────────────────────────────────────────
  const handleDisconnect = useCallback(() => {
    setStatus("idle");
    setEmail("");
    setEmailError("");
    setApiError("");
    setConnectedEmail("");
  }, []);

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <Page
      title="Connect your account"
      subtitle="Link your LateShipment account to start syncing order data"
      primaryAction={
        status !== "success"
          ? {
              content: "Connect account",
              loading,
              onAction: handleConnect,
              disabled: loading,
            }
          : undefined
      }
      additionalMetadata={
        status === "success" ? (
          <Badge tone="success">Connected</Badge>
        ) : (
          <Badge tone="attention">Not connected</Badge>
        )
      }
    >
      <BlockStack gap="400">

        {/* ── Success Banner ── */}
        {status === "success" && (
          <Banner
            title="Account connected successfully"
            tone="success"
            icon={CheckCircleIcon}
          >
            <p>
              Your store is now linked to LateShipment. Order data will begin
              syncing shortly.
            </p>
          </Banner>
        )}

        {/* ── Error Banner ── */}
        {status === "error" && (
          <Banner
            title="Connection failed"
            tone="critical"
            icon={AlertCircleIcon}
            onDismiss={() => setStatus("idle")}
          >
            <p>{apiError}</p>
          </Banner>
        )}

        {/* ── Connect Card ── */}
        {status !== "success" && (
          <Card>
            <BlockStack gap="400">

              {/* Hero row */}
              <Box
                background="bg-surface-secondary"
                padding="400"
                borderRadiusStartStart="300"
                borderRadiusStartEnd="300"
              >
                <InlineStack gap="300" align="start" blockAlign="center">
                  {/* Shopify icon */}
                  <Box
                    background="bg-surface"
                    borderWidth="025"
                    borderColor="border"
                    borderRadius="200"
                    padding="300"
                  >
                    <svg
                      width="28"
                      height="28"
                      viewBox="0 0 28 28"
                      fill="none"
                      aria-hidden="true"
                    >
                      <rect width="28" height="28" rx="6" fill="#96bf48" />
                      <path
                        d="M7 10h5V7l6 7-6 7v-3H7v-8z"
                        fill="#fff"
                      />
                    </svg>
                  </Box>

                  {/* Arrow */}
                  <Text tone="subdued" as="span">→</Text>

                  {/* LateShipment icon */}
                  <Box
                    background="bg-surface"
                    borderWidth="025"
                    borderColor="border"
                    borderRadius="200"
                    padding="300"
                  >
                    <svg
                      width="28"
                      height="28"
                      viewBox="0 0 28 28"
                      fill="none"
                      aria-hidden="true"
                    >
                      <rect width="28" height="28" rx="6" fill="#1a1a2e" />
                      <circle cx="14" cy="14" r="5" stroke="#fff" strokeWidth="1.5" />
                      <path
                        d="M14 9V6M14 22v-3M9 14H6M22 14h-3"
                        stroke="#fff"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                      />
                    </svg>
                  </Box>

                  <BlockStack gap="050">
                    <Text variant="headingSm" as="h2">
                      Shopify → LateShipment
                    </Text>
                    <Text variant="bodySm" tone="subdued" as="p">
                      Sync orders, shipments &amp; returns automatically
                    </Text>
                  </BlockStack>
                </InlineStack>
              </Box>

              {/* Form */}
              <Box paddingInline="400" paddingBlockEnd="400">
                <FormLayout>
                  <TextField
                    label="LateShipment account email"
                    type="email"
                    value={email}
                    onChange={handleEmailChange}
                    onBlur={() => {
                      if (email && !validateEmail(email)) {
                        setEmailError("Please enter a valid email address.");
                      }
                    }}
                    placeholder="you@company.com"
                    autoComplete="email"
                    helpText="Use the email registered with your LateShipment account."
                    error={emailError}
                    disabled={loading}
                    connectedRight={
                      <Button
                        variant="primary"
                        loading={loading}
                        disabled={loading}
                        onClick={handleConnect}
                      >
                        Connect
                      </Button>
                    }
                  />
                </FormLayout>
              </Box>

              <Divider />

              {/* What happens next */}
              <Box paddingInline="400" paddingBlockEnd="400">
                <BlockStack gap="300">
                  <Text variant="headingSm" as="h3">
                    What happens when you connect?
                  </Text>
                  <BlockStack gap="200">
                    {[
                      "We verify your LateShipment account using your email address",
                      "Your Shopify orders are mapped to your LateShipment workspace",
                      "Tracking data, delays & exceptions begin syncing automatically",
                    ].map((step, i) => (
                      <InlineStack key={i} gap="200" blockAlign="start">
                        <Box
                          background="bg-surface-secondary"
                          borderRadius="full"
                          minWidth="20px"
                          minHeight="20px"
                          paddingInline="100"
                        >
                          <Text
                            variant="bodySm"
                            tone="subdued"
                            fontWeight="semibold"
                            as="span"
                          >
                            {i + 1}
                          </Text>
                        </Box>
                        <Text variant="bodySm" tone="subdued" as="p">
                          {step}
                        </Text>
                      </InlineStack>
                    ))}
                  </BlockStack>
                </BlockStack>
              </Box>

            </BlockStack>
          </Card>
        )}

        {/* ── Connected Card ── */}
        {status === "success" && (
          <Card>
            <InlineStack gap="400" blockAlign="center">
              {/* Avatar */}
              <Box
                background="bg-fill-success-secondary"
                borderWidth="025"
                borderColor="border-success"
                borderRadius="full"
                padding="300"
              >
                <Icon source={CheckCircleIcon} tone="success" />
              </Box>

              <BlockStack gap="050">
                <Text variant="headingSm" as="p" fontWeight="semibold">
                  Connected
                </Text>
                <Text variant="bodySm" tone="subdued" as="p">
                  Linked as {connectedEmail}
                </Text>
              </BlockStack>

              <Box paddingInlineStart="auto">
                <Button
                  tone="critical"
                  variant="plain"
                  onClick={handleDisconnect}
                >
                  Disconnect
                </Button>
              </Box>
            </InlineStack>
          </Card>
        )}

      </BlockStack>
    </Page>
  );
}