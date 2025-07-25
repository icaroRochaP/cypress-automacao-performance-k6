import http from 'k6/http';
import { check } from 'k6';

export function getAccessToken() {
  const url = 'URL_PROJETO';
  const payload = {
    client_id: '894_56E5CC8F_CLIENT',
    grant_type: 'password',
    username: _ENV.USERNAME,
    password: _ENV.PASSWORD,
    client_secret: '09b711dc-170c-457b-af84-684140a3edd2',
  };

  const headers = {
    'Content-Type': 'application/x-www-form-urlencoded',
    'Cookie': 'PF=9BgpRGkAUpeokptXOJKD85; PF=9BgpRGkAUpeokptXOJKD85',
  };

  const response = http.post(url, payload, { headers: headers });

  check(response, {
    'is status 200': (r) => r.status === 200,
  });

  const accessToken = JSON.parse(response.body).access_token;
  
  return accessToken;
}

export default function () {
  const accessToken = getAccessToken();
  
}