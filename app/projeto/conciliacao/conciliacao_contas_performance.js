import http from 'k6/http';
import { check, sleep } from 'k6';
import { Trend, Counter } from 'k6/metrics';
import { getAccessToken } from './auth.js';

// Configuração de cenários
export let options = {
    vus: 2, 
    iterations: 5, 
    duration: '10m',
    thresholds: {
        'http_req_duration': ['p(95)<2000'],  // 95% das requisições devem ser menores que 2s
    },
};

let temposDeResposta = new Trend('tempos_de_resposta');
let contadorDeRequisicoes = new Counter('contador_de_requisicoes');

// URL da API
const BASE_URL = 'URL_PROJETO';

export function setup() {
    const authToken = getAccessToken();
    if (!authToken) {
        throw new Error('Falha ao obter o token de acesso');
    }
    return { authToken };
}

export default function (data) {
    const authToken = data.authToken;
    const headers = {
        'accept': '*/*',
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
    };

    const page = __ITER + 1; // __ITER é uma variável interna do K6 que representa a iteração atual (começa em 0)

    const payload = JSON.stringify({
        "data": {
        "filter": {
            "participantOperationalCode": 80710,
            "accountNumber": null,
            "requestTypeCode": "PERIODO_DE_CRIACAO",
            "layoutCode": "CONTAS",
            "linkTypeCode": null,
            "startDate": null,
            "endDate": null
        },
        "allReturn": {
        "account": {
          "accountNumberIndicator": true,
          "accountTypeIndicator": true,
          "accountSegmentIndicator": true,
          "accountStatusIndicator": true,
          "accountProfileIndicator": true,
          "accountContactIndicator": true,
          "hftProfileIndicator": true,
          "tdProfileIndicator": true,
          "accountCreateDateIndicator": true,
          "accountChangeDateIndicator": true
        },
        "investor": {
          "individualPersonIndicator": true,    
          "organisationIndicator": true,
          "documentIndicator": true,
          "emailAddressIndicator": true,
          "addressIndicator": true,
          "phoneNumberIndicator": true,
          "nationalBankAccountIndicator": true,
          "internationalBankAccountIndicator": true,
          "patrimonyIndicator": true,
          "simplifiedRegistrationIndicator": true,
          "statusIndicator": true
        },
        "basicData": {
          "hftProfileIndicator": true,
          "restrictionIndicator": true
        }
      
      },
        "page": page,
        "pageSize": 1000
      }
      
      });

    let res = http.post(BASE_URL, payload, { headers: headers });
    check(res, {
        'status é 200': (r) => r.status === 200,
        'duração é menor que 2s': (r) => r.timings.duration < 2000,
    });
    temposDeResposta.add(res.timings.duration);
    contadorDeRequisicoes.add(1);
}

export function teardown(data) {
    console.log(`Total de requisições: ${contadorDeRequisicoes}`);
    console.log(`Tempos de resposta (ms): ${JSON.stringify(temposDeResposta)}`);
    console.log(`Contador de Requisições (Count): ${contadorDeRequisicoes._count}`);
    console.log(`Tempos de Resposta (Stats): ${JSON.stringify({
        min: temposDeResposta._min,
        max: temposDeResposta._max,
        avg: temposDeResposta._count > 0 ? temposDeResposta._sum / temposDeResposta._count : 0,
        count: temposDeResposta._count
    })}`);
}