// SAFE VERSION - Only uses commonly available Polaris icons
// Replace BlockIcon and CircleAlertIcon with verified alternatives

import {
    DeliveryIcon,
    ClockIcon,
    PackageIcon,
    ClipboardChecklistIcon,
    AlertCircleIcon,
    LabelPrinterIcon,
    XCircleIcon,
    RefreshIcon,
    CalendarIcon,
    ArchiveIcon,
  } from '@shopify/polaris-icons';
  
  export const EVENT_METADATA = {
    "total_packages": { 
      icon: PackageIcon, 
      iconColor: '#f3f4f6', 
      href: "/onetrack/tracked-packages", 
      fallbackLabel: "Total Packages Being Tracked" 
    },
    "in_transit": { 
      icon: DeliveryIcon, 
      iconColor: '#dbeafe', 
      href: "/onetrack/shipments/in-transit", 
      fallbackLabel: "Shipments in Transit" 
    },
    "predicted_delays": { 
      icon: ClockIcon, 
      iconColor: '#fef3c7', 
      href: "/onetrack/shipments/predicted-delays", 
      fallbackLabel: "Predicted Delays" 
    },
    "exceptions": { 
      icon: AlertCircleIcon, 
      iconColor: '#fee2e2', 
      href: "/onetrack/shipments/exceptions", 
      fallbackLabel: "Exceptions" 
    },
    "suspected_lost": { 
      icon: AlertCircleIcon, 
      iconColor: '#fed7aa', 
      href: "/onetrack/shipments/suspected-lost", 
      fallbackLabel: "Packages Suspected Lost" 
    },
    "lost_damaged": { 
      icon: AlertCircleIcon, 
      iconColor: '#fee2e2', 
      href: "/onetrack/shipments/lost-damaged", 
      fallbackLabel: "Lost | Damaged Shipments" 
    },
    "just_shipped": { 
      icon: DeliveryIcon, 
      iconColor: '#cffafe', 
      href: "/onetrack/shipments/just-shipped", 
      fallbackLabel: "Just Shipped" 
    },
    "delivered": { 
      icon: ClipboardChecklistIcon, 
      iconColor: '#d1fae5', 
      href: "/onetrack/shipments/delivered", 
      fallbackLabel: "Packages Delivered" 
    },
    "delivered_with_delays": { 
      icon: ClockIcon, 
      iconColor: '#fef3c7', 
      href: "/onetrack/shipments/delays", 
      fallbackLabel: "Packages Delivered with Delays" 
    },
    "returned_shipments": { 
      icon: RefreshIcon, 
      iconColor: '#f3e8ff', 
      href: "/onetrack/shipments/returned", 
      fallbackLabel: "Returned Shipments" 
    },
    "undeliverable": { 
      icon: XCircleIcon, 
      iconColor: '#fee2e2', 
      href: "/onetrack/shipments/undeliverable", 
      fallbackLabel: "Undeliverable Shipments" 
    },
    "unused_shipping_labels": { 
      icon: LabelPrinterIcon, 
      iconColor: '#f3f4f6', 
      href: "/onetrack/shipments/unused-labels", 
      fallbackLabel: "Unused Shipping Labels" 
    },
    "refused": { 
      icon: XCircleIcon, 
      iconColor: '#fee2e2', 
      href: "/onetrack/shipments/refused", 
      fallbackLabel: "Refused" 
    },
    "cs_check": { 
      icon: ClipboardChecklistIcon, 
      iconColor: '#d1fae5', 
      href: "/onetrack/shipments/cs-check", 
      fallbackLabel: "CS Check" 
    },
    "evri_status_quo": { 
      icon: DeliveryIcon, 
      iconColor: '#dbeafe', 
      href: "/onetrack/shipments/evri-status", 
      fallbackLabel: "Evri Status Quo" 
    },
    "arrived_at_warehouse": { 
      icon: ArchiveIcon, 
      iconColor: '#e0e7ff', 
      href: "/onetrack/shipments/arrived-at-warehouse", 
      fallbackLabel: "Arrived At Warehouse" 
    },
    "awaiting_collection": { 
      icon: PackageIcon, 
      iconColor: '#e0e7ff', 
      href: "/onetrack/shipments/awaiting-collection", 
      fallbackLabel: "Awaiting Collection" 
    },
    "delayed_in_transit_over_60h": { 
      icon: ClockIcon, 
      iconColor: '#fee2e2', 
      href: "/onetrack/shipments/delayed-60-hours", 
      fallbackLabel: "Delayed in transit (over 60 hours)" 
    },
    "intercepted_shipments": { 
      icon: AlertCircleIcon, 
      iconColor: '#fed7aa', 
      href: "/onetrack/shipments/intercepted", 
      fallbackLabel: "Intercepted Shipments" 
    },
    "failed_deliveries": { 
      icon: AlertCircleIcon, 
      iconColor: '#fee2e2', 
      href: "/onetrack/shipments/failed-deliveries", 
      fallbackLabel: "Failed Deliveries", 
      apiStatus: "failed" 
    },
    "in_transit_with_delays": { 
      icon: ClockIcon, 
      iconColor: '#fef3c7', 
      href: "/onetrack/shipments/in-transit-with-delays", 
      fallbackLabel: "In Transit with Delays", 
      apiStatus: "in-transit-with-delays" 
    },
    "today_deliveries": { 
      icon: CalendarIcon, 
      iconColor: '#dbeafe', 
      href: "/onetrack/shipments/today-deliveries", 
      fallbackLabel: "Today's Expected Deliveries", 
      apiStatus: "todaydelivery" 
    },
  };