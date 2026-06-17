// app/routes/shipments.in-transit-with-delays.jsx
import ShipmentsByStatusPage from "./app.ShipmentsByStatus";
import { authenticate } from "../shopify.server";

export const loader = async ({ request }) => {
  await authenticate.admin(request);
  
  return {
    eventType: "in-transit-with-delays",
    pageTitle: "In Transit with Delays",
    pageDescription: "Shipments are currently moving through the network but experiencing delays as indicated by the latest carrier updates.",
  };
};

export default ShipmentsByStatusPage;