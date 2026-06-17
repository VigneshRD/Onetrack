// app/routes/shipments.predicted-delays.jsx
import ShipmentsByStatusPage from "./app.ShipmentsByStatus";
import { authenticate } from "../shopify.server";

export const loader = async ({ request }) => {
  await authenticate.admin(request);
  
  return {
    eventType: "predicted_delays",
    pageTitle: "Predicted Delays",
    pageDescription: "Shipments that are expected to be delayed based on tracking signals, carrier performance patterns, or delivery trends.",
  };
};

export default ShipmentsByStatusPage; 