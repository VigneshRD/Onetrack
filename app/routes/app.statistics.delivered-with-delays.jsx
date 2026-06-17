// app/routes/shipments.predicted-delays.jsx
import ShipmentsByStatusPage from "./app.ShipmentsByStatus";
import { authenticate } from "../shopify.server";

export const loader = async ({ request }) => {
  await authenticate.admin(request);
  
  return {
    eventType: "delivered_with_delays",
    pageTitle: "Packages Delivered with Delays",
    pageDescription: "Viewing Packages Delivered with Delays shipments from the Fulfillment Dashboard.",
  };
};

export default ShipmentsByStatusPage; 