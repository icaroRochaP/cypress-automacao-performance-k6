import http from 'k6/http';
import { check, sleep } from 'k6';
import { Trend, Counter, Rate } from 'k6/metrics';
import { getAccessToken, getAccessTokenCERT } from './auth_dinamico.js';
import { gerarCPF, gerarNumeroUnico } from './Utils.js';

// ====== CONFIGURAÇÕES DO TESTE ======
const TOTAL_PARTICIPANTES = parseInt(__ENV.TOTAL_PARTICIPANTES || '5');         // Número de participantes a simular
const LOTES_POR_PARTICIPANTE = parseInt(__ENV.LOTES_POR_PARTICIPANTE || '3');   // Número de lotes a enviar por participante
const CONTAS_POR_LOTE = parseInt(__ENV.CONTAS_POR_LOTE || '5');                 // Número de contas por lote
const SEGMENTO = parseInt(__ENV.SEGMENTO || '2');                               // Segmento padrão
const AMBIENTE = __ENV.AMBIENTE || "CERT";                                      // Ambiente (DEV ou CERT)
const SLEEP_BETWEEN_REQUESTS = parseFloat(__ENV.SLEEP_BETWEEN_REQUESTS || '1'); // Tempo entre requisições (segundos)
const VUS = parseInt(__ENV.VUS || '10');                                        // Usuários virtuais
const ITERATIONS_PER_VU = parseInt(__ENV.ITERATIONS_PER_VU || '10');            // Iterações por VU
const COUNTER_ACCOUNT_CODE = __ENV.COUNTER_ACCOUNT_CODE || "26769.00-2";        // Código da conta padrão

// URLs (você deve definir essas variáveis conforme seu ambiente)

const urlCERT = __ENV.URL_CERT || "https://sincad-register-account-cer.internalenv.azr/api/access-account/v1/register";

console.log(`
=============================================================
INICIANDO TESTE DE CARGA - APENAS API POST
- Total de Participantes: ${TOTAL_PARTICIPANTES}
- Lotes por Participante: ${LOTES_POR_PARTICIPANTE}
- Contas por Lote: ${CONTAS_POR_LOTE}
- Ambiente: ${AMBIENTE}
- Segmento: ${SEGMENTO}
- Usuários Virtuais: ${VUS}
- Iterações por VU: ${ITERATIONS_PER_VU}
- Tempo entre requisições: ${SLEEP_BETWEEN_REQUESTS}s
=============================================================
`);

// ====== MÉTRICAS ======
const postResponseTime = new Trend('post_response_time');
const postSuccessRate = new Rate('post_success_rate');
const successCounter = new Counter('successful_posts');
const failureCounter = new Counter('failed_posts');

// Métrica por participante
const participantTrends = {};
for (let i = 1; i <= TOTAL_PARTICIPANTES; i++) {
    participantTrends[i] = new Trend(`participant_${i}_response_time`);
}

// Função para gerar contas
function generateAccounts(n, participanteId) {
    const accounts = [];
    
    for (let i = 0; i < n; i++) {
        const email = `person${i}_p${participanteId}@example.com`;
        const telefone = `98${6980000 + participanteId * 1000 + i}`;
        
        accounts.push({
            accountNumber: gerarNumeroUnico(),
            fullName: `Pessoa Teste`,
            documentNumber: gerarCPF(),
            birthDate: "1990-10-01",
            politicallyExposedPersonIndicator: "N",
            emancipatedInvestorIndicator: "N",
            accountStatusReasonCode: "6",
            fiscalNature: "I",
            occupation: {
                ocupationCode: 1111,
            },
            assetInformation: {
                annualIncomeValue: "999999,99",
                annualIncomeDate: "2023-01-01",
                financialCapacityValue: "999999,99",
                financialCapacityDate: "2023-01-01",
            },
            treasuryDirect: {
                tdProfileOperatorCode: 1,
                tdCustodyFee: "88,9",
                tdDirectIndicator: "N",
                tdDirectEmailName: null,
            },
            address: {
                postCode: "06322040",
                countrySubDivisionName: "SP",
                townName: "São Paulo",
                districtName: "Bairro Teste",
                streetName: "Rua de Teste",
                buildingNumber: "123",
                addressComplementName: "Apto 123",
            },
            email: {
                emailName: email,
            },
            phone: {
                phoneAreaCodeNumber: 11,
                phoneNumber: telefone,
            },
            legalRepresentative: {
                legalRepresentativeCpf: null,
                legalRepresentativeName: null,
            },
        });
    }
    return accounts;
}

// Função para inicialização, executada uma vez no início do teste
export function setup() {
    // Obter tokens para cada participante
    const tokens = {};
    
    for (let i = 1; i <= TOTAL_PARTICIPANTES; i++) {
        console.log(`Obtendo token para o participante ${i}...`);
        const token = AMBIENTE === "DEV" ? getAccessToken() : getAccessTokenCERT();
        
        if (!token) {
            console.error(`ERRO: Token de acesso para o participante ${i} não foi obtido.`);
        } else {
            console.log(`Token obtido com sucesso para o participante ${i}`);
            tokens[i] = token;
        }
    }
    
    return { tokens };
}

// Opções do teste
export const options = {
    scenarios: {
        load_test: {
            executor: 'per-vu-iterations',
            vus: VUS,
            iterations: ITERATIONS_PER_VU,
            maxDuration: '30m'  // Limitar a duração total
        }
    },
    thresholds: {
        'post_response_time': ['p(95) < 2000'],  // 95% das requisições devem ser mais rápidas que 2s
        'post_success_rate': ['rate>0.9'],        // Taxa de sucesso > 90%
        'http_req_duration': ['p(95) < 3000'],    // 95% das requisições HTTP devem ser mais rápidas que 3s
    },

    setupTimeout: '300s',
};

export default function (data) {
    // Escolher aleatoriamente um participante para esta iteração
    const participanteId = Math.floor(Math.random() * TOTAL_PARTICIPANTES) + 1;
    const tokenAuth = data.tokens[participanteId];
    
    if (!tokenAuth) {
        console.error(`Token de acesso não disponível para o participante ${participanteId}. Pulando.`);
        failureCounter.add(1);
        postSuccessRate.add(0);
        return;
    }
    
    // Headers para a requisição
    const params = {
        headers: {
            'accept': '*/*',
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${tokenAuth}`,
        },
        tags: { participante: `p${participanteId}` }
    };
    
    // Realizar o número definido de envios de lotes para este participante
    for (let lote = 1; lote <= LOTES_POR_PARTICIPANTE; lote++) {
        // Gerar contas para este lote
        const contas = generateAccounts(CONTAS_POR_LOTE, participanteId);
        
        // Criar payload para o lote
        const payload = JSON.stringify({
            data: {
                segmentCode: SEGMENTO,
                participantOperationalCode: participanteId,
                counterAccountCode: COUNTER_ACCOUNT_CODE,
                accounts: contas,
            },
        });
        
        // Registrar início da requisição
        const startTime = new Date().getTime();
        
        console.log(`Participante ${participanteId}: Enviando lote ${lote}/${LOTES_POR_PARTICIPANTE} com ${CONTAS_POR_LOTE} contas...`);
        
        // Enviar a requisição POST
        const response = http.post(AMBIENTE === "DEV" ? urlDEV : urlCERT, payload, params);
        
        // Calcular tempo de resposta
        const endTime = new Date().getTime();
        const responseTime = endTime - startTime;
        
        // Registrar métricas
        postResponseTime.add(responseTime);
        participantTrends[participanteId].add(responseTime);
        
        // Verificar sucesso da requisição
        const success = check(response, {
            'Status 201 Created': (r) => r.status === 201,
            'Resposta contém código de protocolo': (r) => {
                try {
                    const body = JSON.parse(r.body);
                    return body.data && body.data.protocolCode;
                } catch (e) {
                    return false;
                }
            },
        });
        
        // Registrar resultado
        if (success) {
            successCounter.add(1);
            postSuccessRate.add(1);
            
            // Extrair e registrar o código do protocolo
            try {
                const protocoloLote = JSON.parse(response.body).data.protocolCode;
                console.log(`Participante ${participanteId}: Lote ${lote} criado com sucesso - Protocolo: ${protocoloLote}`);
                console.log(`Participante ${participanteId}: Tempo de resposta: ${responseTime}ms`);
            } catch (e) {
                console.error(`Participante ${participanteId}: Erro ao extrair protocolo: ${e.message}`);
            }
        } else {
            failureCounter.add(1);
            postSuccessRate.add(0);
            console.error(`Participante ${participanteId}: Falha ao criar lote ${lote}. Status: ${response.status}, Resposta: ${response.body}`);
        }
        
        // Aguardar entre requisições para evitar sobrecarga
        sleep(SLEEP_BETWEEN_REQUESTS);
    }
}

// Função executada no final do teste
export function teardown(data) {
    console.log(`
=============================================================
RESUMO DO TESTE DE CARGA - APENAS API POST
- Total de Requisições: ${successCounter.value + failureCounter.value}
- Requisições com Sucesso: ${successCounter.value}
- Requisições com Falha: ${failureCounter.value}
- Taxa de Sucesso: ${successCounter.value / (successCounter.value + failureCounter.value) * 100}%
=============================================================
`);
}