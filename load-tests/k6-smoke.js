import http from "k6/http";
import { check, sleep } from "k6";

const baseUrl = (__ENV.BASE_URL || "http://localhost:3000").replace(/\/$/, "");
const productPath = __ENV.PRODUCT_PATH || "/shop";

export const options = {
  vus: Number(__ENV.VUS || 5),
  duration: __ENV.DURATION || "1m",
  thresholds: {
    http_req_failed: ["rate<0.05"],
    http_req_duration: ["p(95)<1500"]
  }
};

const paths = [
  "/",
  "/shop",
  productPath,
  "/checkout",
  "/resources",
  "/account/login"
];

export default function smokeScenario() {
  for (const path of paths) {
    const response = http.get(`${baseUrl}${path}`);
    check(response, {
      [`${path} status is 2xx/3xx`]: (res) => res.status >= 200 && res.status < 400
    });
    sleep(1);
  }
}
