// app/routes/shipments.predicted-delays.jsx
import ShipmentsByStatusPage from "./app.ShipmentsByStatus";
import { authenticate } from "../shopify.server";

export const loader = async ({ request }) => {
  await authenticate.admin(request);
  
  return {
    eventType: "unused_shipping_labels",
    pageTitle: "Unused Shipping Labels",
    pageDescription: "Viewing Unused Shipping Labels shipments from the Fulfillment Dashboard.",
  };
};

export default ShipmentsByStatusPage; 