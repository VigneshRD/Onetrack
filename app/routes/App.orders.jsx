import { useState } from "react";
import {
  Page,
  Card,
  DataTable,
  Badge,
  Text,
  TextField,
  Button,
  InlineStack,
  BlockStack,
  Filters,
  ChoiceList,
} from "@shopify/polaris";

export default function OrdersPage() {
  const [queryValue, setQueryValue] = useState("");
  const [statusFilter, setStatusFilter] = useState([]);

  // Static orders data
  const orders = [
    {
      id: 1,
      orderNumber: "#1001",
      customerName: "John Smith",
      items: 3,
      total: "$125.00",
      status: "fulfilled",
      tracking: "1Z999AA10123456784",
      carrier: "UPS",
      date: "2024-05-15",
    },
    {
      id: 2,
      orderNumber: "#1002",
      customerName: "Sarah Johnson",
      items: 1,
      total: "$49.99",
      status: "fulfilled",
      tracking: "794612345678",
      carrier: "FedEx",
      date: "2024-05-15",
    },
    {
      id: 3,
      orderNumber: "#1003",
      customerName: "Michael Brown",
      items: 2,
      total: "$89.50",
      status: "partially_fulfilled",
      tracking: "9405511899564298765432",
      carrier: "USPS",
      date: "2024-05-14",
    },
    {
      id: 4,
      orderNumber: "#1004",
      customerName: "Emily Davis",
      items: 5,
      total: "$234.75",
      status: "fulfilled",
      tracking: "1Z999AA10123456785",
      carrier: "UPS",
      date: "2024-05-14",
    },
    {
      id: 5,
      orderNumber: "#1005",
      customerName: "David Wilson",
      items: 1,
      total: "$29.99",
      status: "unfulfilled",
      tracking: "—",
      carrier: "—",
      date: "2024-05-14",
    },
    {
      id: 6,
      orderNumber: "#1006",
      customerName: "Lisa Anderson",
      items: 4,
      total: "$178.25",
      status: "fulfilled",
      tracking: "794612345679",
      carrier: "FedEx",
      date: "2024-05-13",
    },
  ];

  const getStatusBadge = (status) => {
    const statusConfig = {
      fulfilled: { tone: "success", label: "Fulfilled" },
      partially_fulfilled: { tone: "attention", label: "Partially Fulfilled" },
      unfulfilled: { tone: "warning", label: "Unfulfilled" },
    };

    const config = statusConfig[status] || statusConfig.unfulfilled;
    return <Badge tone={config.tone}>{config.label}</Badge>;
  };

  // Filter orders based on search and filters
  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      queryValue === "" ||
      order.orderNumber.toLowerCase().includes(queryValue.toLowerCase()) ||
      order.customerName.toLowerCase().includes(queryValue.toLowerCase()) ||
      order.tracking.toLowerCase().includes(queryValue.toLowerCase());

    const matchesStatus =
      statusFilter.length === 0 || statusFilter.includes(order.status);

    return matchesSearch && matchesStatus;
  });

  const orderRows = filteredOrders.map((order) => [
    order.orderNumber,
    order.customerName,
    order.items,
    order.total,
    getStatusBadge(order.status),
    order.tracking,
    order.carrier,
    order.date,
  ]);

  const handleQueryValueRemove = () => setQueryValue("");
  const handleStatusFilterRemove = () => setStatusFilter([]);
  const handleClearAll = () => {
    handleQueryValueRemove();
    handleStatusFilterRemove();
  };

  const filters = [
    {
      key: "status",
      label: "Status",
      filter: (
        <ChoiceList
          title="Order status"
          titleHidden
          choices={[
            { label: "Fulfilled", value: "fulfilled" },
            { label: "Partially Fulfilled", value: "partially_fulfilled" },
            { label: "Unfulfilled", value: "unfulfilled" },
          ]}
          selected={statusFilter}
          onChange={setStatusFilter}
          allowMultiple
        />
      ),
      shortcut: true,
    },
  ];

  const appliedFilters = [];
  if (statusFilter.length > 0) {
    appliedFilters.push({
      key: "status",
      label: `Status: ${statusFilter.join(", ")}`,
      onRemove: handleStatusFilterRemove,
    });
  }

  return (
    <Page
      title="Orders"
      subtitle={`${filteredOrders.length} orders`}
      primaryAction={{
        content: "Import Orders",
        onAction: () => console.log("Import clicked"),
      }}
    >
      <BlockStack gap="400">
        <Card>
          <BlockStack gap="400">
            <Filters
              queryValue={queryValue}
              filters={filters}
              appliedFilters={appliedFilters}
              onQueryChange={setQueryValue}
              onQueryClear={handleQueryValueRemove}
              onClearAll={handleClearAll}
              queryPlaceholder="Search orders, customers, or tracking numbers"
            />

            <DataTable
              columnContentTypes={[
                "text",
                "text",
                "numeric",
                "text",
                "text",
                "text",
                "text",
                "text",
              ]}
              headings={[
                "Order",
                "Customer",
                "Items",
                "Total",
                "Status",
                "Tracking",
                "Carrier",
                "Date",
              ]}
              rows={orderRows}
              hoverable
              verticalAlign="middle"
            />

            {filteredOrders.length === 0 && (
              <div style={{ textAlign: "center", padding: "40px 0" }}>
                <Text as="p" tone="subdued">
                  No orders found matching your filters
                </Text>
              </div>
            )}
          </BlockStack>
        </Card>
      </BlockStack>
    </Page>
  );
}