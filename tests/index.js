import { check, sleep } from 'k6';
import http from 'k6/http';


export const options = {
  stages: [
    { duration: '10s', target: 150 }, // Ramp up to 50 users over 30 seconds
    { duration: '20s', target: 150 },  // Hold at 50 users for 1 minute
    { duration: '10s', target: 0 },  // Ramp down
  ],
};

export default function () {
  const res = http.post('http://localhost:3000/aptitude/appear/27',{trade:"GCD",regno:"2331080"});
  check(res, { 'status is 200': (r) => r.status === 200 });
  sleep(1);
}
