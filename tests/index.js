import { check, sleep } from 'k6';
import http from 'k6/http';

export const options = {
  stages: [
    { duration: '20s', target: 500 }, // Ramp up to 500 users over 20 seconds
    { duration: '10s', target: 500 }, // Hold at 500 users for 10 seconds
    { duration: '20s', target: 0 },   // Ramp down to 0 users over 20 seconds
  ],
};

export default function () {
  const res = http.get('npm ', {
    trade: "GCS",
    regno: "2331080",
  });
  check(res, { 'status is 200': (r) => r.status === 200 });
  sleep(1);
}
