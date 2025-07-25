import http from 'k6/http';
import { check, sleep } from 'k6';
import { Trend } from 'k6/metrics';

// Configuração de cenários
export let options = {
  stages: [
    { duration: '5s', target: 1 },  // Aumenta para 1 usuário
    // { duration: '1m', target: 100 },  // Aumenta para 100 usuários
    // { duration: '30s', target: 0 },   // Diminui para 0 usuários
  ],
  thresholds: {
    'http_req_duration': ['p(95)<1000'],  // 95% das requisições devem ser menores que 1000ms
  },
};

// Métricas personalizadas
let responseTimes = new Trend('response_times');

// URL da API
const BASE_URL = 'URL_PROJETO';

// Cabeçalhos da requisição
const headers = {
  'accept': '*/*',
  'accept': 'application/json',
  'Authorization': __ENV.TOKEN
};

// Variável global para controle do pageNumber
let pageNumber = 1;

// Função principal de execução do teste
export default function () {
  // Dados da requisição com o pageNumber atualizado
  const payload = JSON.stringify({
    "filtro": {
      "codOperacionalParticipante": 3,
      "tipoSolicitacao": "PERIODO_DE_ALTERACAO",
      "layout": "VINCULOS",
      "numConta": null,
      "codTipoVinculo": null,
      "dataDe": null,
      "dataAte": null
    },
    "campoRetorno": {
        "campoRetornoVinculo": {
            "tipoVinculo": true,
            "classificacaoVinculo": true,
            "situacaoVinculo": true,
            "dataAlteracaoSituacao": true,
            "contaOrigem": true,
            "tipoContaOrigem": true,
            "situacaoContaOrigem": true,
            "contaDestino": true,
            "tipoContaDestino": true,
            "situacaoContaDestino": true,
            "dataCriacao": true,
            "dataAlteracao": true
        }
    },
    "pageNumber": pageNumber,
    "itemsPerPage": 1000
  });

  let res = http.post(BASE_URL, payload, { headers: headers });
  check(res, {
    'status é 200': (r) => r.status === 200,
    'duração é menor que 1000ms': (r) => r.timings.duration < 1000,
  });
  responseTimes.add(res.timings.duration);

  pageNumber++;
  if (pageNumber > 3) {
    pageNumber = 1;
  }

  sleep(550);  // Intervalo entre as requisições
}