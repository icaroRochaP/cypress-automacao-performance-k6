import http from 'k6/http';
import { check, sleep } from 'k6';
import { Trend } from 'k6/metrics';
 
// Configuração de cenários
export let options = {
  stages: [
    { duration: '30s', target: 50 },  // Aumenta para 50 usuários
    { duration: '1m', target: 100 },  // Aumenta para 100 usuários
    { duration: '30s', target: 0 },   // Diminui para 0 usuários
  ],
  thresholds: {
    'http_req_duration': ['p(95)<500'],  // 95% das requisições devem ser menores que 500ms
  },
};
 
// Métricas personalizadas
let page10 = new Trend('page_10_duration');
let page100 = new Trend('page_100_duration');
let page1000 = new Trend('page_1000_duration');
 
// URL da API
const BASE_URL = 'https://jsonplaceholder.typicode.com/posts%27';
 
// Função de extração de dados paginados
export default function () {
  // Testando paginação com 10 registros
  let res10 = http.get(`${BASE_URL}?page=1&limit=10`);
  check(res10, {
    'status é 200': (r) => r.status === 200,
    'duração é menor que 500ms': (r) => r.timings.duration < 500,
  });
  page10.add(res10.timings.duration);
 
  // Testando paginação com 100 registros
  let res100 = http.get(`${BASE_URL}?page=1&limit=100`);
  check(res100, {
    'status é 200': (r) => r.status === 200,
    'duração é menor que 500ms': (r) => r.timings.duration < 500,
  });
  page100.add(res100.timings.duration);
 
  // Testando paginação com 1000 registros
  let res1000 = http.get(`${BASE_URL}?page=1&limit=1000`);
  check(res1000, {
    'status é 200': (r) => r.status === 200,
    'duração é menor que 500ms': (r) => r.timings.duration < 500,
  });
  page1000.add(res1000.timings.duration);
 
  sleep(1);  // Intervalo entre as requisições
}