import React, { useState, useEffect, useMemo, useCallback } from 'react';
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
  Tooltip
} from '@shopify/polaris';
import {
  AlertCircleIcon,
  ClockIcon,
  PackageIcon,
  DeliveryIcon,
  ChevronRightIcon,
  InfoIcon
} from '@shopify/polaris-icons';
import { onetrackService } from '../../src/services/onetrackService';
import DateRangeFilter from '../../src/components/DateRangeFilter';
import DailyShipmentChart from '../../src/components/DailyShipmentChart';
import CarrierDistributionChart from '../../src/components/CarrierDistributionChart';
import { format, parseISO, subDays } from 'date-fns';
import { useNavigate } from "react-router";
import { authenticate } from "../shopify.server";

export const loader = async ({ request }) => {
  await authenticate.admin(request);
  return {};
};

// ─────────────────────────────────────────────────────────────
// Pure helpers
// ─────────────────────────────────────────────────────────────

function formatNumber(value) {
  return value.toLocaleString(undefined, { maximumFractionDigits: 0 });
}

function calcTrend(current, previous) {
  if (!Number.isFinite(current) || !Number.isFinite(previous)) {
    return { value: 0, direction: 'neutral', show: false };
  }
  if (current === 0 && previous === 0) {
    return { value: 0, direction: 'neutral', show: true };
  }
  if (current === 0 && previous > 0) {
    return { value: 100, direction: 'down', show: true };
  }
  if (previous === 0 && current > 0) {
    return { value: 100, direction: 'up', show: true };
  }
  const delta = (current - previous) / previous;
  const percent = Math.round(Math.abs(delta * 100));
  return { value: percent, direction: delta > 0 ? 'up' : delta < 0 ? 'down' : 'neutral', show: true };
}

function getPreviousPeriod(start, end) {
  const MS_PER_DAY = 1000 * 60 * 60 * 24;
  const dayCount = Math.round((end - start) / MS_PER_DAY);
  const prevEnd = subDays(start, 1);
  const prevStart = subDays(prevEnd, dayCount - 1);
  return { prevStart, prevEnd };
}
function getInitialDateRange() {
  if (typeof window !== 'undefined') {
    const stored = sessionStorage.getItem('onetrack_dateRange');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        // If it's a named preset, recompute it fresh so dates don't go stale
        if (parsed.label) {
          console.log('[getInitialDateRange] recomputing stale preset:', parsed.label);
          const today = new Date();
          const PRESETS = {
            'Today':        { start: format(today, 'yyyy-MM-dd'),           end: format(today, 'yyyy-MM-dd') },
            'Last Week':    { start: format(subDays(today, 6), 'yyyy-MM-dd'),  end: format(today, 'yyyy-MM-dd') },
            'Last 15 Days': { start: format(subDays(today, 14), 'yyyy-MM-dd'), end: format(today, 'yyyy-MM-dd') },
            'Last 30 days': { start: format(subDays(today, 29), 'yyyy-MM-dd'), end: format(today, 'yyyy-MM-dd') }, // ← lowercase 'd'
          };
          const fresh = PRESETS[parsed.label];
          if (fresh) {
            const result = JSON.stringify({ ...fresh, label: parsed.label });
            console.log('[getInitialDateRange] recomputed:', result);
            return result;
          }
        }
        // Custom range (no label) — keep as-is, user picked specific dates
        console.log('[getInitialDateRange] using stored custom range:', stored);
        return stored;
      } catch (e) {
        // Invalid JSON, fall through
      }
    }
  }

  const today = new Date();
  const result = JSON.stringify({
    start: format(subDays(today, 29), 'yyyy-MM-dd'),
    end: format(today, 'yyyy-MM-dd'),
    label: 'Last 30 days'
  });
  console.log('[getInitialDateRange] computed fresh default:', result);
  return result;
}

export default function DeliveryInsightsDashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState(getInitialDateRange);
  const [dashboardData, setDashboardData] = useState(null);

  // Save date range to session storage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('onetrack_dateRange', dateRange);
    }
  }, [dateRange]);

  // Calculate current and previous periods
  const { currentPeriod, previousPeriod } = useMemo(() => {
    const today = new Date();
    let start = subDays(today, 30);
    let end = today;

    try {
      const parsed = JSON.parse(dateRange);
      if (parsed.start && parsed.end) {
        start = new Date(parsed.start);
        end = new Date(parsed.end);
      }
    } catch (e) {
      // Fall back to 30 days
    }

    const { prevStart, prevEnd } = getPreviousPeriod(start, end);
    return {
      currentPeriod: { start, end },
      previousPeriod: { start: prevStart, end: prevEnd }
    };
  }, [dateRange]);

  // Load dashboard data
  const loadDashboardData = useCallback(async () => {
    setLoading(true);
    try {
      const { start, end } = currentPeriod;
      const { start: prevStart, end: prevEnd } = previousPeriod;

      const DATE_FMT = 'MMM dd, yyyy';
      const datefilterVal = `${format(start, DATE_FMT)} - ${format(end, DATE_FMT)}`;
      const prevDatefilterVal = `${format(prevStart, DATE_FMT)} - ${format(prevEnd, DATE_FMT)}`;

      // Fetch KPI data
      const data = await onetrackService.getOneTrackingKPIs({ datefilterVal, prevDatefilterVal });
      const kpiData = (data && data.success) ? data.data : null;
      const prevData = (data && data.prevData) ? data.prevData : null;

      // Fetch dashboard init (event list)
      let fetchedRawEvents = null;
      try {
        if (onetrackService.getDashboardInit) {
          const initRes = await onetrackService.getDashboardInit();
          let rawEvents = [];
          if (initRes && initRes.success && Array.isArray(initRes.data)) {
            rawEvents = initRes.data;
          } else if (Array.isArray(initRes)) {
            rawEvents = initRes;
          } else if (initRes && initRes.data && Array.isArray(initRes.data.events)) {
            rawEvents = initRes.data.events;
          }
          if (rawEvents.length > 0) fetchedRawEvents = rawEvents;
        }
      } catch (e) {
        console.error('Dashboard Init failed', e);
      }

      if (onetrackService && onetrackService.getShipmentStatistics) {
        const statsPromises = (fetchedRawEvents || []).map(evt => {
          const id = typeof evt === 'object' ? (evt.event_id || evt.id) : null;
          const key = typeof evt === 'object' ? evt.key : evt;
          return onetrackService
            .getShipmentStatistics(datefilterVal, parseInt(id))
            .then(res => ({ key, data: res }))
            .catch(err => ({ key, error: err }));
        });

        // Fetch chart data
        let pichartData = null;
        let linechartData = null;
        try {
          if (onetrackService.getOneTrackPichart) {
            pichartData = await onetrackService.getOneTrackPichart(datefilterVal).catch(() => null);
          }
          if (onetrackService.getOneTrackLinechart) {
            linechartData = await onetrackService.getOneTrackLinechart(datefilterVal).catch(() => null);
          }
        } catch (e) {
          console.error('Chart data fetch error', e);
        }

        const results = await Promise.all(statsPromises);

        const newStats = {};
        results.forEach(result => {
          if (result.data && result.data.success) {
            const key = result.key;
            if (Array.isArray(result.data.data) && result.data.data.length > 0) {
              const nestedData = result.data.data[0]?.data;
              newStats[key] = nestedData?.count ?? 0;
            } else if (typeof result.data.data === 'object' && result.data.data.count !== undefined) {
              newStats[key] = result.data.data.count;
            } else {
              newStats[key] = 0;
            }
          }
        });

        // Parse pie chart — use labels as carrier names, series as counts
        const piePayload = pichartData?.data?.chart ? pichartData.data : pichartData;
        let carrierDistribution = [];
        if (piePayload && piePayload.chart) {
          try {
            const chartObj = JSON.parse(piePayload.chart);
            if (Array.isArray(chartObj.labels) && Array.isArray(chartObj.series)) {
              carrierDistribution = chartObj.labels.map((carrier, idx) => ({
                carrier,
                count: chartObj.series[idx] || 0
              }));
            }
          } catch (e) {
            console.error('Error parsing pie chart data', e);
          }
        }

        // Parse line chart
        const linePayload = linechartData?.data?.chart ? linechartData.data : linechartData;
        let dailyShipments = { chartData: [], carriers: [] };
        if (linePayload && linePayload.chart) {
          try {
            const chartObj = JSON.parse(linePayload.chart);
            if (Array.isArray(chartObj.labels) && Array.isArray(chartObj.datasets)) {
              const carriers = chartObj.datasets.map(ds => ({
                name: ds.label,
                color: ds.borderColor || '#2563eb'
              }));
              const chartData = chartObj.labels.map((date, idx) => {
                const point = { date };
                let total = 0;
                chartObj.datasets.forEach(ds => {
                  const val = (ds.data && ds.data[idx]) || 0;
                  point[ds.label] = val;
                  total += val;
                });
                point.total = total;
                return point;
              });
              dailyShipments = { chartData, carriers };
            }
          } catch (e) {
            console.error('Error parsing line chart data', e);
          }
        }

        setDashboardData({
          ...(kpiData || {}),
          prevData: prevData || {},
          shipmentStats: newStats,
          carrierDistribution: carrierDistribution.length > 0 ? carrierDistribution : null,
          dailyShipments: dailyShipments.chartData.length > 0 ? dailyShipments : null,
          dashInitEvents: fetchedRawEvents
        });
      } else {
        setDashboardData(null);
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  }, [currentPeriod, previousPeriod]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  const dateRangeLabel = useMemo(() => {
    try {
      const parsed = JSON.parse(dateRange);
      if (parsed.label) return parsed.label;
      if (parsed.start && parsed.end) {
        const s = parseISO(parsed.start);
        const e = parseISO(parsed.end);
        if (parsed.start === parsed.end) return format(s, 'MMM d');
        return `${format(s, 'MMM d')} – ${format(e, 'MMM d')}`;
      }
    } catch (e) {
      // Invalid JSON
    }
    return 'Last 30 days';
  }, [dateRange]);

  // Map event types to URL routes (WITH /app prefix)
  const getRouteForEventType = (eventType) => {
    const routeMap = {
      'failed_deliveries': '/app/shipments/failed-deliveries',
      'predicted_delays': '/app/shipments/predicted-delays',
      'in_transit_with_delays': '/app/shipments/in-transit-with-delays',
      'today_deliveries': '/app/shipments/today-deliveries'
    };
    return routeMap[eventType] || '/app/shipments';
  };

  // Critical alert cards data
  const criticalAlertCards = useMemo(() => {
    const prev = dashboardData?.prevData || {};
    return [
      {
        title: 'Failed Deliveries',
        value: dashboardData?.attempted ?? 0,
        icon: AlertCircleIcon,
        color: 'critical',
        bgColor: '#FEF3F2',
        iconBg: '#FEE4E2',
        borderColor: '#FECDCA',
        eventType: 'failed_deliveries',
        tooltip: 'Delivery attempts that were unsuccessful due to issues such as incorrect address, customer unavailability, or carrier exceptions.',
        trend: calcTrend(dashboardData?.attempted ?? 0, prev.attempted ?? 0)
      },
      {
        title: 'Predicted Delays',
        value: dashboardData?.delayprediction ?? 0,
        icon: ClockIcon,
        color: 'warning',
        bgColor: '#FFFAEB',
        iconBg: '#FEF0C7',
        borderColor: '#FEDF89',
        eventType: 'predicted_delays',
        tooltip: 'Shipments that are expected to be delayed based on tracking signals, carrier performance patterns, or delivery trends.',
        trend: calcTrend(dashboardData?.delayprediction ?? 0, prev.delayprediction ?? 0)
      },
      {
        title: 'In Transit with Delays',
        value: dashboardData?.undelivered ?? 0,
        icon: DeliveryIcon,
        color: 'warning',
        bgColor: '#FFFAEB',
        iconBg: '#FEF0C7',
        borderColor: '#FEDF89',
        eventType: 'in_transit_with_delays',
        tooltip: 'Shipments are currently moving through the network but experiencing delays as indicated by the latest carrier updates.',
        trend: calcTrend(dashboardData?.undelivered ?? 0, prev.undelivered ?? 0)
      },
      {
        title: "Today's Expected Deliveries",
        value: dashboardData?.todaydelivery ?? 0,
        icon: PackageIcon,
        color: 'info',
        bgColor: '#F0F9FF',
        iconBg: '#E0F2FE',
        borderColor: '#B9E6FE',
        eventType: 'today_deliveries',
        tooltip: 'Shipments planned or estimated to be delivered today based on real-time carrier tracking and delivery predictions.',
        trend: calcTrend(dashboardData?.todaydelivery ?? 0, prev.todaydelivery ?? 0)
      }
    ];
  }, [dashboardData]);

  // Shipment stats configuration
  const shipmentStatsConfig = useMemo(() => {
    const stats = dashboardData?.shipmentStats || {};
    const events = dashboardData?.dashInitEvents || [];
    const leftColumn = [];
    const rightColumn = [];

    events.forEach((evt, index) => {
      const key = typeof evt === 'object' ? evt.key : evt;
      const label = typeof evt === 'object' ? evt.label || evt.event_name : evt;
      const statItem = {
        label,
        value: stats[key] || 0,
        key,
        icon: PackageIcon,
        iconBg: '#F3F4F6'
      };
      if (index % 2 === 0) {
        leftColumn.push(statItem);
      } else {
        rightColumn.push(statItem);
      }
    });

    return { leftColumn, rightColumn };
  }, [dashboardData]);

  // Handle card click with URL-based navigation
  const handleCardClick = (eventType) => {
    if (eventType) {
      const route = getRouteForEventType(eventType);
      navigate(route, {
        state: {
          dateRange,
          breadcrumb: {
            from: "Delivery Insights",
            path: "/app/dashboard",
          }
        }
      });
    }
  };

  // Handle statistics card click (for detail pages)
  const handleStatisticClick = (statKey) => {
    if (statKey) {
      const routeKey = statKey.replace(/_/g, '-');
      navigate(`/app/statistics/${routeKey}`, {
        state: {
          dateRange,
          breadcrumb: {
            from: "Dashboard",
            path: "/app/dashboard",
          }
        }
      });
    }
  };

  return (
    <Page
      title="Delivery Insights"
      subtitle="Monitor shipment performance, identify issues early, and act on critical metrics"
      primaryAction={
        <Box>
          <DateRangeFilter
            value={dateRange}
            onChange={setDateRange}
            range={1}
            preYear={1}
          />
        </Box>
      }
    >
      <Layout>
        {/* Critical Alerts Section */}
        <Layout.Section>
          <BlockStack gap="400">
            <InlineStack align="space-between" blockAlign="center">
              <InlineStack gap="200" blockAlign="center">
                <Text variant="headingMd" as="h2">Critical Alerts</Text>
                <Tooltip content="Highlights issues requiring immediate attention. Select a card to view affected shipments in detail.">
                  <Icon source={InfoIcon} tone="base" />
                </Tooltip>
              </InlineStack>
            </InlineStack>

            {/* CSS Grid for equal height + width cards */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: '16px',
            }}>
              {criticalAlertCards.map((alert, index) => (
                <div
                  key={index}
                  onClick={() => handleCardClick(alert.eventType)}
                  style={{ cursor: 'pointer' }}
                >
                  <div style={{
                    background: alert.bgColor,
                    border: `2px solid ${alert.borderColor}`,
                    borderRadius: '12px',
                    padding: '16px',
                    height: '100%',
                    boxSizing: 'border-box',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px',
                  }}>
                    {/* Icon row */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div style={{
                        background: alert.iconBg,
                        borderRadius: '8px',
                        padding: '8px',
                        display: 'inline-flex'
                      }}>
                        <Icon source={alert.icon} tone={alert.color} />
                      </div>
                      <Tooltip content={alert.tooltip}>
                        <Icon source={InfoIcon} tone="subdued" />
                      </Tooltip>
                    </div>

                    {/* Content */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1 }}>
                      <Text variant="headingSm" as="h3" tone="subdued">
                        {alert.title}
                      </Text>
                      <Text variant="heading2xl" as="p" fontWeight="bold">
                        {loading ? '—' : formatNumber(alert.value)}
                      </Text>
                      <Text variant="bodySm" as="p" tone="subdued">
                        {dateRangeLabel}
                      </Text>
                    </div>

                    {/* View shipments link */}
                    <Button
                      variant="plain"
                      icon={ChevronRightIcon}
                      textAlign="left"
                      onClick={(e) => { e.stopPropagation(); handleCardClick(alert.eventType); }}
                    >
                      View shipments
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </BlockStack>
        </Layout.Section>

        {/* Shipment Statistics Section */}
        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <InlineStack align="space-between" blockAlign="center">
                <BlockStack gap="100">
                  <Text variant="headingMd" as="h2">Shipment Statistics</Text>
                  <Text variant="bodySm" as="p" tone="subdued">
                    Real time insights into shipment volume, delivery status, and delays
                  </Text>
                </BlockStack>
                <Badge>{dateRangeLabel}</Badge>
              </InlineStack>

              <Divider />

              {loading ? (
                <Box padding="600">
                  <InlineStack align="center">
                    <Spinner size="large" />
                  </InlineStack>
                </Box>
              ) : (
                <InlineStack gap="600" align="start" wrap={false}>
                  {/* Left Column */}
                  <Box width="50%">
                    <BlockStack gap="400">
                      {shipmentStatsConfig.leftColumn.map((stat, index) => (
                        <React.Fragment key={index}>
                          <div
                            onClick={() => handleStatisticClick(stat.key)}
                            style={{ cursor: 'pointer' }}
                          >
                            <InlineStack align="space-between" blockAlign="center">
                              <InlineStack gap="300" blockAlign="center">
                                <Box
                                  background={stat.iconBg}
                                  borderRadius="100"
                                  padding="200"
                                  style={{ display: 'inline-flex' }}
                                >
                                  <Icon source={stat.icon} tone="base" />
                                </Box>
                                <Text variant="bodyMd" as="p">{stat.label}</Text>
                              </InlineStack>
                              <InlineStack gap="200" blockAlign="center">
                                <Text variant="headingMd" as="p" fontWeight="semibold">
                                  {formatNumber(stat.value)}
                                </Text>
                                <Icon source={ChevronRightIcon} tone="subdued" />
                              </InlineStack>
                            </InlineStack>
                          </div>
                          {index < shipmentStatsConfig.leftColumn.length - 1 && <Divider />}
                        </React.Fragment>
                      ))}
                    </BlockStack>
                  </Box>

                  <Box
                    borderWidth="025"
                    borderColor="border"
                    style={{ height: 'auto', width: '1px' }}
                  />

                  {/* Right Column */}
                  <Box width="50%">
                    <BlockStack gap="400">
                      {shipmentStatsConfig.rightColumn.map((stat, index) => (
                        <React.Fragment key={index}>
                          <div
                            onClick={() => handleStatisticClick(stat.key)}
                            style={{ cursor: 'pointer' }}
                          >
                            <InlineStack align="space-between" blockAlign="center">
                              <InlineStack gap="300" blockAlign="center">
                                <Box
                                  background={stat.iconBg}
                                  borderRadius="100"
                                  padding="200"
                                  style={{ display: 'inline-flex' }}
                                >
                                  <Icon source={stat.icon} tone="base" />
                                </Box>
                                <Text variant="bodyMd" as="p">{stat.label}</Text>
                              </InlineStack>
                              <InlineStack gap="200" blockAlign="center">
                                <Text variant="headingMd" as="p" fontWeight="semibold">
                                  {formatNumber(stat.value)}
                                </Text>
                                <Icon source={ChevronRightIcon} tone="subdued" />
                              </InlineStack>
                            </InlineStack>
                          </div>
                          {index < shipmentStatsConfig.rightColumn.length - 1 && <Divider />}
                        </React.Fragment>
                      ))}
                    </BlockStack>
                  </Box>
                </InlineStack>
              )}
            </BlockStack>
          </Card>
        </Layout.Section>

        {/* Daily Shipment Statistics and Carrier Distribution */}
        <Layout.Section>
          <InlineStack gap="400" align="start" wrap={false}>
            {/* Daily Shipment Statistics */}
            <Box width="65%">
              <Card>
                <BlockStack gap="400">
                  <InlineStack align="space-between" blockAlign="center">
                    <InlineStack gap="200" blockAlign="center">
                      <Text variant="headingMd" as="h2">Daily Shipment Statistics</Text>
                      <Icon source={InfoIcon} tone="base" />
                    </InlineStack>
                  </InlineStack>
                  <Text variant="bodySm" as="p" tone="subdued">{dateRangeLabel}</Text>

                  <Divider />

                  <Box padding="600">
                    {loading ? (
                      <InlineStack align="center">
                        <Spinner size="large" />
                      </InlineStack>
                    ) : (
                      <DailyShipmentChart
                        data={dashboardData?.dailyShipments}
                        isLoading={loading}
                      />
                    )}
                  </Box>
                </BlockStack>
              </Card>
            </Box>

            {/* Carrier Distribution */}
            <Box width="35%">
              <Card>
                <BlockStack gap="400">
                  <InlineStack align="space-between" blockAlign="center">
                    <InlineStack gap="200" blockAlign="center">
                      <Text variant="headingMd" as="h2">Carrier Distribution</Text>
                      <Icon source={InfoIcon} tone="base" />
                    </InlineStack>
                  </InlineStack>
                  <Text variant="bodySm" as="p" tone="subdued">{dateRangeLabel}</Text>

                  <Divider />

                  <Box padding="600">
                    <CarrierDistributionChart
                      data={dashboardData?.carrierDistribution}
                      isLoading={loading}
                    />
                  </Box>

                  <Divider />

                  {/* <InlineStack align="center">
                    <Button icon={ChevronRightIcon}>VIEW ALL CARRIERS</Button>
                  </InlineStack> */}

                  <Box
                    background="bg-surface-info"
                    borderRadius="200"
                    padding="400"
                  >
                    <BlockStack gap="200">
                      <InlineStack gap="200" blockAlign="start">
                        <Box paddingBlockStart="050">
                          <Icon source={InfoIcon} tone="info" />
                        </Box>
                        <BlockStack gap="100">
                          <Text variant="headingSm" as="h3">Insight</Text>
                          <Text variant="bodySm" as="p">
                            Analyze carrier performance to optimize delivery efficiency and shipping costs.
                          </Text>
                        </BlockStack>
                      </InlineStack>
                    </BlockStack>
                  </Box>
                </BlockStack>
              </Card>
            </Box>
          </InlineStack>
        </Layout.Section>
      </Layout>
    </Page>
  );
}