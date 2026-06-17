// app/routes/shipments.predicted-delays.jsx
import ShipmentsByStatusPage from "./app.ShipmentsByStatus";
import { authenticate } from "../shopify.server";

export const loader = async ({ request }) => {
  await authenticate.admin(request);
  
  return {
    eventType: "exceptions",
    pageTitle: "Exceptions",
    pageDescription: "Viewing Exceptions shipments from the Fulfillment Dashboard.",
  };
};

export default ShipmentsByStatusPage; 