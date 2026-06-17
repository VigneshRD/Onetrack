import React, { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router";
import {
  Page,
  Layout,
  Card,
  Text,
  Box,
  InlineStack,
  BlockStack,
  Button,
  Icon,
  Badge,
  Divider,
  Spinner,
  TextField,
  Modal,
  Frame,
  Toast,
  Avatar,
  Collapsible,
  Link,
  Banner,
  EmptyState,
  Thumbnail,
} from "@shopify/polaris";
import {
  ArrowLeftIcon,
  StarIcon,
  EmailIcon,
  ClockIcon,
  NoteIcon,
  XCircleIcon,
  AlertCircleIcon,
  SearchIcon,
  EditIcon,
  DeleteIcon,
  PlusIcon,
  PackageIcon,
  ChevronDownIcon,
  ChevronUpIcon,
} from "@shopify/polaris-icons";
import { authenticate } from "../shopify.server";
import lstrackparceldetailsService from "../../src/services/lstrackparceldetailsService";
import OneTrackEmailHistory from "./OneTrackEmailHistory";
import OneTrackSendEmail from "./OneTrackSendEmail";
import { onetrackService } from "../../src/services/onetrackService";

export const loader = async ({ request }) => {
  await authenticate.admin(request);
  return {};
};

// Helper functions
const fmtDate = (dt) => (!dt || dt === "0000-00-00 00:00:00") ? "—" : dt.substring(0, 10);

function getStatusTone(status = "") {
  const s = status.toLowerCase();
  if (/delivered/.test(s)) return "success";
  if (/out.for.delivery/.test(s)) return "info";
  if (/transit|facility|departed/.test(s)) return "info";
  if (/await|collection|pending/.test(s)) return "warning";
  if (/exception|failed|undeliverable/.test(s)) return "critical";
  if (/label|created/.test(s)) return "subdued";
  return "subdued";
}

export default function ShipmentTrackingDetail() {
  const { trackingNumber } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Get navigation context
  const fromPath = location.state?.fromPath || "/app/ShipmentsByStatus";
  const fromLabel = location.state?.fromLabel || "Tracked Packages";
  const fromStatus = location.state?.fromStatus || "tracked-packages";
  const breadcrumb = location.state?.breadcrumb || null;

  // State
  const [apiData, setApiData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [retryValue, setRetryValue] = useState("");

  // Notes state
  const [notesOpen, setNotesOpen] = useState(false);
  const [notes, setNotes] = useState([]);
  const [noteText, setNoteText] = useState("");
  const [noteSubmitting, setNoteSubmitting] = useState(false);
  const [editingNote, setEditingNote] = useState(null);
  const [editText, setEditText] = useState("");
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  // Modal state
  const [emailHistoryOpen, setEmailHistoryOpen] = useState(false);
  const [sendEmailOpen, setSendEmailOpen] = useState(false);
  const [packageDetailsOpen, setPackageDetailsOpen] = useState(false);

  // Intercept state
  const [isIntercepting, setIsIntercepting] = useState(false);

  // Toast state
  const [toastActive, setToastActive] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastError, setToastError] = useState(false);

  const showToast = (msg, error = false) => {
    setToastMessage(msg);
    setToastError(error);
    setToastActive(true);
  };

  // Fetch tracking info
  useEffect(() => {
    if (!trackingNumber) return;
    
    setApiData(null);
    setError(null);
    setIsLoading(true);
    
    lstrackparceldetailsService
      .getTrackInfo({ 
        trackingnumber_or_ordernumber: trackingNumber, 
        wherefrom: fromStatus 
      })
      .then(({ success, data, error: err }) => {
        if (success && data?.resulttype === 1) {
          setApiData(data);
          setNotes(data.notes || []);
        } else {
          setError(err || "No tracking information found.");
        }
      })
      .catch(() => setError("Failed to fetch tracking info."))
      .finally(() => setIsLoading(false));
  }, [trackingNumber, fromStatus]);

  // Note handlers
  const resetNoteForm = () => {
    setNoteText("");
  };

  const resetEditForm = () => {
    setEditingNote(null);
    setEditText("");
  };

  const refreshNotes = async () => {
    const { success, data } = await lstrackparceldetailsService.getTrackInfo({
      trackingnumber_or_ordernumber: trackingNumber,
      wherefrom: fromStatus,
    });
    if (success && data?.notes) setNotes(data.notes);
  };

  const handleSubmitNote = async () => {
    const trimmed = noteText.trim();
    if (!trimmed) return;
    
    setNoteSubmitting(true);
    const { success, error: err } = await lstrackparceldetailsService.submitNote({
      trackingnumber: trackingNumber,
      note: trimmed,
      ordernumber: apiData?.order?.shopifyorderno || "",
    });
    setNoteSubmitting(false);
    
    if (success) {
      resetNoteForm();
      await refreshNotes();
      showToast("Note added successfully");
    } else {
      showToast(err || "Failed to add note", true);
    }
  };

  const openEdit = (note) => {
    resetEditForm();
    setEditingNote(note);
    setEditText(note.note_text);
  };

  const handleUpdateNote = async () => {
    const trimmed = editText.trim();
    if (!trimmed || !editingNote) return;
    
    setEditSubmitting(true);
    const { success, error: err } = await lstrackparceldetailsService.updateNote({
      trackingnumber: trackingNumber,
      ordernumber: apiData?.order?.shopifyorderno || "",
      note: trimmed,
      old_note: editingNote.note_text,
    });
    setEditSubmitting(false);
    
    if (success) {
      setNotes(prev => prev.map(n =>
        n.id === editingNote.id ? { ...n, note_text: trimmed } : n
      ));
      resetEditForm();
      showToast("Note updated successfully");
    } else {
      showToast(err || "Failed to update note", true);
    }
  };

  const handleDeleteNote = async (noteId) => {
    const noteToDelete = notes.find(n => n.id === noteId);
    if (!noteToDelete) return;

    setDeletingId(noteId);
    const { success } = await lstrackparceldetailsService.deleteNote({
      trackingnumber: trackingNumber,
      ordernumber: apiData?.order?.shopifyorderno || "",
      note: noteToDelete.note_text,
    });
    setDeletingId(null);
    
    if (success) {
      setNotes(prev => prev.filter(n => n.id !== noteId));
      showToast("Note deleted successfully");
    }
  };

  const handleIntercept = async () => {
    setIsIntercepting(true);
    try {
      const res = await onetrackService.interceptShipment({
        trackingnumber: trackingNumber,
        orderno: apiData?.order?.shopifyorderno || "",
        multipleShipmentsFlag: 'S'
      });
      
      if (res.success) {
        showToast(res.message || "Intercept processed successfully");
      } else {
        showToast(res.message || "Failed to process intercept", true);
      }
    } catch {
      showToast("An error occurred while intercepting shipment", true);
    } finally {
      setIsIntercepting(false);
    }
  };

  const handleRetry = () => {
    const val = retryValue.trim();
    if (!val) return;
    navigate(`/app/tracking/${encodeURIComponent(val)}`, { 
      state: { fromPath, fromLabel, fromStatus, breadcrumb } 
    });
  };

  // Loading state
  if (isLoading) {
    return (
      <Page>
        <Layout>
          <Layout.Section>
            <Card>
              <Box padding="800">
                <InlineStack align="center">
                  <Spinner size="large" />
                </InlineStack>
              </Box>
            </Card>
          </Layout.Section>
        </Layout>
      </Page>
    );
  }

  // Error state
  if (error) {
    return (
      <Page
        title="Tracking Information"
        backAction={{
          content: 'Back',
          onAction: () => navigate(fromPath, { state: { breadcrumb } }),
        }}
      >
        <Layout>
          <Layout.Section>
            <EmptyState
              heading="Tracking data not found"
              image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
            >
              <BlockStack gap="400">
                <Text variant="bodyMd" tone="subdued">{error}</Text>
                
                <Box maxWidth="400px">
                  <TextField
                    label="Tracking / Order Number"
                    value={retryValue}
                    onChange={setRetryValue}
                    placeholder="Enter tracking or order number"
                    prefix={<Icon source={SearchIcon} />}
                    autoComplete="off"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') handleRetry();
                    }}
                  />
                </Box>

                <InlineStack gap="200">
                  <Button 
                    variant="primary" 
                    disabled={!retryValue.trim()} 
                    onClick={handleRetry}
                  >
                    Try Again
                  </Button>
                  <Button onClick={() => navigate(fromPath, { state: { breadcrumb } })}>
                    Go Back
                  </Button>
                </InlineStack>
              </BlockStack>
            </EmptyState>
          </Layout.Section>
        </Layout>
      </Page>
    );
  }

  // Success - extract data
  const d = apiData;
  const sh = d.shipment || {};
  const res = d.result || {};
  const sd = Array.isArray(d.shipmentdetails) ? {} : (d.shipmentdetails || {});
  const uif = d.ui_flags || {};
  const flg = d.flags || {};
  const multipleTracking = d.multiple_tracking || [];

  const fromDisplay = sh.from || [sh.from_city, sh.from_state, sh.from_country].filter(Boolean).join(", ") || "—";
  const toDisplay = sh.to || [sh.to_city, sh.to_state, sh.to_country].filter(Boolean).join(", ") || "—";

  const deliveryAddress = d.customer?.crm_shipping_address
    || (res.To?.City ? `${res.To.City}${res.To.State ? ", " + res.To.State : ""}${res.To.country ? ", " + res.To.country : ""}${res.To.Zipcode ? " " + res.To.Zipcode : ""}` : null)
    || toDisplay;

  const customerDisplayName = d.customer?.name || d.customer?.cust_ordername || "";
  const customerEmail = d.customer?.email || d.customer?.shop_email || "";

  return (
    <Frame>
      <Page
        title="Tracking Information"
        subtitle="Detailed shipment and delivery lifecycle"
        backAction={{
          content: fromLabel,
          onAction: () => navigate(fromPath, { state: { breadcrumb } }),
        }}
      >
        <Layout>
          {/* Main Content - Left Column */}
          <Layout.Section>
            <BlockStack gap="400">
              {/* Shipment Summary Card */}
              <Card>
                <BlockStack gap="400">
                  <InlineStack align="space-between" blockAlign="center">
                    <Text variant="headingMd" as="h2">Shipment Summary</Text>
                    <Badge tone={getStatusTone(sh.status_type)}>
                      {sh.status_type}
                    </Badge>
                  </InlineStack>

                  <Divider />

                  {/* From/To */}
                  <InlineStack gap="400" align="space-between" wrap={false}>
                    <Box width="45%">
                      <BlockStack gap="100">
                        <Text variant="bodySm" tone="subdued" fontWeight="semibold">FROM</Text>
                        <Text variant="bodyMd" fontWeight="medium">{fromDisplay}</Text>
                      </BlockStack>
                    </Box>
                    
                    <Box>
                      <Icon source={ArrowLeftIcon} tone="subdued" />
                    </Box>

                    <Box width="45%">
                      <BlockStack gap="100">
                        <Text variant="bodySm" tone="subdued" fontWeight="semibold">TO</Text>
                        <Text variant="bodyMd" fontWeight="medium">{toDisplay}</Text>
                      </BlockStack>
                    </Box>
                  </InlineStack>

                  <Divider />

                  {/* Dates */}
                  <InlineStack gap="600" wrap>
                    <BlockStack gap="100">
                      <Text variant="bodySm" tone="subdued">Shipped</Text>
                      <Text variant="bodyMd" fontWeight="semibold">{fmtDate(sh.shipdate)}</Text>
                    </BlockStack>
                    
                    <BlockStack gap="100">
                      <Text variant="bodySm" tone="subdued">Delivered</Text>
                      <Text variant="bodyMd" fontWeight="semibold">{fmtDate(sh.deliverydate)}</Text>
                    </BlockStack>
                    
                    <BlockStack gap="100">
                      <Text variant="bodySm" tone="subdued">Est. Delivery</Text>
                      <Text variant="bodyMd" fontWeight="semibold" tone="success">
                        {fmtDate(sh.estimateddate)}
                      </Text>
                    </BlockStack>
                  </InlineStack>

                  <Divider />

                  {/* Package Details Collapsible */}
                  <Box>
                    <Button
                      icon={packageDetailsOpen ? ChevronUpIcon : ChevronDownIcon}
                      onClick={() => setPackageDetailsOpen(!packageDetailsOpen)}
                      variant="plain"
                      textAlign="left"
                    >
                      Package Details
                    </Button>
                    
                    <Collapsible
                      open={packageDetailsOpen}
                      id="package-details"
                      transition={{duration: '200ms', timingFunction: 'ease-in-out'}}
                    >
                      <Box paddingBlockStart="400">
                        <InlineStack gap="600" wrap>
                          <BlockStack gap="100">
                            <Text variant="bodySm" tone="subdued">Weight</Text>
                            <Text variant="bodyMd">{sd.Weight || "—"}</Text>
                          </BlockStack>
                          
                          <BlockStack gap="100">
                            <Text variant="bodySm" tone="subdued">Pieces</Text>
                            <Text variant="bodyMd">{sd.Pieces || "—"}</Text>
                          </BlockStack>
                          
                          <BlockStack gap="100">
                            <Text variant="bodySm" tone="subdued">Packaging</Text>
                            <Text variant="bodyMd">{sd.Packaging || "—"}</Text>
                          </BlockStack>
                          
                          <BlockStack gap="100">
                            <Text variant="bodySm" tone="subdued">Dimensions</Text>
                            <Text variant="bodyMd">{sd.Dimensions || "—"}</Text>
                          </BlockStack>
                        </InlineStack>
                      </Box>
                    </Collapsible>
                  </Box>

                  <Divider />

                  {/* Action Buttons */}
                  <InlineStack gap="200" wrap>
                    <Button
                      icon={NoteIcon}
                      onClick={() => {
                        resetNoteForm();
                        resetEditForm();
                        setNotesOpen(true);
                      }}
                    >
                      Notes {notes.length > 0 && `(${notes.length})`}
                    </Button>
                    
                    {/* {uif.intercept_order && (
                      <Button
                        icon={XCircleIcon}
                        tone="critical"
                        loading={isIntercepting}
                        onClick={handleIntercept}
                      >
                        Intercept Shipment
                      </Button>
                    )} */}
                    
                    <Button
                      icon={EmailIcon}
                      disabled={!uif.send_email}
                      onClick={() => setSendEmailOpen(true)}
                    >
                      Send Email
                    </Button>
                    
                    <Button
                      icon={ClockIcon}
                      disabled={!uif.email_history}
                      onClick={() => setEmailHistoryOpen(true)}
                    >
                      Email History
                    </Button>
                  </InlineStack>

                  {/* Original Tracking Number */}
                  {flg.overlabel_flag === "Y" && flg.original_trackingnumber && (
                    <Box>
                      <Divider />
                      <BlockStack gap="200">
                        <Text variant="bodySm" tone="subdued" fontWeight="semibold">
                          ORIGINAL TRACKING NUMBER
                        </Text>
                        <Button
                          variant="plain"
                          onClick={() => navigate(`/app/tracking/${encodeURIComponent(flg.original_trackingnumber)}`, {
                            state: { fromPath, fromLabel, fromStatus, breadcrumb }
                          })}
                        >
                          {flg.original_trackingnumber}
                        </Button>
                      </BlockStack>
                    </Box>
                  )}

                  {/* Multiple Tracking */}
                  {multipleTracking.length > 0 && (
                    <Box>
                      <Divider />
                      <BlockStack gap="200">
                        <Text variant="bodySm" tone="subdued" fontWeight="semibold">
                          OTHER PACKAGES IN THIS ORDER
                        </Text>
                        <InlineStack gap="200" wrap>
                          {multipleTracking.map((tn) => (
                            <Button
                              key={tn}
                              variant="plain"
                              onClick={() => navigate(`/app/tracking/${encodeURIComponent(tn)}`, {
                                state: { fromPath, fromLabel, fromStatus, breadcrumb }
                              })}
                            >
                              {tn}
                            </Button>
                          ))}
                        </InlineStack>
                      </BlockStack>
                    </Box>
                  )}
                </BlockStack>
              </Card>

              {/* Tracking Details Card */}
              <Card>
                <BlockStack gap="400">
                  <InlineStack align="space-between" blockAlign="center">
                    <Text variant="headingMd" as="h2">Tracking Details</Text>
                    <Text variant="bodySm" tone="subdued">
                      {d.events.length} Total Events
                    </Text>
                  </InlineStack>

                  <Divider />

                  <Box maxHeight="500px" style={{ overflowY: 'auto' }}>
                    <BlockStack gap="300">
                      {d.events.map((ev, idx) => (
                        <Box key={idx}>
                          <InlineStack gap="300" blockAlign="start">
                            <Box width="10px">
                              <div style={{
                                width: '10px',
                                height: '10px',
                                borderRadius: '50%',
                                backgroundColor: getStatusTone(ev.Status) === 'success' ? '#22c55e' : 
                                               getStatusTone(ev.Status) === 'critical' ? '#ef4444' : 
                                               getStatusTone(ev.Status) === 'warning' ? '#f59e0b' : '#94a3b8'
                              }} />
                            </Box>
                            
                            <Box style={{ flex: 1 }}>
                              <BlockStack gap="100">
                                <Text variant="bodyMd" fontWeight="semibold">{ev.events}</Text>
                                <Text variant="bodySm" tone="subdued">{ev.Location}</Text>
                                <Text variant="bodySm" tone="subdued">{ev.Datetime}</Text>
                              </BlockStack>
                            </Box>

                            <Badge tone={getStatusTone(ev.Status)}>
                              {ev.Status}
                            </Badge>
                          </InlineStack>
                          
                          {idx < d.events.length - 1 && (
                            <Box paddingBlockStart="200" paddingBlockEnd="200">
                              <Divider />
                            </Box>
                          )}
                        </Box>
                      ))}
                    </BlockStack>
                  </Box>
                </BlockStack>
              </Card>
            </BlockStack>
          </Layout.Section>

          {/* Sidebar - Right Column */}
          <Layout.Section variant="oneThird">
            <BlockStack gap="400">
              {/* Shipment Details Card */}
              <Card>
                <BlockStack gap="400">
                  <Text variant="headingMd" as="h2">Shipment Details</Text>
                  
                  <Divider />

                  {/* Carrier */}
                  <InlineStack gap="300" blockAlign="center">
                    <Avatar size="lg" name={d.carrier.name || d.carrier.type} />
                    <BlockStack gap="050">
                      <Text variant="bodyMd" fontWeight="bold">
                        {d.carrier.name || d.carrier.type}
                      </Text>
                      <Text variant="bodySm" tone="subdued">
                        {res.Service || "Standard Shipping"}
                      </Text>
                    </BlockStack>
                  </InlineStack>

                  <Divider />

                  {/* Tracking Number */}
                  <BlockStack gap="100">
                    <Text variant="bodySm" tone="subdued" fontWeight="semibold">
                      TRACKING NUMBER
                    </Text>
                    <Text variant="bodyMd" fontWeight="medium" style={{ fontFamily: 'monospace', wordBreak: 'break-all' }}>
                      {d.trackingnumber}
                    </Text>
                  </BlockStack>

                  <BlockStack gap="100">
                    <Text variant="bodySm" tone="subdued" fontWeight="semibold">
                      ORDER NUMBER
                    </Text>
                    <Text variant="bodyMd" fontWeight="medium">
                      {d.order.shopifyorderno}
                    </Text>
                  </BlockStack>

                  <BlockStack gap="100">
                    <Text variant="bodySm" tone="subdued" fontWeight="semibold">
                      ORDER ID
                    </Text>
                    <Text variant="bodyMd" fontWeight="medium">
                      {d.order.order_no}
                    </Text>
                  </BlockStack>

                  <Divider />

                  {/* Current Status */}
                  <Box 
                    background="bg-surface-secondary"
                    padding="300"
                    borderRadius="200"
                  >
                    <BlockStack gap="100">
                      <Text variant="bodySm" tone="subdued" fontWeight="semibold">
                        CURRENT STATUS
                      </Text>
                      <Text variant="bodyMd" fontWeight="bold">
                        {sh.current_status}
                      </Text>
                    </BlockStack>
                  </Box>
                </BlockStack>
              </Card>

              {/* Customer Card */}
              <Card>
                <BlockStack gap="400">
                  <Text variant="headingMd" as="h2">Customer</Text>
                  
                  <Divider />

                  <InlineStack gap="300" blockAlign="center">
                    <Avatar 
                      size="md" 
                      name={customerDisplayName || "Customer"}
                    />
                    <BlockStack gap="050">
                      <Text variant="bodyMd" fontWeight="semibold">
                        {customerDisplayName || "—"}
                      </Text>
                      <Text variant="bodySm" tone="subdued">
                        {customerEmail || "—"}
                      </Text>
                    </BlockStack>
                  </InlineStack>

                  <Divider />

                  <BlockStack gap="100">
                    <Text variant="bodySm" tone="subdued" fontWeight="semibold">
                      DELIVERY ADDRESS
                    </Text>
                    <Text variant="bodyMd">
                      {deliveryAddress}
                    </Text>
                  </BlockStack>
                </BlockStack>
              </Card>

              {/* Customer Feedback Card */}
              <Card>
                <BlockStack gap="400">
                  <Text variant="headingMd" as="h2">Customer Feedback</Text>
                  
                  <Divider />

                  <InlineStack gap="200" blockAlign="center">
                    <Icon source={StarIcon} tone="warning" />
                    <Text variant="bodyMd">
                      {d.order.web_rating || "No rating provided"}
                    </Text>
                  </InlineStack>
                </BlockStack>
              </Card>
            </BlockStack>
          </Layout.Section>
        </Layout>
      </Page>

      {/* Notes Modal */}
      <Modal
        open={notesOpen}
        onClose={() => {
          setNotesOpen(false);
          resetNoteForm();
          resetEditForm();
        }}
        title="Package Notes"
        primaryAction={{
          content: 'Add Note',
          onAction: handleSubmitNote,
          disabled: !noteText.trim() || noteSubmitting,
          loading: noteSubmitting,
        }}
        secondaryActions={[
          {
            content: 'Close',
            onAction: () => {
              setNotesOpen(false);
              resetNoteForm();
              resetEditForm();
            },
          },
        ]}
      >
        <Modal.Section>
          <BlockStack gap="400">
            {/* Existing Notes */}
            {notes.length > 0 ? (
              <BlockStack gap="300">
                {notes.map((n) => (
                  <Box
                    key={n.id}
                    background="bg-surface-secondary"
                    padding="300"
                    borderRadius="200"
                  >
                    {editingNote?.id === n.id ? (
                      <BlockStack gap="200">
                        <TextField
                          value={editText}
                          onChange={(value) => setEditText(value.substring(0, 50))}
                          maxLength={50}
                          autoComplete="off"
                        />
                        <InlineStack gap="200">
                          <Button
                            size="slim"
                            variant="primary"
                            onClick={handleUpdateNote}
                            loading={editSubmitting}
                            disabled={!editText.trim()}
                          >
                            Save
                          </Button>
                          <Button
                            size="slim"
                            onClick={resetEditForm}
                            disabled={editSubmitting}
                          >
                            Cancel
                          </Button>
                        </InlineStack>
                      </BlockStack>
                    ) : (
                      <InlineStack align="space-between" blockAlign="start">
                        <Text variant="bodyMd">{n.note_text}</Text>
                        <InlineStack gap="100">
                          <Button
                            size="slim"
                            icon={EditIcon}
                            onClick={() => openEdit(n)}
                          />
                          <Button
                            size="slim"
                            icon={DeleteIcon}
                            tone="critical"
                            loading={deletingId === n.id}
                            onClick={() => handleDeleteNote(n.id)}
                          />
                        </InlineStack>
                      </InlineStack>
                    )}
                  </Box>
                ))}
              </BlockStack>
            ) : (
              <Box paddingBlock="800">
                <InlineStack align="center">
                  <Text variant="bodyMd" tone="subdued">
                    No notes yet. Add one below.
                  </Text>
                </InlineStack>
              </Box>
            )}

            <Divider />

            {/* Add New Note */}
            <BlockStack gap="200">
              <Text variant="headingSm" as="h3">Add Note</Text>
              <TextField
                value={noteText}
                onChange={(value) => setNoteText(value.substring(0, 50))}
                placeholder="Enter a note (max 50 characters)"
                maxLength={50}
                helpText={`${noteText.length}/50 characters`}
                multiline={3}
                autoComplete="off"
              />
            </BlockStack>
          </BlockStack>
        </Modal.Section>
      </Modal>

      {/* Email History Modal */}
      <OneTrackEmailHistory
        open={emailHistoryOpen}
        onClose={() => setEmailHistoryOpen(false)}
        trackingnumber={d.trackingnumber}
      />

      {/* Send Email Modal */}
      <OneTrackSendEmail
        open={sendEmailOpen}
        onClose={() => setSendEmailOpen(false)}
        trackingnumber={d.trackingnumber}
        customerEmail={customerEmail}
      />

      {/* Toast */}
      {toastActive && (
        <Toast
          content={toastMessage}
          error={toastError}
          onDismiss={() => setToastActive(false)}
          duration={3000}
        />
      )}
    </Frame>
  );
}