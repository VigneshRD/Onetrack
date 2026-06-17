// app/routes/shipments.predicted-delays.jsx
import ShipmentsByStatusPage from "./app.ShipmentsByStatus";
import { authenticate } from "../shopify.server";

export const loader = async ({ request }) => {
  await authenticate.admin(request);
  
  return {
    eventType: "delivered",
    pageTitle: "Packages Delivered",
    pageDescription: "Viewing Packages Delivered shipments from the Fulfillment Dashboard.",
  };
};

export default ShipmentsByStatusPage; 