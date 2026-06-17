// app/routes/shipments.predicted-delays.jsx
import ShipmentsByStatusPage from "./app.ShipmentsByStatus";
import { authenticate } from "../shopify.server";

export const loader = async ({ request }) => {
  await authenticate.admin(request);
  
  return {
    eventType: "lost_damaged",
    pageTitle: "Lost | Damaged Shipments",
    pageDescription: "Viewing Lost | Damaged Shipments shipments from the Fulfillment Dashboard.",
  };
};

export default ShipmentsByStatusPage; 