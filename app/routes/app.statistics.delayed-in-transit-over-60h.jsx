// app/routes/shipments.predicted-delays.jsx
import ShipmentsByStatusPage from "./app.ShipmentsByStatus";
import { authenticate } from "../shopify.server";

export const loader = async ({ request }) => {
  await authenticate.admin(request);
  
  return {
    eventType: "delayed_in_transit_over_60h",
    pageTitle: "Delayed in transit (over 60 hours)",
    pageDescription: "Viewing Delayed in transit (over 60 hours) shipments from the Fulfillment Dashboard.",
  };
};

export default ShipmentsByStatusPage; 