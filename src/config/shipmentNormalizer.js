// Raw DB value → display name for carrier codes
// Keys are always UPPERCASED — normalizeCarrier() does raw.toUpperCase() before lookup,
// so "dhl", "DHL", "Dhl" all resolve to the same entry.
export const CARRIER_RAW_TO_DISPLAY = {
    // FedEx variants
    FX:             'FedEx',
    INSIGHT:        'FedEx',
  
    // UPS variants
    UPS:            'UPS',
    UPSINSIGHT:     'UPS',
  
    // DHL variants
    DHL:            'DHL',
    DHLECOM:        'DHL eCommerce',
  
    // USPS variants
    USPS:           'USPS',
    STAMPS:         'USPS',
    ENDICIA:        'USPS',
  
    // Other carriers
    UKMAIL:            'UK Mail',
    ROYALMAIL:         'Royal Mail',
    CAPOST:            'Canada Post',
    CAPURO:            'Purolator',
    COURIERSPLEASE:    'Couriers Please',
    TNT:               'TNT',
    UNISHIPPERS:       'UniShippers',
    DEUTSCHEPOST:      'Deutsche Post',
    UNIUNI:            'UniUni',
    MYHERMES:          'MyHermes',
    VEHO:              'VEHO',
    SHIPX:             'ShipX',
    TIKTOK:            'TikTok',
    GLOBAL_E:          'Global-e',
    XDELIVERY:         'xDelivery',
    OTHERS:            'Others',
    // Additional carriers from getlsfilter API
    'AMAZON LOGISTICS': 'Amazon Logistics',
    AMAZON:            'Amazon Logistics',
    ANPOST:            'An Post',
    POSTNL:            'PostNL',
    WHATSSHIP:         'WhatsShip',
    SPEEDX:            'SpeedX',
    'GOFO EXPRESS':    'GOFO Express',
    GOFOEXPRESS:       'GOFO Express',
    'API - ASENDIA':   'Asendia',
    'AS-BROADREACH':   'Broadreach',
    'AS-CCL':          'CCL',
    'AS-INTERPOST':    'InterPost',
    'AS-ROYAL MAIL':   'Royal Mail',
  };
  
  // Raw DB value → display name for shipment statuses
  export const STATUS_RAW_TO_DISPLAY = {
    'IN TRANSIT':          'In Transit',
    'INTRANSIT':           'In Transit',
    'IN-TRANSIT':          'In Transit',
    'CANCEL':              'Cancelled',
    'CANCELLED':           'Cancelled',
    'EXCEPTION':           'Exception',
    'EXCEPTIONS':          'Exception',
    'LABEL CREATED':       'Label Created',
    'LABEL GENERATED':     'Label Created',
    'OUT FOR DELIVERY':    'Out For Delivery',
    'OUT-FOR-DELIVERY':    'Out For Delivery',
    'OUTFORDELIVERY':      'Out For Delivery',
    'RETURN':              'Return',
    'RETURNS':             'Return',
    'AWAITING COLLECTION': 'Awaiting Collection',
    'AWAITING-COLLECTION': 'Awaiting Collection',
    'DELIVERED':           'Delivered',
    'ATTEMPTED':           'Attempted',
    'DELIVERY ATTEMPTED':  'Delivery Attempted',
    'PICKED UP':           'Picked Up',
    'PICKED-UP':           'Picked Up',
    'PICKEDUP':            'Picked Up',
  };
  
  // Derived: display name → all raw variants (auto-built from maps above)
  export const CARRIER_DISPLAY_TO_RAWS = Object.entries(CARRIER_RAW_TO_DISPLAY).reduce(
    (acc, [raw, display]) => {
      (acc[display] = acc[display] || []).push(raw);
      return acc;
    },
    {}
  );
  
  export const STATUS_DISPLAY_TO_RAWS = Object.entries(STATUS_RAW_TO_DISPLAY).reduce(
    (acc, [raw, display]) => {
      (acc[display] = acc[display] || []).push(raw);
      return acc;
    },
    {}
  );
  
  // Normalize a single raw carrier value to its display name
  export function normalizeCarrier(raw) {
    if (!raw) return raw;
    return CARRIER_RAW_TO_DISPLAY[raw.toUpperCase()] || raw;
  }
  
  // Normalize a single raw status value to its display name
  export function normalizeStatus(raw) {
    if (!raw) return raw;
    return STATUS_RAW_TO_DISPLAY[raw.toUpperCase()] || raw;
  }
  
  // Convert a raw carrier list to unique display names (for filter dropdown options)
  export function dedupeCarriersToDisplay(rawValues) {
    const seen = new Set();
    const result = [];
    for (const raw of rawValues) {
      const display = normalizeCarrier(raw);
      if (!seen.has(display)) {
        seen.add(display);
        result.push(display);
      }
    }
    return result;
  }
  
  // Convert a raw status list to unique display names (for filter dropdown options)
  export function dedupeStatusesToDisplay(rawValues) {
    const seen = new Set();
    const result = [];
    for (const raw of rawValues) {
      const display = normalizeStatus(raw);
      if (!seen.has(display)) {
        seen.add(display);
        result.push(display);
      }
    }
    return result;
  }
  
  // Expand selected display names to all their raw DB variants (for sending to backend)
  export function expandCarrierDisplayNames(displayNames) {
    if (!Array.isArray(displayNames) || displayNames.length === 0) return displayNames;
    return displayNames.flatMap((d) => CARRIER_DISPLAY_TO_RAWS[d] || [d]);
  }
  
  export function expandStatusDisplayNames(displayNames) {
    if (!Array.isArray(displayNames) || displayNames.length === 0) return displayNames;
    return displayNames.flatMap((d) => STATUS_DISPLAY_TO_RAWS[d] || [d]);
  }
  
  // Normalize a carrier_map from the API (raw keys → display name keys, merging service types)
  // Input:  { FX: ['Ground'], INSIGHT: ['Priority'] }
  // Output: { FedEx: ['Ground', 'Priority'] }
  export function normalizeCarrierMap(rawCarrierMap) {
    const result = {};
    for (const [rawKey, serviceTypes] of Object.entries(rawCarrierMap || {})) {
      const display = normalizeCarrier(rawKey);
      if (!result[display]) result[display] = [];
      result[display].push(...serviceTypes);
    }
    // Dedupe service types per carrier
    for (const key of Object.keys(result)) {
      result[key] = [...new Set(result[key])];
    }
    return result;
  }
  