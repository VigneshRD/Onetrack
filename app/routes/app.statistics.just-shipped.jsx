// app/routes/shipments.predicted-delays.jsx
import ShipmentsByStatusPage from "./app.ShipmentsByStatus";
import { authenticate } from "../shopify.server";

export const loader = async ({ request }) => {
  await authenticate.admin(request);
  
  return {
    eventType: "just_shipped",
    pageTitle: "Just Shipped",
    pageDescription: "Viewing Just Shipped shipments from the Fulfillment Dashboard.",
  };
};

export default ShipmentsByStatusPage; 