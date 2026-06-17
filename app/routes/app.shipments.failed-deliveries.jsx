// app/routes/shipments.failed-deliveries.jsx
import ShipmentsByStatusPage from "./app.ShipmentsByStatus";
import { authenticate } from "../shopify.server";

export const loader = async ({ request }) => {
  await authenticate.admin(request);
  
  // React Router v7 - return plain object
  return {
    eventType: "failed",
    pageTitle: "Failed Deliveries",
    pageDescription: "Delivery attempts that were unsuccessful due to issues such as incorrect address, customer unavailability, or carrier exceptions.",
  };
};

export default ShipmentsByStatusPage;