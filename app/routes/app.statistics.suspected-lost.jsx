// app/routes/shipments.predicted-delays.jsx
import ShipmentsByStatusPage from "./app.ShipmentsByStatus";
import { authenticate } from "../shopify.server";

export const loader = async ({ request }) => {
  await authenticate.admin(request);
  
  return {
    eventType: "suspected_lost",
    pageTitle: "Packages Suspected Lost",
    pageDescription: "Viewing Packages Suspected Lost shipments from the Fulfillment Dashboard.",
  };
};

export default ShipmentsByStatusPage; 