import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { Box, Text, InlineStack, Spinner } from '@shopify/polaris';

export default function DailyShipmentChart({ data, isLoading }) {
  if (isLoading) {
    return (
      <Box padding="600">
        <InlineStack align="center">
          <Spinner size="large" />
        </InlineStack>
      </Box>
    );
  }

  if (!data || !data.chartData || data.chartData.length === 0) {
    return (
      <Box padding="600">
        <Text variant="bodyMd" as="p" alignment="center" tone="subdued">
          No shipment data available for the selected period
        </Text>
      </Box>
    );
  }

  const { chartData, carriers } = data;

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
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
          <Text variant="headingSm" as="h3" fontWeight="semibold">
            {label}
          </Text>
          <Box paddingBlockStart="200">
            {payload.map((entry, index) => (
              <Box key={index} paddingBlockStart="100">
                <InlineStack gap="200" blockAlign="center">
                  <div
                    style={{
                      width: '12px',
                      height: '12px',
                      borderRadius: '50%',
                      backgroundColor: entry.color
                    }}
                  />
                  <Text variant="bodySm" as="p">
                    {entry.name}: <strong>{entry.value}</strong>
                  </Text>
                </InlineStack>
              </Box>
            ))}
          </Box>
        </Box>
      );
    }
    return null;
  };

  return (
    <Box padding="400">
      <ResponsiveContainer width="100%" height={350}>
        <LineChart
          data={chartData}
          margin={{ top: 10, right: 30, left: 50, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#E1E3E5" vertical={false} />
          <XAxis
            dataKey="date"
            tick={{ fill: '#6D7175', fontSize: 12 }}
            stroke="#8C9196"
          />
          <YAxis
            tick={{ fill: '#6D7175', fontSize: 12 }}
            stroke="#8C9196"
            label={{
              value: 'Shipment Count',
              angle: -90,
              position: 'insideLeft',
              offset: -10,
              style: { fill: '#6D7175', fontSize: 12, textAnchor: 'middle' }
            }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            wrapperStyle={{ paddingTop: '20px' }}
            iconType="line"
          />

          {carriers && carriers.length > 0 ? (
            carriers.map((carrier) => (
              <Line
                key={carrier.name}
                type="monotone"
                dataKey={carrier.name}
                stroke={carrier.color}
                strokeWidth={2}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
                name={carrier.name}
              />
            ))
          ) : (
            <Line
              type="monotone"
              dataKey="total"
              stroke="#2563eb"
              strokeWidth={2}
              dot={{ r: 4 }}
              activeDot={{ r: 6 }}
              name="Total Shipments"
            />
          )}
        </LineChart>
      </ResponsiveContainer>
    </Box>
  );
}