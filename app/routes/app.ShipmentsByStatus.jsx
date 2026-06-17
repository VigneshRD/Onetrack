import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import {
  Page, Layout, Card, Text, Box, InlineStack, BlockStack,
  Button, Icon, Badge, Divider, Spinner, Tooltip, TextField,
  Select, Checkbox, Popover, ActionList, Modal, Banner,
  Pagination, ChoiceList, Tag, InlineGrid, Avatar, Toast, Frame,
} from "@shopify/polaris";
import {
  SearchIcon, FilterIcon, SettingsIcon, StarIcon, StarFilledIcon,
  ViewIcon, EmailIcon, ArrowDownIcon, MenuHorizontalIcon, RefreshIcon,
} from "@shopify/polaris-icons";
import {
  format, subDays, addDays, parseISO, isValid,
  subMonths, addMonths, subYears,
} from "date-fns";
import { useNavigate, useLocation, useLoaderData } from "react-router";
import { onetrackService } from "../../src/services/onetrackService";
import { lsFilterService } from "../../src/services/lsFilterService";
import { EVENT_METADATA } from "../../src/config/eventConfig";
import {
  normalizeCarrier, normalizeStatus,
  dedupeCarriersToDisplay, dedupeStatusesToDisplay,
  expandCarrierDisplayNames, expandStatusDisplayNames,
  normalizeCarrierMap,
} from "../../src/config/shipmentNormalizer";
import DateRangeFilter from "../../src/components/DateRangeFilter";
import OneTrackEmailHistory from "./OneTrackEmailHistory";
import OneTrackSendEmail from "./OneTrackSendEmail";
import { authenticate } from "../shopify.server";

export const loader = async ({ request }) => {
  await authenticate.admin(request);
  return {};
};

// ── Constants ─────────────────────────────────────────────────────────────────
const PREF_MAP = {
  priority: "priority",
  order_no: "orderNumber",
  tracking_number: "trackingNumber",
  carrier: "carrier",
  ship_date: "shipDate",
  source: "source",
  dest_city: "dest_city",
  dest_state: "dest_state",
  dest_country: "dest_country",
  delivered: "deliveryDate",
  delivery_delay_days: "deliveryDelayDays",
  estimated: "estimated",
  status: "status",
  action: "actions",
};

const FIELD_TO_PREF = Object.entries(PREF_MAP).reduce((acc, [pref, field]) => {
  acc[field] = pref;
  return acc;
}, {});

const COLUMN_LABELS = {
  priority: "Priority",
  orderNumber: "Order No",
  trackingNumber: "Tracking No",
  carrier: "Carrier",
  shipDate: "Shipped On",
  source: "Source",
  dest_city: "Dest City",
  dest_state: "Dest State",
  dest_country: "Dest Country",
  deliveryDate: "Delivered",
  deliveryDelayDays: "Delay Days",
  estimated: "Estimated",
  status: "Status",
  actions: "Action",
};

const STATUS_BADGE_TONE = {
  delivered: "success", "in-transit": "info", exception: "critical",
  delayed: "warning", returned: "attention", lost: "warning",
  undeliverable: "critical", "just-shipped": "success",
};

const STATUS_BADGE_LABEL = {
  delivered: "Delivered", "in-transit": "In Transit", exception: "Exception",
  delayed: "Delayed", returned: "Returned", lost: "Lost",
  undeliverable: "Undeliverable", "just-shipped": "Just Shipped",
};

const CARRIER_BADGE_TONE = {
  UPS: "attention", FedEx: "info", DHL: "warning", USPS: "info",
  "Royal Mail": "critical", DPD: "critical", VEHO: "success",
};

const MAX_SELECTION = 50;
const FILTER_RANGE_MONTHS = 3;
const LS_AUTO_REFRESH_KEY = "ls_filter_auto_refreshed";

// ── Helper: column export filter functions (CORRECT separate flags) ───────────
// CSV uses iscsv flag, PDF uses ispdf flag — they are intentionally separate
const getCsvColumns = (cols) =>
  cols.filter((c) => c.iscsv !== false && c.isexport !== false).map((c) => c.key);
const getPdfColumns = (cols) =>
  cols.filter((c) => c.ispdf !== false && c.isexport !== false).map((c) => c.key);

// ── Read drilldown state from URL ?drilldown= param ───────────────────────────
function _readDrilldownState() {
  if (typeof window === "undefined") return null;
  const key = new URLSearchParams(window.location.search).get("drilldown");
  if (!key) return null;
  try {
    const raw = sessionStorage.getItem(key);
    if (raw) { sessionStorage.removeItem(key); return JSON.parse(raw); }
  } catch {}
  return null;
}
const _drilldownState = _readDrilldownState();

// ── Helpers ────────────────────────────────────────────────────────────────────
function resolveDateRange(rangeStr) {
  const now = new Date();
  let start = subDays(now, 29);
  let end = now;
  if (rangeStr === "7d") { start = subDays(now, 6); }
  else if (rangeStr === "30d") { start = subDays(now, 29); }
  else {
    try {
      const parsed = JSON.parse(rangeStr);
      if (parsed.start && parsed.end) {
        start = new Date(parsed.start);
        end = new Date(parsed.end);
      }
    } catch (e) {}
  }
  return { start, end };
}

function getInitialDateRange(routerState) {
  const fromState = routerState?.dateRange;
  if (fromState) return fromState;
  if (typeof window !== "undefined") {
    const v = sessionStorage.getItem("onetrack_dateRange");
    sessionStorage.removeItem("onetrack_dateRange");
    if (v) return v;
  }
  return "30d";
}

// Finds first *_map field on a filter def (carrier_map, status_map, country_map, etc.)
function resolveMap(filterDef) {
  for (const [k, v] of Object.entries(filterDef)) {
    if (k.endsWith("_map") && v && typeof v === "object" && !Array.isArray(v)) return v;
  }
  return {};
}

export default function ShipmentsByStatusPage() {
  const navigate = useNavigate();
  const routerLocation = useLocation();
  const loaderData = useLoaderData();

  const breadcrumb = _drilldownState?.breadcrumb || routerLocation.state?.breadcrumb;
  const incomingEventType = _drilldownState?.eventType || loaderData?.eventType || routerLocation.state?.eventType;
  const incomingFilters = _drilldownState?.incomingFilters || routerLocation.state?.incomingFilters;
  const pathname = routerLocation.pathname;

  // ── Resolve eventKey ──────────────────────────────────────────────────────
  let eventKey = "total_packages";
  if (loaderData?.eventType) {
    for (const [key, meta] of Object.entries(EVENT_METADATA)) {
      if (meta.apiStatus === loaderData.eventType) { eventKey = key; break; }
    }
  } else {
    for (const [key, meta] of Object.entries(EVENT_METADATA)) {
      if (meta.href === pathname) { eventKey = key; break; }
    }
  }

  const fallbackInfo = EVENT_METADATA[eventKey] || {
    fallbackLabel: "Tracked Packages",
    description: "View all packages in your tracking system.",
  };

  const [pageInfo, setPageInfo] = useState({
    title: loaderData?.pageTitle || breadcrumb?.label || fallbackInfo.fallbackLabel || "Tracked Packages",
    description: loaderData?.pageDescription || (breadcrumb?.label
      ? `Viewing ${breadcrumb.label} shipments from the Fulfillment Dashboard.`
      : fallbackInfo.description || "View all packages in your tracking system."),
    key: eventKey,
  });

  useEffect(() => {
    if (breadcrumb || loaderData?.pageTitle) return;
    onetrackService.getDashboardInit()
      .then((res) => {
        let events = [];
        if (res?.success && Array.isArray(res.data)) events = res.data;
        else if (Array.isArray(res)) events = res;
        else if (res?.data && Array.isArray(res.data.events)) events = res.data.events;
        const found = events.find((e) => e.key === eventKey);
        if (found) setPageInfo((prev) => ({ ...prev, title: found.label }));
      })
      .catch(console.error);
  }, [eventKey, breadcrumb, loaderData]);

  // ── Date Range ────────────────────────────────────────────────────────────
  const [dateRange, setDateRange] = useState(() => getInitialDateRange(routerLocation.state));
  useEffect(() => { sessionStorage.setItem("onetrack_dateRange", dateRange); }, [dateRange]);

  // ── Filter Options (dynamic from getLsFilter) ─────────────────────────────
  const [filterOptions, setFilterOptions] = useState({ dynamicFilters: [], carrierMap: {} });
  const [filterRefreshedAt, setFilterRefreshedAt] = useState(null);
  const [filterRefreshing, setFilterRefreshing] = useState(false);

  const _parseLsFilter = useCallback((res) => {
    if (!res?.success || !Array.isArray(res.filters)) return;
    const userCarrierRaws = (res.user_carrier || [])
      .map((c) => (typeof c === "string" ? c : c?.trackingtype))
      .filter(Boolean);
    const normalizedFilters = res.filters
      .filter((f) => f.type !== "date")
      .map((f) => {
        if (f.key === "carrier_type") {
          return { ...f, values: dedupeCarriersToDisplay([...(f.values || []), ...userCarrierRaws]) };
        }
        if (f.key === "servicetype") {
          return { ...f, carrier_map: normalizeCarrierMap(f.carrier_map || {}) };
        }
        if (f.key === "shipment_status_type") {
          return { ...f, values: dedupeStatusesToDisplay(f.values || []) };
        }
        return f;
      });
    const serviceFilter = normalizedFilters.find((f) => f.key === "servicetype");
    setFilterOptions({ dynamicFilters: normalizedFilters, carrierMap: serviceFilter?.carrier_map || {} });
    if (res.refreshedAt) setFilterRefreshedAt(res.refreshedAt.slice(0, 10));
    setDraftFilters((prev) => {
      const updated = { ...prev.dynamic };
      normalizedFilters.forEach((f) => {
        if (!(f.front_element_id in updated)) updated[f.front_element_id] = [];
      });
      return { ...prev, dynamic: updated };
    });
  }, []);

  // Auto-refresh once per session if filters empty
  useEffect(() => {
    lsFilterService.getLsFilter()
      .then(async (res) => {
        const filtersEmpty = !res?.success || !Array.isArray(res.filters) || res.filters.length === 0;
        if (filtersEmpty && !sessionStorage.getItem(LS_AUTO_REFRESH_KEY)) {
          sessionStorage.setItem(LS_AUTO_REFRESH_KEY, "1");
          try {
            await lsFilterService.lsFilterRefresh({});
            const refreshed = await lsFilterService.getLsFilter();
            _parseLsFilter(refreshed);
          } catch (e) { console.error("Auto filter refresh failed", e); }
        } else {
          _parseLsFilter(res);
        }
      })
      .catch((e) => console.error("Failed to load filter options", e));
  }, [_parseLsFilter]);

  const handleFilterRefresh = useCallback(async () => {
    setFilterRefreshing(true);
    try {
      await lsFilterService.lsFilterRefresh({ startDate: filterRefreshedAt, endDate: format(new Date(), "yyyy-MM-dd") });
      const res = await lsFilterService.getLsFilter();
      _parseLsFilter(res);
    } catch (e) { console.error("Filter refresh failed", e); }
    finally { setFilterRefreshing(false); }
  }, [filterRefreshedAt, _parseLsFilter]);

  const getFilteredOptions = useCallback((filterDef, currentDynamic) => {
    if (!filterDef.parent_filter) return filterDef.values || [];
    const parentValues = currentDynamic[filterDef.parent_filter] || [];
    if (parentValues.length === 0) return [];
    const map = resolveMap(filterDef);
    const seen = new Set();
    return parentValues.flatMap((v) => map[v] || []).filter((v) => { if (seen.has(v)) return false; seen.add(v); return true; });
  }, []);

  // ── Draft Filters (dynamic structure mirroring MUI) ───────────────────────
  const [draftFilters, setDraftFilters] = useState(() => {
    const dynamic = {};
    const legacyMap = { carrier: "carrier_type", serviceType: "servicetype", customer: "companyname", warehouse: "warehouse", destinationCountry: "to_country", source: "from_city" };
    if (incomingFilters) {
      Object.entries(legacyMap).forEach(([legacy, frontId]) => {
        if (incomingFilters[legacy]?.length > 0) dynamic[frontId] = incomingFilters[legacy];
      });
    }
    return { dynamic, estimatedDateFrom: "", estimatedDateTo: "", deliveryDateFrom: "", deliveryDateTo: "" };
  });

  const [filterOpen, setFilterOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showPriorityOnly, setShowPriorityOnly] = useState(false);

  // ── Table State ───────────────────────────────────────────────────────────
  const [tableState, setTableState] = useState(() => {
    const { start, end } = resolveDateRange(getInitialDateRange(routerLocation.state));
    const initDynamic = {};
    const legacyMap = { carrier: "carrier_type", serviceType: "servicetype", customer: "companyname", warehouse: "warehouse", destinationCountry: "to_country", source: "from_city" };
    if (incomingFilters) {
      Object.entries(legacyMap).forEach(([legacy, frontId]) => {
        if (incomingFilters[legacy]?.length > 0) initDynamic[frontId] = incomingFilters[legacy];
      });
    }
    return {
      eventType: incomingEventType || loaderData?.eventType || EVENT_METADATA[eventKey]?.apiStatus || eventKey,
      startDate: start.toISOString(),
      endDate: end.toISOString(),
      filters: { dynamic: initDynamic, priority: false, estimatedDateFrom: "", estimatedDateTo: "", deliveryDateFrom: "", deliveryDateTo: "" },
      search: "",
      page: 1,
      limit: 15,
      sortModel: [],
    };
  });

  const [rows, setRows] = useState([]);
  const [rowCount, setRowCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [domainVerifyFlag, setDomainVerifyFlag] = useState("");

  // ── Column State ──────────────────────────────────────────────────────────
  const [columnVisibilityModel, setColumnVisibilityModel] = useState({});
  const [columnsLoaded, setColumnsLoaded] = useState(false);
  const [apiColumns, setApiColumns] = useState([]);
  const [columnsPopoverActive, setColumnsPopoverActive] = useState(false);
  const dragIndexRef = useRef(null);

  // ── Selection ─────────────────────────────────────────────────────────────
  const [selectedRows, setSelectedRows] = useState(new Set());
  const [selectedRowsData, setSelectedRowsData] = useState(new Map());
  const [starredRows, setStarredRows] = useState(new Set());
  const [limitBannerActive, setLimitBannerActive] = useState(false);

  // ── Action Menu ───────────────────────────────────────────────────────────
  const [activeMenuId, setActiveMenuId] = useState(null);
  const [menuPopoverActive, setMenuPopoverActive] = useState(false);

  // ── Modals ────────────────────────────────────────────────────────────────
  const [emailHistoryOpen, setEmailHistoryOpen] = useState(false);
  const [emailHistoryTracking, setEmailHistoryTracking] = useState("");
  const [orderDetailsOpen, setOrderDetailsOpen] = useState(false);
  const [orderDetailsData, setOrderDetailsData] = useState(null);
  const [orderDetailsLoading, setOrderDetailsLoading] = useState(false);
  const [orderDetailsError, setOrderDetailsError] = useState("");
  const [sendEmailOpen, setSendEmailOpen] = useState(false);
  const [sendEmailTracking, setSendEmailTracking] = useState("");
  const [sendEmailCustomer, setSendEmailCustomer] = useState("");

  // ── Bulk / Export ─────────────────────────────────────────────────────────
  const [selectedBulkAction, setSelectedBulkAction] = useState("");
  const [isBulkSubmitting, setIsBulkSubmitting] = useState(false);
  const [exportPopoverActive, setExportPopoverActive] = useState(false);
  const [isExporting, setIsExporting] = useState(null);
  const [exportLimitOpen, setExportLimitOpen] = useState(false);

  // ── Toast ─────────────────────────────────────────────────────────────────
  const [toastActive, setToastActive] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastError, setToastError] = useState(false);
  const showToast = (msg, error = false) => { setToastMessage(msg); setToastError(error); setToastActive(true); };

  const isMounted = useRef(false);

  // ── Column Persistence ────────────────────────────────────────────────────
  const persistColumnState = useCallback((cols, visModel) => {
    const columnsPayload = cols.map((col, idx) => ({
      key: col.key,
      label: col.label || COLUMN_LABELS[col.field || PREF_MAP[col.key] || col.key] || col.key,
      position: idx + 1,
      visible: visModel[col.field || PREF_MAP[col.key] || col.key] !== false,
      isDefault: col.isDefault ?? false,
      isSort: col.isSort ?? true,
      isSearch: col.isSearch ?? false,
      iscsv: col.iscsv ?? true,       // ✅ separate CSV flag
      ispdf: col.ispdf ?? true,       // ✅ separate PDF flag
      isexport: col.isexport ?? true,
    }));
    onetrackService.saveColumnPreferences({ module: "onetrack_details_table", columns: columnsPayload });
  }, []);

  // ── Load Column Preferences ───────────────────────────────────────────────
  useEffect(() => {
    onetrackService.getColumnPreferences("tracked-packages")
      .then((res) => {
        if (res.success && Array.isArray(res.data) && res.data.length > 0) {
          const sorted = [...res.data]
            .sort((a, b) => (a.position ?? 999) - (b.position ?? 999))
            .map((col) => ({ ...col, field: PREF_MAP[col.key] || col.key }));
          setApiColumns(sorted);
          const visibilityModel = {};
          sorted.forEach((col) => { visibilityModel[col.field] = col.visible !== false; });
          setColumnVisibilityModel(visibilityModel);
        }
      })
      .finally(() => setColumnsLoaded(true));
  }, []);

  // ── Sync dateRange → tableState ───────────────────────────────────────────
  useEffect(() => {
    if (!isMounted.current) return;
    const { start, end } = resolveDateRange(dateRange);
    setTableState((prev) => ({ ...prev, startDate: start.toISOString(), endDate: end.toISOString(), page: 1 }));
  }, [dateRange]);

  // ── Sync priority toggle ──────────────────────────────────────────────────
  useEffect(() => {
    setTableState((prev) => ({ ...prev, page: 1, filters: { ...prev.filters, priority: showPriorityOnly } }));
  }, [showPriorityOnly]);

  useEffect(() => { isMounted.current = true; }, []);

  // ── Fetch Data ────────────────────────────────────────────────────────────
  const fetchShipmentRecords = useCallback(async () => {
    if (!columnsLoaded) return;
    setIsLoading(true);
    try {
      const mappedColumns = Object.keys(columnVisibilityModel).map((field) => FIELD_TO_PREF[field] || field);
      const response = await onetrackService.getTrackedPackages({
        ...tableState,
        activeColumns: mappedColumns.length > 0 ? mappedColumns : null,
      });
      if (response?.success) {
        setRows(response.data);
        setRowCount(response.total);
        setDomainVerifyFlag(response.domainVerifyFlag || "");
      }
    } catch (error) {
      console.error("Failed to fetch shipments:", error);
      showToast("Failed to load shipment data.", true);
    } finally {
      setIsLoading(false);
    }
  }, [tableState, columnVisibilityModel, columnsLoaded]);

  useEffect(() => { fetchShipmentRecords(); }, [fetchShipmentRecords]);

  // Seed starred rows from server
  useEffect(() => {
    setStarredRows(new Set(
      rows.filter((r) => r.priority || r.isStarred)
        .map((r) => r.trackingNumber || r.tracking_number).filter(Boolean)
    ));
  }, [rows]);

  const handleTogglePriority = useCallback(async (trackingNumber) => {
    const next = new Set(starredRows);
    const newPriority = !next.has(trackingNumber);
    if (newPriority) next.add(trackingNumber); else next.delete(trackingNumber);
    setStarredRows(next);
    await onetrackService.setPriorityShipment({ trackingNumber, priority: newPriority });
  }, [starredRows]);

  // ── Row Selection ─────────────────────────────────────────────────────────
  const paginatedIds = rows.map((r) => r.id || r.trackingNumber || r.orderNumber);
  const allOnPageSelected = paginatedIds.length > 0 && paginatedIds.every((id) => selectedRows.has(id));
  const someOnPageSelected = paginatedIds.some((id) => selectedRows.has(id)) && !allOnPageSelected;

  const handleSelectAll = (checked) => {
    if (checked) {
      const newIds = paginatedIds.filter((id) => !selectedRows.has(id));
      if (selectedRows.size + newIds.length > MAX_SELECTION) setLimitBannerActive(true);
      const idsToAdd = newIds.slice(0, MAX_SELECTION - selectedRows.size);
      setSelectedRows((prev) => { const next = new Set(prev); idsToAdd.forEach((id) => next.add(id)); return next; });
      setSelectedRowsData((prev) => {
        const next = new Map(prev);
        rows.forEach((r) => { const id = r.id || r.trackingNumber || r.orderNumber; if (idsToAdd.includes(id)) next.set(id, r); });
        return next;
      });
    } else {
      setSelectedRows((prev) => { const next = new Set(prev); paginatedIds.forEach((id) => next.delete(id)); return next; });
      setSelectedRowsData((prev) => { const next = new Map(prev); paginatedIds.forEach((id) => next.delete(id)); return next; });
    }
  };

  const handleSelectRow = (id) => {
    const isSelected = selectedRows.has(id);
    if (!isSelected && selectedRows.size >= MAX_SELECTION) { setLimitBannerActive(true); return; }
    setSelectedRows((prev) => { const next = new Set(prev); if (next.has(id)) next.delete(id); else next.add(id); return next; });
    setSelectedRowsData((prev) => {
      const next = new Map(prev);
      if (next.has(id)) { next.delete(id); }
      else { const row = rows.find((r) => (r.id || r.trackingNumber || r.orderNumber) === id); if (row) next.set(id, row); }
      return next;
    });
  };

  // ── Row Action Handlers ───────────────────────────────────────────────────
  const getActiveRow = () => rows.find((r) => (r.id || r.trackingNumber || r.orderNumber) === activeMenuId);

  const handleOpenEmailHistory = () => {
    const row = getActiveRow();
    setEmailHistoryTracking(row ? (row.trackingNumber || row.tracking_number) : activeMenuId);
    setEmailHistoryOpen(true);
    setMenuPopoverActive(false);
  };

  const handleOpenOrderDetails = async () => {
    const row = getActiveRow();
    if (!row) return;
    setOrderDetailsOpen(true);
    setOrderDetailsLoading(true);
    setOrderDetailsError("");
    setOrderDetailsData(null);
    setMenuPopoverActive(false);
    try {
      const res = await onetrackService.getShopifyViewDetails({
        trackingnumber: row.trackingNumber || row.tracking_number,
        shopifydocid: row.shopifydocument_id,
      });
      if (res.success || res.data || res.message === "S" || res.type === "1" || res.shopifyorderno) {
        setOrderDetailsData(res.data || res);
      } else {
        setOrderDetailsError(res.message || "Failed to fetch order details.");
      }
    } catch (err) {
      setOrderDetailsError(err.message || "Cannot fetch order details at this time.");
    } finally {
      setOrderDetailsLoading(false);
    }
  };

  const handleOpenSendEmail = () => {
    const row = getActiveRow();
    if (!row) return;
    setSendEmailTracking(row.trackingNumber || row.tracking_number);
    setSendEmailCustomer(row.customer_shopemail || row.customerEmail || "customer@example.com");
    setSendEmailOpen(true);
    setMenuPopoverActive(false);
  };

  const handleInterceptSingle = async () => {
    const row = getActiveRow();
    if (!row) return;
    setMenuPopoverActive(false);
    try {
      const res = await onetrackService.interceptShipment({
        trackingnumber: row.trackingNumber || row.tracking_number,
        orderno: row.orderNumber || row.order_no,
        multipleShipmentsFlag: "S",
      });
      showToast(res.success ? (res.message || "Intercept processed successfully") : (res.message || "Failed to process intercept"), !res.success);
    } catch { showToast("An error occurred while intercepting shipment", true); }
  };

  const handleIgnoreIntercept = async () => {
    const row = getActiveRow();
    if (!row) return;
    setMenuPopoverActive(false);
    try {
      const res = await onetrackService.ignoreintercept({
        trackingnumber: row.trackingNumber || row.tracking_number,
        orderno: row.orderNumber || row.order_no,
      });
      showToast(res.success ? (res.message || "Intercept removed successfully") : (res.message || "Failed to remove intercept"), !res.success);
    } catch { showToast("An error occurred", true); }
  };

  // ── Sort ──────────────────────────────────────────────────────────────────
  const handleSort = (field) => {
    setTableState((prev) => {
      const current = prev.sortModel[0];
      let nextSort;
      if (!current || current.field !== field) nextSort = [{ field, sort: "asc" }];
      else if (current.sort === "asc") nextSort = [{ field, sort: "desc" }];
      else nextSort = [];
      return { ...prev, sortModel: nextSort, page: 1 };
    });
  };

  // ── Filters ───────────────────────────────────────────────────────────────
  const hasActiveFilters =
    Object.values(draftFilters.dynamic).some((v) => Array.isArray(v) && v.length > 0) ||
    !!draftFilters.estimatedDateFrom || !!draftFilters.estimatedDateTo ||
    !!draftFilters.deliveryDateFrom || !!draftFilters.deliveryDateTo;

  const applyFilters = () => {
    setFilterOpen(false);
    const expandedDynamic = { ...draftFilters.dynamic };
    if (expandedDynamic.carrier_type) expandedDynamic.carrier_type = expandCarrierDisplayNames(expandedDynamic.carrier_type);
    if (expandedDynamic.shipment_status_type) expandedDynamic.shipment_status_type = expandStatusDisplayNames(expandedDynamic.shipment_status_type);
    setTableState((prev) => ({
      ...prev, page: 1,
      filters: { ...prev.filters, dynamic: expandedDynamic, estimatedDateFrom: draftFilters.estimatedDateFrom, estimatedDateTo: draftFilters.estimatedDateTo, deliveryDateFrom: draftFilters.deliveryDateFrom, deliveryDateTo: draftFilters.deliveryDateTo },
    }));
  };

  const resetFilters = () => {
    setDraftFilters({ dynamic: {}, estimatedDateFrom: "", estimatedDateTo: "", deliveryDateFrom: "", deliveryDateTo: "" });
    setSearchQuery("");
    setTableState((prev) => ({ ...prev, search: "", page: 1, filters: { ...prev.filters, dynamic: {}, estimatedDateFrom: "", estimatedDateTo: "", deliveryDateFrom: "", deliveryDateTo: "" } }));
    setFilterOpen(false);
  };

  // ── Date validation ───────────────────────────────────────────────────────
  const _today = new Date();
  const _todayStr = format(_today, "yyyy-MM-dd");
  const _maxDateStr = format(addDays(_today, 10), "yyyy-MM-dd");
  const _minDateStr = format(subYears(_today, 1), "yyyy-MM-dd");

  function computeBounds(fromDate, toDate) {
    let fromMin = _minDateStr, fromMax = _maxDateStr, toMin = _minDateStr, toMax = _maxDateStr, errorMsg = "";
    if (toDate) {
      const toObj = parseISO(toDate);
      if (isValid(toObj)) {
        fromMax = toDate < _maxDateStr ? toDate : _maxDateStr;
        const minP = format(subMonths(toObj, FILTER_RANGE_MONTHS), "yyyy-MM-dd");
        fromMin = minP > _minDateStr ? minP : _minDateStr;
      }
    }
    if (fromDate) {
      const fromObj = parseISO(fromDate);
      if (isValid(fromObj)) {
        toMin = fromDate > _minDateStr ? fromDate : _minDateStr;
        const maxP = format(addMonths(fromObj, FILTER_RANGE_MONTHS), "yyyy-MM-dd");
        toMax = maxP < _maxDateStr ? maxP : _maxDateStr;
      }
    }
    if (fromDate && toDate) {
      const fromObj = parseISO(fromDate), toObj = parseISO(toDate);
      if (isValid(fromObj) && isValid(toObj)) {
        if (fromObj > toObj) errorMsg = "From date cannot be later than To date";
        else if (toObj > addMonths(fromObj, FILTER_RANGE_MONTHS)) errorMsg = `Interval must not exceed ${FILTER_RANGE_MONTHS} months`;
        else if (toObj > parseISO(_maxDateStr)) errorMsg = "To date cannot be more than 10 days in the future";
        else if (fromObj < subYears(parseISO(_todayStr), 1)) errorMsg = "From date cannot be older than 1 year";
      }
    }
    return { fromMin, fromMax, toMin, toMax, errorMsg };
  }

  const estimatedBounds = computeBounds(draftFilters.estimatedDateFrom, draftFilters.estimatedDateTo);
  const deliveryBounds = computeBounds(draftFilters.deliveryDateFrom, draftFilters.deliveryDateTo);
  const hasDateError = !!estimatedBounds.errorMsg || !!deliveryBounds.errorMsg;

  // ── Visible Columns ───────────────────────────────────────────────────────
  const visibleColumns = useMemo(() => {
    return apiColumns.filter((col) => {
      const field = col.field || PREF_MAP[col.key] || col.key;
      return columnVisibilityModel[field] !== false;
    });
  }, [apiColumns, columnVisibilityModel]);

  // ── Pagination ────────────────────────────────────────────────────────────
  const totalPages = Math.ceil(rowCount / tableState.limit);
  const showingFrom = rowCount === 0 ? 0 : (tableState.page - 1) * tableState.limit + 1;
  const showingTo = Math.min(rowCount, tableState.page * tableState.limit);

  // ── Render Cell ───────────────────────────────────────────────────────────
  const renderCell = (col, row) => {
    const field = col.field || PREF_MAP[col.key] || col.key;
    const value = row[field];

    if (field === "priority") {
      const trackingNum = row.trackingNumber || row.tracking_number;
      const isStarred = starredRows.has(trackingNum);
      return <Button variant="plain" icon={isStarred ? StarFilledIcon : StarIcon} onClick={() => handleTogglePriority(trackingNum)} tone={isStarred ? "caution" : undefined} />;
    }

    if (field === "trackingNumber") {
      return (
        <Button variant="plain" onClick={() => navigate(`/app/tracking/${encodeURIComponent(value)}`, { state: { fromPath: routerLocation.pathname, fromLabel: pageInfo.title, fromStatus: pageInfo.key, breadcrumb: breadcrumb || null } })}>
          <Text variant="bodySm" fontFamily="mono">{value}</Text>
        </Button>
      );
    }

    if (field === "carrier") {
      const displayName = normalizeCarrier(value);
      return <Badge tone={CARRIER_BADGE_TONE[displayName] || "subdued"}>{displayName || "—"}</Badge>;
    }

    if (field === "deliveryDate") {
      return value
        ? <Text variant="bodySm" tone="success" fontWeight="medium">{value}</Text>
        : <Text variant="bodySm" tone="subdued">—</Text>;
    }

    if (field === "status") {
      const displayStatus = normalizeStatus(value);
      const chipKey = displayStatus?.toLowerCase().replace(/\s+/g, "-");
      const tone = STATUS_BADGE_TONE[chipKey];
      const label = STATUS_BADGE_LABEL[chipKey];
      if (tone && label) return <Badge tone={tone}>{label}</Badge>;
      const MAX_CHARS = 40;
      const isLong = displayStatus && displayStatus.length > MAX_CHARS;
      const truncated = isLong ? displayStatus.slice(0, MAX_CHARS) + "…" : (displayStatus || "—");
      return <Tooltip content={isLong ? displayStatus : ""}><Text variant="bodySm">{truncated}</Text></Tooltip>;
    }

    if (field === "actions") {
      const rowId = row.id || row.trackingNumber || row.orderNumber;
      const actionItems = [
        { content: "View order details", icon: ViewIcon, onAction: handleOpenOrderDetails },
        { content: "Email history", icon: EmailIcon, onAction: handleOpenEmailHistory },
        { content: "Send Email", icon: EmailIcon, onAction: handleOpenSendEmail, disabled: domainVerifyFlag !== "Y", helpText: domainVerifyFlag !== "Y" ? "Domain verification pending" : undefined },
        ...(pageInfo.key === "delayed_in_transit_over_60h" ? [
          { content: "Intercept Shipment", onAction: handleInterceptSingle },
          { content: "Remove Intercept", onAction: handleIgnoreIntercept },
        ] : []),
      ];
      return (
        <Popover
          active={menuPopoverActive && activeMenuId === rowId}
          activator={<Button variant="plain" icon={MenuHorizontalIcon} onClick={() => { setActiveMenuId(rowId); setMenuPopoverActive((prev) => !(prev && activeMenuId === rowId)); }} />}
          onClose={() => setMenuPopoverActive(false)}
        >
          <ActionList items={actionItems} />
        </Popover>
      );
    }

    return <Text variant="bodySm">{value ?? "—"}</Text>;
  };

  // ── Bulk Submit ───────────────────────────────────────────────────────────
  const handleBulkSubmit = async () => {
    if (!selectedBulkAction) return;
    setIsBulkSubmitting(true);
    try {
      const selectedTrackingNumbers = Array.from(selectedRowsData.values()).map((r) => r.trackingNumber || r.tracking_number).filter(Boolean);
      if (selectedBulkAction === "assign_priority" || selectedBulkAction === "remove_priority") {
        const isPriority = selectedBulkAction === "assign_priority";
        const result = await onetrackService.bulkPriorityShipment(selectedTrackingNumbers.map((trackingNumber) => ({ trackingNumber, priority: isPriority })));
        if (result.success) {
          setStarredRows((prev) => { const next = new Set(prev); selectedTrackingNumbers.forEach((tn) => { if (isPriority) next.add(tn); else next.delete(tn); }); return next; });
          showToast(`${selectedRows.size} shipment(s) updated.`);
        } else showToast("Could not update priority.", true);
      } else if (selectedBulkAction === "intercept") {
        const selectedData = Array.from(selectedRowsData.values());
        const res = await onetrackService.interceptShipment({
          trackingnumber: selectedData.map((r) => r.trackingNumber || r.tracking_number).filter(Boolean),
          orderno: selectedData.map((r) => r.orderNumber || r.order_no).filter(Boolean),
          multipleShipmentsFlag: selectedData.length > 1 ? "Y" : "S",
        });
        showToast(res.success ? (res.message || "Intercept processed successfully.") : (res.message || "Could not process intercept."), !res.success);
        if (res.success) { setSelectedRows(new Set()); setSelectedRowsData(new Map()); setSelectedBulkAction(""); }
      } else {
        const result = await onetrackService.selectedShipmentAction({ action: selectedBulkAction, trackingNumbers: selectedTrackingNumbers });
        showToast(result.success ? `Action applied to ${selectedRows.size} shipment(s).` : "Could not apply action.", !result.success);
      }
    } finally {
      setIsBulkSubmitting(false);
      setSelectedBulkAction("");
      setSelectedRows(new Set());
      setSelectedRowsData(new Map());
    }
  };

  // ── Export ────────────────────────────────────────────────────────────────
  // ✅ CSV uses iscsv flag, PDF uses ispdf flag — they are SEPARATE
  const handleExportCsv = async () => {
    setExportPopoverActive(false);
    if (rowCount === 0) { showToast("No records available to export."); return; }
    if (rowCount >= 10000) { setExportLimitOpen(true); return; }
    const csvColumns = getCsvColumns(apiColumns); // ✅ iscsv !== false && isexport !== false
    setIsExporting("csv");
    showToast("Generating your CSV file…");
    const result = await onetrackService.exportShipmentsCsv({ columns: csvColumns, module: "onetrack_details_table", eventType: tableState.eventType, startDate: tableState.startDate, endDate: tableState.endDate, search: tableState.search, filters: tableState.filters, sortModel: tableState.sortModel });
    setIsExporting(null);
    if (!result.success) showToast("Could not generate CSV. Please try again.", true);
  };

  const handleExportPdf = async () => {
    setExportPopoverActive(false);
    if (rowCount === 0) { showToast("No records available to export."); return; }
    if (rowCount >= 10000) { setExportLimitOpen(true); return; }
    const pdfColumns = getPdfColumns(apiColumns); // ✅ ispdf !== false && isexport !== false
    setIsExporting("pdf");
    showToast("Generating your PDF file…");
    const result = await onetrackService.exportShipmentsPdf({ columns: pdfColumns, module: "onetrack_details_table", eventType: tableState.eventType, startDate: tableState.startDate, endDate: tableState.endDate, search: tableState.search, filters: tableState.filters, sortModel: tableState.sortModel });
    setIsExporting(null);
    if (!result.success) showToast("Could not generate PDF. Please try again.", true);
  };

  const bulkActionOptions = [
    { content: "Assign Priority", value: "assign_priority" },
    { content: "Remove Priority", value: "remove_priority" },
    ...(pageInfo.key === "delayed_in_transit_over_60h" ? [{ content: "Intercept", value: "intercept" }, { content: "Remove Intercept", value: "remove_intercept" }] : []),
    { content: "Mark as Delivered", value: "mark_delivered" },
    { content: "Flag as Exception", value: "flag_exception" },
  ];

  const orderDetailsEmptyVal = (v) => (v && String(v).trim()) ? v : "—";

  // ── Column Manager Popover ─────────────────────────────────────────────────
  const renderColumnManager = () => (
    <Popover
      active={columnsPopoverActive}
      activator={<Button icon={SettingsIcon} onClick={() => setColumnsPopoverActive((v) => !v)}>Columns</Button>}
      onClose={() => setColumnsPopoverActive(false)}
    >
      <Box padding="400" minWidth="400px">
        <BlockStack gap="300">
          <BlockStack gap="100">
            <Text variant="headingSm" as="h3" fontWeight="bold">SHOW / HIDE & DRAG TO REORDER</Text>
            <Text variant="bodySm" tone="subdued">Double-click a name to rename</Text>
          </BlockStack>
          <Divider />
          {/* Header row */}
          <div style={{ display: "grid", gridTemplateColumns: "20px 32px 1fr 36px 36px 36px", gap: "6px", alignItems: "center", padding: "0 4px" }}>
            <div />
            <Text variant="bodySm" tone="subdued" fontWeight="semibold">Vis</Text>
            <Text variant="bodySm" tone="subdued" fontWeight="semibold">Column</Text>
            <Tooltip content="Toggle CSV export">
              <div style={{ width: 28, height: 20, background: "#16a34a", borderRadius: 3, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <span style={{ color: "white", fontSize: 8, fontWeight: 800 }}>CSV</span>
              </div>
            </Tooltip>
            <Tooltip content="Toggle PDF export">
              <div style={{ width: 28, height: 20, background: "#dc2626", borderRadius: 3, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <span style={{ color: "white", fontSize: 8, fontWeight: 800 }}>PDF</span>
              </div>
            </Tooltip>
            <Tooltip content="Toggle column filter">
              <div style={{ width: 28, height: 20, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <span style={{ color: "#2563eb", fontSize: 16, lineHeight: 1 }}>≡</span>
              </div>
            </Tooltip>
          </div>
          <Divider />
          <div style={{ maxHeight: "380px", overflowY: "auto" }}>
            {apiColumns.map((col, index) => {
              const field = col.field || PREF_MAP[col.key] || col.key;
              const isVisible = columnVisibilityModel[field] !== false;
              // ✅ CSV button reads/writes iscsv — separate from ispdf
              const isCsvExport = col.iscsv !== false;
              // ✅ PDF button reads/writes ispdf — separate from iscsv
              const isPdfExport = col.ispdf !== false;
              const isFilterable = col.isSearch !== false;
              return (
                <div
                  key={field}
                  draggable
                  onDragStart={() => { dragIndexRef.current = index; }}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={() => {
                    const from = dragIndexRef.current;
                    const to = index;
                    if (from === null || from === to) return;
                    const reordered = [...apiColumns];
                    const [moved] = reordered.splice(from, 1);
                    reordered.splice(to, 0, moved);
                    setApiColumns(reordered);
                    persistColumnState(reordered, columnVisibilityModel);
                    dragIndexRef.current = null;
                  }}
                  onDragEnd={() => { dragIndexRef.current = null; }}
                  style={{ display: "grid", gridTemplateColumns: "20px 32px 1fr 36px 36px 36px", gap: "6px", alignItems: "center", padding: "7px 4px", borderRadius: "6px", cursor: "grab", opacity: isVisible ? 1 : 0.55 }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = "#f3f4f6"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
                >
                  <span style={{ color: "#9ca3af", fontSize: 13, userSelect: "none", textAlign: "center" }}>⠿</span>
                  <Checkbox label="" labelHidden checked={isVisible} disabled={col.isDefault}
                    onChange={() => {
                      if (col.isDefault) return;
                      const newModel = { ...columnVisibilityModel, [field]: !isVisible };
                      setColumnVisibilityModel(newModel);
                      persistColumnState(apiColumns, newModel);
                    }}
                  />
                  <span
                    suppressContentEditableWarning
                    style={{ fontSize: "13px", color: isVisible ? "#202223" : "#8c9196", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", outline: "none", borderRadius: "3px", padding: "1px 3px" }}
                    onDoubleClick={(e) => { e.currentTarget.contentEditable = "true"; e.currentTarget.focus(); e.currentTarget.style.background = "#fff"; e.currentTarget.style.border = "1px solid #2563eb"; }}
                    onBlur={(e) => {
                      e.currentTarget.contentEditable = "false";
                      e.currentTarget.style.background = "transparent";
                      e.currentTarget.style.border = "none";
                      const newLabel = e.currentTarget.textContent.trim();
                      if (newLabel && newLabel !== (col.label || COLUMN_LABELS[field] || field)) {
                        const updated = apiColumns.map((c) => (c.field || PREF_MAP[c.key] || c.key) === field ? { ...c, label: newLabel } : c);
                        setApiColumns(updated);
                        persistColumnState(updated, columnVisibilityModel);
                      }
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") { e.preventDefault(); e.currentTarget.blur(); }
                      if (e.key === "Escape") { e.currentTarget.textContent = col.label || COLUMN_LABELS[field] || field; e.currentTarget.blur(); }
                    }}
                  >
                    {col.label || COLUMN_LABELS[field] || field}
                  </span>

                  {/* ✅ CSV toggle — reads/writes iscsv */}
                  <Tooltip content={isCsvExport ? "Exclude from CSV" : "Include in CSV"}>
                    <button
                      onClick={() => {
                        const updated = apiColumns.map((c) => (c.field || PREF_MAP[c.key] || c.key) === field ? { ...c, iscsv: !isCsvExport } : c);
                        setApiColumns(updated);
                        persistColumnState(updated, columnVisibilityModel);
                      }}
                      style={{ width: 28, height: 20, borderRadius: 3, border: "none", cursor: "pointer", background: isCsvExport ? "#16a34a" : "#e5e7eb", display: "flex", alignItems: "center", justifyContent: "center", padding: 0 }}
                    >
                      <span style={{ color: isCsvExport ? "white" : "#9ca3af", fontSize: 8, fontWeight: 800 }}>CSV</span>
                    </button>
                  </Tooltip>

                  {/* ✅ PDF toggle — reads/writes ispdf */}
                  <Tooltip content={isPdfExport ? "Exclude from PDF" : "Include in PDF"}>
                    <button
                      onClick={() => {
                        const updated = apiColumns.map((c) => (c.field || PREF_MAP[c.key] || c.key) === field ? { ...c, ispdf: !isPdfExport } : c);
                        setApiColumns(updated);
                        persistColumnState(updated, columnVisibilityModel);
                      }}
                      style={{ width: 28, height: 20, borderRadius: 3, border: "none", cursor: "pointer", background: isPdfExport ? "#dc2626" : "#e5e7eb", display: "flex", alignItems: "center", justifyContent: "center", padding: 0 }}
                    >
                      <span style={{ color: isPdfExport ? "white" : "#9ca3af", fontSize: 8, fontWeight: 800 }}>PDF</span>
                    </button>
                  </Tooltip>

                  {/* Filter/Sort toggle — reads/writes isSearch */}
                  <Tooltip content={isFilterable ? "Disable filter" : "Enable filter"}>
                    <button
                      onClick={() => {
                        const updated = apiColumns.map((c) => (c.field || PREF_MAP[c.key] || c.key) === field ? { ...c, isSearch: !isFilterable } : c);
                        setApiColumns(updated);
                        persistColumnState(updated, columnVisibilityModel);
                      }}
                      style={{ width: 28, height: 20, borderRadius: 3, border: "none", cursor: "pointer", background: "transparent", display: "flex", alignItems: "center", justifyContent: "center", padding: 0 }}
                    >
                      <span style={{ color: isFilterable ? "#2563eb" : "#d1d5db", fontSize: 16, lineHeight: 1 }}>≡</span>
                    </button>
                  </Tooltip>
                </div>
              );
            })}
          </div>
          <Divider />
          <Button variant="plain" tone="critical" onClick={() => {
            // Reset: keep original iscsv/ispdf from API, reset isSearch only
            const reset = apiColumns.map((c) => ({ ...c, isSearch: false }));
            const resetModel = {};
            reset.forEach((c) => { const f = c.field || PREF_MAP[c.key] || c.key; resetModel[f] = c.isDefault ?? true; });
            setApiColumns(reset);
            setColumnVisibilityModel(resetModel);
            persistColumnState(reset, resetModel);
          }}>
            Reset to default
          </Button>
        </BlockStack>
      </Box>
    </Popover>
  );

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <Frame>
      <Page
        title={pageInfo.title}
        subtitle={pageInfo.description}
        backAction={{ content: "Back", onAction: () => navigate(-1) }}
        primaryAction={<DateRangeFilter value={dateRange} onChange={setDateRange} range={6} preYear={2} />}
      >
        <Layout>
          <Layout.Section>
            <BlockStack gap="400">

              {limitBannerActive && (
                <Banner title={`Selection limit reached — max ${MAX_SELECTION} packages at a time.`} tone="warning" onDismiss={() => setLimitBannerActive(false)} />
              )}

              {/* Search + Controls */}
              <Card>
                <InlineStack gap="300" blockAlign="center" wrap={false}>
                  <Box minWidth="0" style={{ flex: 1 }}>
                    <TextField
                      value={searchQuery}
                      onChange={setSearchQuery}
                      placeholder="Search by tracking number or order..."
                      prefix={<Icon source={SearchIcon} />}
                      onKeyPress={(e) => { if (e.key === "Enter") setTableState((prev) => ({ ...prev, search: searchQuery, page: 1 })); }}
                      autoComplete="off"
                      clearButton
                      onClearButtonClick={() => { setSearchQuery(""); setTableState((prev) => ({ ...prev, search: "", page: 1 })); }}
                    />
                  </Box>

                  {renderColumnManager()}

                  <InlineStack gap="200" blockAlign="center">
                    <Checkbox
                      label={<InlineStack gap="100" blockAlign="center"><Icon source={StarFilledIcon} tone="caution" /><Text variant="bodySm">Priority only</Text></InlineStack>}
                      checked={showPriorityOnly}
                      onChange={setShowPriorityOnly}
                    />
                  </InlineStack>

                  <Button icon={FilterIcon} onClick={() => setFilterOpen(true)} tone={hasActiveFilters ? "success" : undefined} variant={hasActiveFilters ? "primary" : "secondary"}>
                    {hasActiveFilters ? "Filtered" : "Advanced Filter"}
                  </Button>

                  {/* ✅ Export menu shows correct column counts for CSV (iscsv) and PDF (ispdf) */}
                  <Popover
                    active={exportPopoverActive}
                    activator={
                      <Button icon={isExporting ? undefined : ArrowDownIcon} loading={!!isExporting} onClick={() => setExportPopoverActive((v) => !v)} disabled={!!isExporting}>
                        {isExporting ? "Exporting…" : "Export"}
                      </Button>
                    }
                    onClose={() => setExportPopoverActive(false)}
                  >
                    <ActionList items={[
                      { content: `Export CSV (${getCsvColumns(apiColumns).length} cols)`, onAction: handleExportCsv },
                      { content: `Export PDF (${getPdfColumns(apiColumns).length} cols)`, onAction: handleExportPdf },
                    ]} />
                  </Popover>
                </InlineStack>
              </Card>

              {/* Bulk Actions Bar */}
              {selectedRows.size > 0 && (
                <Card>
                  <InlineStack gap="300" blockAlign="center" align="space-between" wrap>
                    <Text variant="bodySm" fontWeight="semibold">{selectedRows.size} package{selectedRows.size > 1 ? "s" : ""} selected</Text>
                    <InlineStack gap="200" blockAlign="center" wrap>
                      <div style={{ minWidth: 200 }}>
                        <Select label="" labelHidden options={[{ label: "Select action…", value: "" }, ...bulkActionOptions.map((a) => ({ label: a.content, value: a.value }))]} value={selectedBulkAction} onChange={setSelectedBulkAction} />
                      </div>
                      <Button variant="primary" disabled={!selectedBulkAction || isBulkSubmitting} loading={isBulkSubmitting} onClick={handleBulkSubmit}>
                        {isBulkSubmitting ? "Submitting…" : "Submit"}
                      </Button>
                      <Button variant="plain" tone="critical" onClick={() => { setSelectedRows(new Set()); setSelectedRowsData(new Map()); setSelectedBulkAction(""); }}>Clear</Button>
                    </InlineStack>
                  </InlineStack>
                </Card>
              )}

              {/* Table */}
              <Card padding="0">
                {isLoading || !columnsLoaded ? (
                  <Box padding="800"><InlineStack align="center"><Spinner size="large" /></InlineStack></Box>
                ) : (
                  <div style={{ overflowX: "auto" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "max-content" }}>
                      <thead>
                        <tr style={{ backgroundColor: "#f9fafb", borderBottom: "1px solid #e1e3e5" }}>
                          <th style={{ padding: "12px 16px", width: 40 }}>
                            <Checkbox label="" labelHidden checked={allOnPageSelected} indeterminate={someOnPageSelected} onChange={(checked) => handleSelectAll(checked)} />
                          </th>
                          {visibleColumns.map((col) => {
                            const field = col.field || PREF_MAP[col.key] || col.key;
                            const isActive = tableState.sortModel[0]?.field === field;
                            const sortDir = tableState.sortModel[0]?.sort;
                            const sortable = col.isSort !== false;
                            return (
                              <th key={field} onClick={sortable ? () => handleSort(field) : undefined}
                                style={{ padding: "12px 16px", textAlign: "left", fontWeight: 600, fontSize: "0.75rem", color: "#202223", whiteSpace: "nowrap", cursor: sortable ? "pointer" : "default", userSelect: "none", borderBottom: "1px solid #e1e3e5" }}
                              >
                                <InlineStack gap="100" blockAlign="center" wrap={false}>
                                  {col.label || COLUMN_LABELS[field] || field}
                                  {sortable && <span style={{ opacity: isActive ? 1 : 0.3, fontSize: "10px" }}>{isActive ? (sortDir === "asc" ? " ↑" : " ↓") : " ↕"}</span>}
                                </InlineStack>
                              </th>
                            );
                          })}
                        </tr>
                      </thead>
                      <tbody>
                        {visibleColumns.length === 0 ? (
                          <tr>
                            <td colSpan={1} style={{ padding: "64px 16px", textAlign: "center" }}>
                              <BlockStack gap="300" inlineAlign="center">
                                <Text variant="headingLg" as="p">🗂️</Text>
                                <Text variant="headingMd" as="p">No columns visible</Text>
                                <Text variant="bodySm" tone="subdued" as="p">All table columns are currently hidden. Enable at least one column to view your shipments.</Text>
                                <Button icon={SettingsIcon} onClick={() => setColumnsPopoverActive(true)}>Manage Columns</Button>
                              </BlockStack>
                            </td>
                          </tr>
                        ) : rows.length === 0 ? (
                          <tr>
                            <td colSpan={visibleColumns.length + 1} style={{ padding: "48px 16px", textAlign: "center" }}>
                              <Text variant="bodyMd" tone="subdued">No shipments found.</Text>
                            </td>
                          </tr>
                        ) : (
                          rows.map((row, rowIdx) => {
                            const rowId = row.id || row.trackingNumber || row.orderNumber;
                            const isSelected = selectedRows.has(rowId);
                            return (
                              <tr key={rowId}
                                style={{ backgroundColor: isSelected ? "#f1f8ff" : rowIdx % 2 === 0 ? "#ffffff" : "#f9fafb", borderBottom: "1px solid #e1e3e5", transition: "background-color 0.1s" }}
                                onMouseEnter={(e) => { if (!isSelected) e.currentTarget.style.backgroundColor = "#f6f6f7"; }}
                                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = isSelected ? "#f1f8ff" : rowIdx % 2 === 0 ? "#ffffff" : "#f9fafb"; }}
                              >
                                <td style={{ padding: "10px 16px" }}>
                                  <Checkbox label="" labelHidden checked={isSelected} onChange={() => handleSelectRow(rowId)} />
                                </td>
                                {visibleColumns.map((col) => {
                                  const field = col.field || PREF_MAP[col.key] || col.key;
                                  return <td key={field} style={{ padding: "10px 16px", verticalAlign: "middle" }}>{renderCell(col, row)}</td>;
                                })}
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Pagination */}
                <Box padding="300" borderBlockStartWidth="025" borderColor="border" background="bg-surface-secondary">
                  <InlineStack align="space-between" blockAlign="center">
                    <Text variant="bodySm" tone="subdued">
                      {rowCount === 0 ? "No results" : `Showing ${showingFrom}–${showingTo} of ${rowCount}`}
                    </Text>
                    {totalPages > 1 && (
                      <Pagination
                        hasPrevious={tableState.page > 1}
                        hasNext={tableState.page < totalPages}
                        onPrevious={() => setTableState((prev) => ({ ...prev, page: prev.page - 1 }))}
                        onNext={() => setTableState((prev) => ({ ...prev, page: prev.page + 1 }))}
                        label={`Page ${tableState.page} of ${totalPages}`}
                      />
                    )}
                  </InlineStack>
                </Box>
              </Card>
            </BlockStack>
          </Layout.Section>
        </Layout>
      </Page>

      {/* ── Advanced Filter Modal ─────────────────────────────────────────────── */}
      <Modal
        open={filterOpen}
        onClose={() => setFilterOpen(false)}
        title="Advanced Filter"
        primaryAction={{ content: "Apply Filter", onAction: applyFilters, disabled: hasDateError }}
        secondaryActions={[
          { content: filterRefreshing ? "Refreshing…" : "Refresh Filters", onAction: handleFilterRefresh, loading: filterRefreshing, icon: RefreshIcon },
          ...(hasActiveFilters ? [{ content: "Clear All", onAction: resetFilters, destructive: true }] : []),
          { content: "Cancel", onAction: () => setFilterOpen(false) },
        ]}
      >
        <Modal.Section>
          <BlockStack gap="400">
            <Text variant="bodySm" tone="subdued">Refine your search with multiple filter options</Text>

            {/* Estimated Date */}
            <BlockStack gap="200">
              <Text variant="headingSm" fontWeight="semibold">Filter by Estimated Date</Text>
              <InlineGrid columns={2} gap="300">
                <TextField label="From" type="date" value={draftFilters.estimatedDateFrom} min={estimatedBounds.fromMin} max={estimatedBounds.fromMax} onChange={(v) => setDraftFilters((p) => ({ ...p, estimatedDateFrom: v }))} error={estimatedBounds.errorMsg} autoComplete="off" />
                <TextField label="To" type="date" value={draftFilters.estimatedDateTo} min={estimatedBounds.toMin} max={estimatedBounds.toMax} onChange={(v) => setDraftFilters((p) => ({ ...p, estimatedDateTo: v }))} autoComplete="off" />
              </InlineGrid>
              {estimatedBounds.errorMsg && <Text tone="critical" variant="bodySm">{estimatedBounds.errorMsg}</Text>}
            </BlockStack>

            <Divider />

            {/* Delivery Date */}
            <BlockStack gap="200">
              <Text variant="headingSm" fontWeight="semibold">Filter by Delivery Date</Text>
              <InlineGrid columns={2} gap="300">
                <TextField label="From" type="date" value={draftFilters.deliveryDateFrom} min={deliveryBounds.fromMin} max={deliveryBounds.fromMax} onChange={(v) => setDraftFilters((p) => ({ ...p, deliveryDateFrom: v }))} autoComplete="off" />
                <TextField label="To" type="date" value={draftFilters.deliveryDateTo} min={deliveryBounds.toMin} max={deliveryBounds.toMax} onChange={(v) => setDraftFilters((p) => ({ ...p, deliveryDateTo: v }))} autoComplete="off" />
              </InlineGrid>
              {deliveryBounds.errorMsg && <Text tone="critical" variant="bodySm">{deliveryBounds.errorMsg}</Text>}
            </BlockStack>

            <Divider />

            {/* Dynamic filters from API with parent/child dependency */}
            {filterOptions.dynamicFilters.map((filterDef, idx) => {
              const frontId = filterDef.front_element_id;
              const options = getFilteredOptions(filterDef, draftFilters.dynamic);
              const selectedValues = draftFilters.dynamic[frontId] || [];
              const isDisabled = !!filterDef.parent_filter && (draftFilters.dynamic[filterDef.parent_filter] || []).length === 0;
              const parentLabel = filterDef.parent_filter
                ? (filterOptions.dynamicFilters.find((f) => f.front_element_id === filterDef.parent_filter)?.label || "parent")
                : "";

              const handleDynamicChange = (newValues) => {
                const updated = { ...draftFilters.dynamic, [frontId]: newValues };
                // Clear child filters when parent changes
                filterOptions.dynamicFilters.forEach((child) => {
                  if (child.parent_filter === frontId) {
                    const validSet = new Set(newValues.flatMap((v) => resolveMap(child)[v] || []));
                    updated[child.front_element_id] = (updated[child.front_element_id] || []).filter((v) => validSet.has(v));
                  }
                });
                setDraftFilters((p) => ({ ...p, dynamic: updated }));
              };

              return (
                <React.Fragment key={frontId}>
                  {idx > 0 && <Divider />}
                  <BlockStack gap="200">
                    <InlineStack gap="200" blockAlign="center">
                      <Text variant="headingSm" fontWeight="semibold">Filter by {filterDef.label}</Text>
                      {isDisabled && <Text as="span" tone="subdued" variant="bodySm">(select a {parentLabel} first)</Text>}
                    </InlineStack>
                    {!isDisabled && options.length > 0 ? (
                      <>
                        <ChoiceList allowMultiple title="" titleHidden
                          choices={options.map((o) => ({ label: o, value: o }))}
                          selected={selectedValues}
                          onChange={handleDynamicChange}
                        />
                        {selectedValues.length > 0 && (
                          <InlineStack gap="200" wrap>
                            {selectedValues.map((v) => (
                              <Tag key={v} onRemove={() => handleDynamicChange(selectedValues.filter((x) => x !== v))}>{v}</Tag>
                            ))}
                          </InlineStack>
                        )}
                      </>
                    ) : (
                      <Text variant="bodySm" tone="subdued">
                        {isDisabled ? `Please select a ${parentLabel} first` : "No options available"}
                      </Text>
                    )}
                  </BlockStack>
                </React.Fragment>
              );
            })}
          </BlockStack>
        </Modal.Section>
      </Modal>

      {/* ── Order Details Modal ───────────────────────────────────────────────── */}
      <Modal open={orderDetailsOpen} onClose={() => setOrderDetailsOpen(false)} title="Order Details" large>
        <Modal.Section>
          {orderDetailsLoading ? (
            <InlineStack align="center"><Spinner size="large" /></InlineStack>
          ) : orderDetailsError ? (
            <Banner tone="critical">{orderDetailsError}</Banner>
          ) : orderDetailsData ? (
            (() => {
              const d = orderDetailsData;
              return (
                <BlockStack gap="400">
                  <InlineStack gap="300" blockAlign="center">
                    <Avatar customer name={d.carrier_type || "Carrier"} />
                    <BlockStack gap="100">
                      <Text variant="headingSm" fontWeight="bold">{d.carrier_type || "—"}</Text>
                      <Text variant="bodySm" tone="subdued">{d.servicetype || "—"}</Text>
                    </BlockStack>
                  </InlineStack>
                  <Divider />
                  <InlineGrid columns={2} gap="400">
                    <BlockStack gap="200">
                      <Text variant="headingSm" fontWeight="semibold">Billing Address</Text>
                      <Text variant="bodySm" tone={d.Billing_address ? "base" : "subdued"}>{orderDetailsEmptyVal(d.Billing_address)}</Text>
                    </BlockStack>
                    <BlockStack gap="200">
                      <Text variant="headingSm" fontWeight="semibold">Shipping Address</Text>
                      <Text variant="bodySm" tone={d.Shipping_address ? "base" : "subdued"}>{orderDetailsEmptyVal(d.Shipping_address)}</Text>
                    </BlockStack>
                  </InlineGrid>
                  <Divider />
                  <BlockStack gap="200">
                    {[
                      { label: "Name", value: d.cust_ordername },
                      { label: "Email", value: d.customer_shopemail || d.shop_email },
                      { label: "Order Number", value: d.shopifyorderno },
                      { label: "Order ID", value: d.order_no },
                      { label: "Order Date", value: d.order_date },
                      { label: "Product", value: d.product },
                      { label: "Amount", value: d.amount },
                      { label: "Number of Items", value: d.No_of_item },
                      { label: "Contact Number", value: d.phone_no },
                    ].map((item) => (
                      <InlineStack key={item.label} align="start" gap="400">
                        <Box minWidth="160px"><Text variant="bodySm" tone="subdued" fontWeight="medium">{item.label}</Text></Box>
                        <Text variant="bodySm" tone={item.value ? "base" : "subdued"}>{orderDetailsEmptyVal(item.value)}</Text>
                      </InlineStack>
                    ))}
                  </BlockStack>
                </BlockStack>
              );
            })()
          ) : (
            <Text tone="subdued">No details found.</Text>
          )}
        </Modal.Section>
      </Modal>

      {/* ── Export Limit Modal ────────────────────────────────────────────────── */}
      <Modal open={exportLimitOpen} onClose={() => setExportLimitOpen(false)} title="Export Limit Exceeded" primaryAction={{ content: "OK", onAction: () => setExportLimitOpen(false) }}>
        <Modal.Section>
          <Text variant="bodyMd">
            You have exceeded the maximum record download limit. To download more records, kindly contact{" "}
            <a href="mailto:support@lateshipment.com" style={{ color: "#2563eb" }}>support@lateshipment.com</a>.
          </Text>
        </Modal.Section>
      </Modal>

      <OneTrackEmailHistory open={emailHistoryOpen} onClose={() => setEmailHistoryOpen(false)} trackingnumber={emailHistoryTracking} />
      <OneTrackSendEmail open={sendEmailOpen} onClose={() => setSendEmailOpen(false)} trackingnumber={sendEmailTracking} customerEmail={sendEmailCustomer} />

      {toastActive && <Toast content={toastMessage} error={toastError} onDismiss={() => setToastActive(false)} duration={3000} />}
    </Frame>
  );
}