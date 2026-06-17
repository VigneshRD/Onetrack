// app/routes/shipments.today-deliveries.jsx
import ShipmentsByStatusPage from "./app.ShipmentsByStatus";
import { authenticate } from "../shopify.server";

export const loader = async ({ request }) => {
  await authenticate.admin(request);
  
  return {
    eventType: "todaydelivery",
    pageTitle: "Today's Expected Deliveries",
    pageDescription: "Shipments planned or estimated to be delivered today based on real-time carrier tracking and delivery predictions.",
  };
};

export default ShipmentsByStatusPage;