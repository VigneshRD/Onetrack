import React from 'react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip
} from 'recharts';
import { Box, Text, InlineStack, BlockStack, Spinner } from '@shopify/polaris';

const NAMED_COLORS = {
  UPS: '#351C15',
  FedEx: '#4D148C',
  DHL: '#FFCC00',
  USPS: '#004B87',
  'Royal Mail': '#E60000',
  DPD: '#DC0032',
  Hermes: '#00A8E1',
  Yodel: '#00B2A9',
  Parcelforce: '#FFD500',
};

const COLOR_PALETTE = [
  '#2563EB', '#16A34A', '#DC2626', '#D97706',
  '#7C3AED', '#0891B2', '#BE185D', '#65A30D',
  '#EA580C', '#0369A1', '#9333EA', '#15803D'
];

const getCarrierColor = (carrierName, index) => {
  return NAMED_COLORS[carrierName] || COLOR_PALETTE[index % COLOR_PALETTE.length];
};

export default function CarrierDistributionChart({ data, isLoading }) {
  if (isLoading) {
    return (
      <Box padding="600">
        <InlineStack align="center">
          <Spinner size="large" />
        </InlineStack>
      </Box>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Box padding="600">
        <Text variant="bodyMd" as="p" alignment="center" tone="subdued">
          No carrier data available
        </Text>
      </Box>
    );
  }

  const total = data.reduce((sum, item) => sum + item.count, 0);
  const chartData = data.map(item => ({
    ...item,
    percentage: total > 0 ? ((item.count / total) * 100).toFixed(1) : 0
  }));

  const renderCustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percentage }) => {
    if (percentage < 5) return null;
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);
    return (
      <text
        x={x}
        y={y}
        fill="white"
        textAnchor="middle"
        dominantBaseline="central"
        style={{ fontSize: '12px', fontWeight: 600 }}
      >
        {`${percentage}%`}
      </text>
    );
  };

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const item = payload[0].payload;
      return (
        <Box
          background="bg-surface"
          padding="300"
          borderRadius="200"
          style={{
            border: '1px solid var(--p-color-border)',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
          }}
        >
          <BlockStack gap="100">
            <Text variant="headingSm" as="h3" fontWeight="semibold">
              {item.carrier}
            </Text>
            <Text variant="bodySm" as="p">
              Shipments: <strong>{item.count.toLocaleString()}</strong>
            </Text>
            <Text variant="bodySm" as="p">
              Percentage: <strong>{item.percentage}%</strong>
            </Text>
          </BlockStack>
        </Box>
      );
    }
    return null;
  };

  const CustomLegend = () => {
    return (
      <Box paddingBlockStart="400">
        <BlockStack gap="200">
          {chartData.map((entry, index) => (
            <InlineStack key={index} align="space-between" blockAlign="center">
              <InlineStack gap="200" blockAlign="center">
                <div
                  style={{
                    width: '12px',
                    height: '12px',
                    borderRadius: '50%',
                    backgroundColor: getCarrierColor(entry.carrier, index)
                  }}
                />
                <Text variant="bodySm" as="p">
                  {entry.carrier}
                </Text>
              </InlineStack>
              <Text variant="bodySm" as="p" fontWeight="semibold">
                {entry.count.toLocaleString()} ({entry.percentage}%)
              </Text>
            </InlineStack>
          ))}
        </BlockStack>
      </Box>
    );
  };

  return (
    <Box padding="400">
      <ResponsiveContainer width="100%" height={280}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={renderCustomLabel}
            outerRadius={90}
            dataKey="count"
            nameKey="carrier"
          >
            {chartData.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={getCarrierColor(entry.carrier, index)}
              />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend content={<CustomLegend />} />
        </PieChart>
      </ResponsiveContainer>
    </Box>
  );
}