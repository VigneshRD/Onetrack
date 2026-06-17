// app/routes/shipments.predicted-delays.jsx
import ShipmentsByStatusPage from "./app.ShipmentsByStatus";
import { authenticate } from "../shopify.server";

export const loader = async ({ request }) => {
  await authenticate.admin(request);
  
  return {
    eventType: "undeliverable",
    pageTitle: "Undeliverable Shipments",
    pageDescription: "Viewing Undeliverable Shipments shipments from the Fulfillment Dashboard.",
  };
};

export default ShipmentsByStatusPage; 