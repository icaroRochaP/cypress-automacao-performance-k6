import http from 'k6/http';
import { check, sleep } from 'k6';
import { textSummary } from 'https://jslib.k6.io/k6-summary/0.0.1/index.js';

export let options = {
    stages: [
        { duration: '5s', target: 25 },  // Ramp-up com 20 VUs por 5 segundos
        { duration: '10s', target: 20 },  // Stay com 20 VUs por 10 segundos
        { duration: '5s', target: 5 },  // Ramp-down com 0 VUs por 5 segundos
      ],
    ext: {
        loadimpact: {
            projectID: 54321,  
            name: "Teste"
        },
        statsd: {
            address: 'localhost:9102',
            tags: { env: "test" }
        }
    }
};

export default function () {
    let res = http.get('URL_PROJETO');

    check(res, {
        'status é 200': (r) => r.status === 200,
    });

    check(res, {
        'tempo de resposta inferior a 500ms': (r) => r.timings.duration < 500,
    });

    check(res, {
        'corpo contém a mensagem correta': (r) => {
            let jsonResponse = JSON.parse(r.body);
            return jsonResponse.mensagem === "Sigla obtida com sucesso!";
        },
    });

    sleep(1);
}

export function handleSummary(data) {
    return {
        'stdout': textSummary(data, { indent: ' ', enableColors: true }),
        'summary.json': JSON.stringify(data),
    };
}