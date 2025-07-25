import http from 'k6/http';
import { check, sleep } from 'k6';
import { Trend } from 'k6/metrics';
 
// Configuração de opções para o teste
export let options = {
    scenarios: {
        // Cenário para chamadas únicas (um participante acessando a API)
        single_call: {
            executor: 'per-vu-iterations',
            vus: 1,
            iterations: 1,
            maxDuration: '30s',
        },
        // Cenário para chamadas paralelas com diferentes quantidades de threads
        parallel_2_threads: {
            executor: 'constant-vus',
            vus: 2,   // 2 threads em paralelo
            duration: '30s',
            startTime: '30s',
        },
        parallel_4_threads: {
            executor: 'constant-vus',
            vus: 4,   // 4 threads em paralelo
            duration: '30s',
            startTime: '1m',
        },
        parallel_8_threads: {
            executor: 'constant-vus',
            vus: 8,   // 8 threads em paralelo
            duration: '30s',
            startTime: '1m30s',
        },
        parallel_16_threads: {
            executor: 'constant-vus',
            vus: 16,  // 16 threads em paralelo
            duration: '30s',
            startTime: '2m',
        },
    },
    thresholds: {
        'http_req_duration': ['p(95)<1000'],  // 95% das requisições devem ser concluídas em menos de 1s
    },
};
 
// Métricas personalizadas
let singleCall10 = new Trend('single_call_10_accounts_duration');
let singleCall100 = new Trend('single_call_100_accounts_duration');
let singleCall1000 = new Trend('single_call_1000_accounts_duration');
 
let parallelCall10 = new Trend('parallel_call_10_accounts_duration');
let parallelCall100 = new Trend('parallel_call_100_accounts_duration');
let parallelCall1000 = new Trend('parallel_call_1000_accounts_duration');
 
// URL da API
const BASE_URL = 'https://jsonplaceholder.typicode.com/posts%27';
 
// Função para fazer a chamada única para páginas de 10, 100 e 1000 contas
function callSinglePage() {
    // Chamadas únicas com diferentes tamanhos de página
    let res10 = http.get(`${BASE_URL}?page=1&limit=10`);
    check(res10, { 'status é 200': (r) => r.status === 200 });
    singleCall10.add(res10.timings.duration);
 
    let res100 = http.get(`${BASE_URL}?page=1&limit=100`);
    check(res100, { 'status é 200': (r) => r.status === 200 });
    singleCall100.add(res100.timings.duration);
 
    let res1000 = http.get(`${BASE_URL}?page=1&limit=1000`);
    check(res1000, { 'status é 200': (r) => r.status === 200 });
    singleCall1000.add(res1000.timings.duration);
 
    sleep(1); // Intervalo de 1 segundo entre requisições
}
 
// Função para fazer chamadas paralelas
function callParallelPage() {
    let res10 = http.get(`${BASE_URL}?page=1&limit=10`);
    check(res10, { 'status é 200': (r) => r.status === 200 });
    parallelCall10.add(res10.timings.duration);
 
    let res100 = http.get(`${BASE_URL}?page=1&limit=100`);
    check(res100, { 'status é 200': (r) => r.status === 200 });
    parallelCall100.add(res100.timings.duration);
 
    let res1000 = http.get(`${BASE_URL}?page=1&limit=1000`);
    check(res1000, { 'status é 200': (r) => r.status === 200 });
    parallelCall1000.add(res1000.timings.duration);
 
    sleep(1); // Intervalo de 1 segundo entre requisições
}
 
// Execução do cenário de chamadas únicas e paralelas
export default function () {
    if (__VU === 1) {
        // Apenas o VU 1 faz chamadas únicas
        callSinglePage();
    } else {
        // Outros VUs executam chamadas paralelas
        callParallelPage();
    }
}