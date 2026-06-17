import ShipmentStatisticsDetailPage from "./app.ShipmentStatisticsDetail";
import { authenticate } from "../shopify.server";
 
export const loader = async ({ request }) => {
  await authenticate.admin(request);
  return { eventType: "returned" };
};
 
export default ShipmentStatisticsDetailPage;
