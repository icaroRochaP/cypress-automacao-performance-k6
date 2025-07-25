import http from 'k6/http';
import { check, sleep } from 'k6';
import { Trend, Counter, Rate } from 'k6/metrics';
import { getAccessToken, getAccessTokenCERT } from './auth_dinamico.js';
import { gerarCPF, gerarNumeroUnico } from './Utils.js';

// ====== CONFIGURAÇÕES DO PARTICIPANTE VIA VARIÁVEIS DE AMBIENTE ======
const PARTICIPANTE_ID = parseInt(__ENV.PARTICIPANTE_ID || '1');
const COUNTER_ACCOUNT_CODE = __ENV.COUNTER_ACCOUNT_CODE || "26769.00-2";
const PARTICIPANTE_NOME = __ENV.PARTICIPANTE_NOME || `Participante${PARTICIPANTE_ID}`;

// ====== CONFIGURAÇÕES GERAIS ======
const ambienteDeExecucao = __ENV.AMBIENTE || "CERT";
const urlCERT = 'URL_PROJETO';
const urlDEV = 'URL_PROJETO';
const urlConsultaStatusLote = 'URL_PROJETO';
const urlConsultaStatusLoteDEV = 'URL_PROJETO';
const segmento_escolhido = parseInt(__ENV.SEGMENTO || '2');
const quantidadeDeContas = parseInt(__ENV.QTD_CONTAS || '5');
const executarAlteracao = __ENV.ALTERACAO === 'true';



console.log(`
=============================================================
INICIANDO TESTE
- Participante: ${PARTICIPANTE_NOME} (ID: ${PARTICIPANTE_ID})
- Counter Account: ${COUNTER_ACCOUNT_CODE}
- Ambiente: ${ambienteDeExecucao}
- Segmento: ${segmento_escolhido}
- Quantidade de Contas: ${quantidadeDeContas}
- Executar Alteração: ${executarAlteracao}
=============================================================
`);

// ====== MÉTRICAS ======
const envioLoteTrend = new Trend(`tempo_envio_lote_p${PARTICIPANTE_ID}`);
const processoLoteTrend = new Trend(`tempo_processamento_lote_p${PARTICIPANTE_ID}`);
const envioAlteracaoTrend = new Trend(`tempo_envio_alteracao_p${PARTICIPANTE_ID}`);
const processoAlteracaoTrend = new Trend(`tempo_processamento_alteracao_p${PARTICIPANTE_ID}`);
const sucessoLote = new Counter(`lotes_sucesso_p${PARTICIPANTE_ID}`);
const falhaLote = new Counter(`lotes_falha_p${PARTICIPANTE_ID}`);
const sucessoAlteracao = new Counter(`alteracoes_sucesso_p${PARTICIPANTE_ID}`);
const falhaAlteracao = new Counter(`alteracoes_falha_p${PARTICIPANTE_ID}`);
const taxaSucesso = new Rate(`taxa_sucesso_lote_p${PARTICIPANTE_ID}`);
const taxaSucessoAlteracao = new Rate(`taxa_sucesso_alteracao_p${PARTICIPANTE_ID}`);

// Função para gerar contas
function generateAccounts(n, alteracao = false, dadosContas = null) {
    const accounts = [];
    const accountNumbers = [];
    const documentNumbers = [];
    
    for (let i = 0; i < n; i++) {
        // Se for uma alteração, mudamos os dados, por exemplo, o e-mail e telefone
        let email = `person${i}_p${PARTICIPANTE_ID}@example.com`;
        let telefone = `986982245`;

        if (alteracao) {
            // Simulando uma alteração nos dados, como no caso de e-mail e telefone
            email = `alterado_person${i}_p${PARTICIPANTE_ID}@example.com`;
            telefone = `887654321`;
        }
        
        // Geramos um número de conta único e CPF ou usamos os existentes em caso de alteração
        const accountNumber = alteracao ? dadosContas.accountNumbers[i] : gerarNumeroUnico();
        const documentNumber = alteracao ? dadosContas.documentNumbers[i] : gerarCPF();
        
        // Se não for alteração, guardamos o número da conta e CPF para usar depois
        if (!alteracao) {
            accountNumbers.push(accountNumber);
            documentNumbers.push(documentNumber);
        }

        accounts.push({
            accountNumber: accountNumber,
            fullName: `Maximiliano de Souza Oliveira`,
            documentNumber: documentNumber,
            birthDate: "1990-10-01",
            politicallyExposedPersonIndicator: "N",
            emancipatedInvestorIndicator: "N",
            accountStatusReasonCode: "6",
            fiscalNature: "I",
            occupation: {
                ocupationCode: 1111,
            },
            assetInformation: {
                annualIncomeValue: "9999999999,99",
                annualIncomeDate: "2025-01-01",
                financialCapacityValue: "9999999999,99",
                financialCapacityDate: "2025-01-01",
            },
            treasuryDirect: {
                tdProfileOperatorCode: 1,
                tdCustodyFee: "88,9",
                tdDirectIndicator: "N",
                tdDirectEmailName: null,
            },
            address: {
                postCode: "06322040",
                countrySubDivisionName: "AC",
                townName: "Rio Branco do Acre ",
                districtName: "Rio Branco do Acre",
                streetName: "Rio Branco do Acre t",
                buildingNumber: "123456",
                addressComplementName: "Rio Branco do Acr",
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
    return { accounts, accountNumbers, documentNumbers };
}

// Função para inicialização, executada uma vez no início do teste
export function setup() {
    console.log(`${PARTICIPANTE_NOME}: Obtendo token para o participante...`);
    
    const token = ambienteDeExecucao === "DEV" ? getAccessToken() : getAccessTokenCERT();
    
    if (!token) {
        console.error(`ERRO: Token de acesso para ${PARTICIPANTE_NOME} não foi obtido. O teste pode falhar.`);
    } else {
        console.log(`Token obtido com sucesso para ${PARTICIPANTE_NOME}`);
    }
    
    // Exibir modo de execução
    console.log(`Modo de execução: ${executarAlteracao ? 'Com alteração posterior' : 'Apenas envio inicial'}`);
    
    return { token };
}

// Opções do teste
export const options = {
    scenarios: {
        envio_lote: {
            executor: 'per-vu-iterations',
            vus: 1,            // 1 usuário virtual por participante
            iterations: 1,      // Cada VU executará 1 iteração
            maxDuration: '720m'  // Limitar a duração total para evitar testes infinitos
        }
    },
    thresholds: {
        [`http_req_duration{staticTag:envioLote_p${PARTICIPANTE_ID}}`]: ['p(95) < 700'],
        [`http_req_duration{staticTag:consultaLote_p${PARTICIPANTE_ID}}`]: ['p(95) < 500'],
        [`http_req_duration{staticTag:envioAlteracao_p${PARTICIPANTE_ID}}`]: ['p(95) < 700'],
        [`tempo_envio_lote_p${PARTICIPANTE_ID}`]: ['p(95) < 1500'],
        [`tempo_processamento_lote_p${PARTICIPANTE_ID}`]: ['p(95) < 300000'],
        [`tempo_envio_alteracao_p${PARTICIPANTE_ID}`]: ['p(95) < 1500'],
        [`tempo_processamento_alteracao_p${PARTICIPANTE_ID}`]: ['p(95) < 300000'],
        [`taxa_sucesso_lote_p${PARTICIPANTE_ID}`]: ['rate>0.9'],
        [`taxa_sucesso_alteracao_p${PARTICIPANTE_ID}`]: ['rate>0.9'],
        'checks': ['rate>0.95'],
    },
};

export default function (data) {
    // Usar o token obtido na função setup
    const tokenAuth = data.token;

    if (!tokenAuth) {
        console.error(`${PARTICIPANTE_NOME}: Token de acesso não disponível. Encerrando iteração.`);
        falhaLote.add(1);
        taxaSucesso.add(0);
        return;
    }

    console.log(`${PARTICIPANTE_NOME}: Iniciando envio de lote...`);

    // ========== PARTE 1: ENVIO DO LOTE INICIAL ==========
    
    const params = {
        headers: {
            'accept': '*/*',
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${tokenAuth}`,
        },
        tags: { staticTag: `envioLote_p${PARTICIPANTE_ID}` }
    };

    // Iniciar medição do tempo de envio
    const inicioEnvio = new Date().getTime();
    
    // Gerar as contas com os mesmos números para reutilização posterior
    const { accounts: contasIniciais, accountNumbers, documentNumbers } = generateAccounts(quantidadeDeContas, false);
    
    // Guardar os dados das contas para uso na alteração
    const dadosContas = { accountNumbers, documentNumbers };
    
    // Envio do lote inicial
    const payloadInicial = JSON.stringify({
        data: {
            segmentCode: segmento_escolhido,
            participantOperationalCode: PARTICIPANTE_ID,
            counterAccountCode: COUNTER_ACCOUNT_CODE,
            accounts: contasIniciais,
        },
    });
    // Remover isso posteriormente apenas para fins de 
    console.log(`${PARTICIPANTE_NOME}: PAYLOAD LOTE INICIAL:
    ${JSON.stringify({
            data: {
                segmentCode: segmento_escolhido,
                participantOperationalCode: PARTICIPANTE_ID,
                counterAccountCode: COUNTER_ACCOUNT_CODE,
                accounts: contasIniciais.length > 0 ? [contasIniciais[0], '... (truncado para não sobrecarregar o log)'] : [],
            },
        }, null, 2)}
        `);

    let resInicial = http.post(ambienteDeExecucao === "DEV" ? urlDEV : urlCERT, payloadInicial, params);
    
    // Finalizar medição do tempo de envio
    const fimEnvio = new Date().getTime();
    envioLoteTrend.add(fimEnvio - inicioEnvio);
    
    const envioSucesso = check(resInicial, {
        'Lote criado com sucesso': (r) => r.status === 201,
        'Resposta contém código de protocolo': (r) => {
            try {
                const body = JSON.parse(r.body);
                return body.data && body.data.protocolCode;
            } catch (e) {
                return false;
            }
        },
        'Tempo de resposta < 2000ms': (r) => r.timings.duration < 2000,
    });

    console.log(`${PARTICIPANTE_NOME}: Status do envio inicial: ${resInicial.status}`);
    console.log(`${PARTICIPANTE_NOME}: Response body do envio inicial: ${resInicial.body}`);

    if (!envioSucesso || resInicial.status !== 201) {
        console.error(`${PARTICIPANTE_NOME}: Erro ao criar lote inicial. Encerrando.`);
        falhaLote.add(1);
        taxaSucesso.add(0);
        return;
    }

    let protocoloLote;
    try {
        protocoloLote = JSON.parse(resInicial.body).data.protocolCode;
    } catch (e) {
        console.error(`${PARTICIPANTE_NOME}: Erro ao extrair protocolo da resposta:`, e);
        falhaLote.add(1);
        taxaSucesso.add(0);
        return;
    }

    // ========== PARTE 2: AGUARDAR PROCESSAMENTO DO LOTE INICIAL ==========
    
    let inicioProcessamento = new Date().getTime();
    console.log(`${PARTICIPANTE_NOME}: Lote inicial criado - Código do protocolo: ${protocoloLote}`);
    console.log(`${PARTICIPANTE_NOME}: Aguardando processamento do lote inicial...`);

    // Parâmetros para consulta de status
    const paramsConsulta = {
        headers: {
            'accept': '*/*',
            'Authorization': `Bearer ${tokenAuth}`,
        },
        tags: { staticTag: `consultaLote_p${PARTICIPANTE_ID}` }
    };

    let status = 0;
    let maxTentativas = 10000;    // Aumentado para permitir mais tempo de processamento
    let tentativas = 0;
    let tempoEspera = 10;      // Tempo entre consultas em segundos

    while (status !== 7 && tentativas < maxTentativas) {
        sleep(tempoEspera);
        tentativas++;

        // Exponential backoff: aumentar o tempo de espera gradualmente
        if (tentativas > 10) {
            tempoEspera = Math.min(30, tempoEspera * 1.5);
        }

        let resStatus;
        if (ambienteDeExecucao === "DEV") {
             resStatus = http.get(`${urlConsultaStatusLoteDEV}${protocoloLote}`, paramsConsulta);
            console.log(`${PARTICIPANTE_NOME}: Consulta ${tentativas} - API Lote: ${urlConsultaStatusLoteDEV}${protocoloLote}`);
        }else{
             resStatus = http.get(`${urlConsultaStatusLote}${protocoloLote}`, paramsConsulta);
            console.log(`${PARTICIPANTE_NOME}: Consulta ${tentativas} - API Lote: ${urlConsultaStatusLote}${protocoloLote}`);
        }
       
        const statusCheck = check(resStatus, {
            'Consulta de status retorna 200': (r) => r.status === 200,
            'Resposta contém loteStatusCode': (r) => {
                try {
                    const body = JSON.parse(r.body);
                    return body.data && body.data.requestStatus && typeof body.data.requestStatus.loteStatusCode === 'number';
                } catch (e) {
                    return false;
                }
            },
        });

        if (statusCheck && resStatus.status === 200) {
            try {
                let body = JSON.parse(resStatus.body);
                status = body.data.requestStatus.loteStatusCode;
                console.log(`${PARTICIPANTE_NOME}: Tentativa ${tentativas}: Status atual do lote ${protocoloLote} -> ${status}`);
                
                // Verificar se houve erro no processamento
                if ([4].includes(status)) { // Códigos de erro comuns (ajuste conforme necessário)
                    console.error(`${PARTICIPANTE_NOME}: Erro no processamento do lote inicial. Status: ${status}`);
                    falhaLote.add(1);
                    taxaSucesso.add(0);
                    break;
                }
            } catch (e) {
                console.warn(`${PARTICIPANTE_NOME}: Erro ao analisar resposta: ${e.message}`);
            }
        } else {
            console.warn(`${PARTICIPANTE_NOME}: Erro ao consultar status do lote inicial. Tentativa ${tentativas}`);
        }
    }

    let fimProcessamento = new Date().getTime();
    let tempoProcessamento = fimProcessamento - inicioProcessamento;
    processoLoteTrend.add(tempoProcessamento);
    
    if (status === 7) {
        console.log(`${PARTICIPANTE_NOME}: Lote inicial ${protocoloLote} processado com sucesso em ${tempoProcessamento/1000} segundos.`);
        sucessoLote.add(1);
        taxaSucesso.add(1);
        
        // Verificar se deve executar a alteração
        if (!executarAlteracao) {
            console.log(`${PARTICIPANTE_NOME}: Parâmetro de alteração não ativado. Finalizando teste após processamento do lote inicial.`);
            return;
        }
        
        // ========== PARTE 3: ENVIAR ALTERAÇÃO DAS CONTAS ==========
        console.log(`${PARTICIPANTE_NOME}: Iniciando processo de alteração das mesmas contas...`);
        
        // Criar contas com os mesmos números e CPFs, mas com e-mail e telefone alterados
        const { accounts: contasAlteradas } = generateAccounts(quantidadeDeContas, true, dadosContas);
        
        // Configurar parâmetros para o envio da alteração
        const paramsAlteracao = {
            headers: {
                'accept': '*/*',
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${tokenAuth}`,
            },
            tags: { staticTag: `envioAlteracao_p${PARTICIPANTE_ID}` }
        };
        
        // Iniciar medição do tempo de envio da alteração
        const inicioEnvioAlteracao = new Date().getTime();
        
        // Enviar o lote de alteração
        const payloadAlteracao = JSON.stringify({
            data: {
                segmentCode: segmento_escolhido,
                participantOperationalCode: PARTICIPANTE_ID,
                counterAccountCode: COUNTER_ACCOUNT_CODE,
                accounts: contasAlteradas,
            },
        });
        
        let resAlteracao = http.post(ambienteDeExecucao === "DEV" ? urlDEV : urlCERT, payloadAlteracao, paramsAlteracao);
        
        // Finalizar medição do tempo de envio da alteração
        const fimEnvioAlteracao = new Date().getTime();
        envioAlteracaoTrend.add(fimEnvioAlteracao - inicioEnvioAlteracao);
        
        const envioAlteracaoSucesso = check(resAlteracao, {
            'Alteração enviada com sucesso': (r) => r.status === 201,
            'Resposta da alteração contém código de protocolo': (r) => {
                try {
                    const body = JSON.parse(r.body);
                    return body.data && body.data.protocolCode;
                } catch (e) {
                    return false;
                }
            },
            'Tempo de resposta da alteração < 2000ms': (r) => r.timings.duration < 2000,
        });
        
        console.log(`${PARTICIPANTE_NOME}: Status do envio da alteração: ${resAlteracao.status}`);
        console.log(`${PARTICIPANTE_NOME}: Response body da alteração: ${resAlteracao.body}`);
        
        if (!envioAlteracaoSucesso || resAlteracao.status !== 201) {
            console.error(`${PARTICIPANTE_NOME}: Erro ao enviar alteração das contas. Encerrando.`);
            falhaAlteracao.add(1);
            taxaSucessoAlteracao.add(0);
            return;
        }
        
        let protocoloAlteracao;
        try {
            protocoloAlteracao = JSON.parse(resAlteracao.body).data.protocolCode;
        } catch (e) {
            console.error(`${PARTICIPANTE_NOME}: Erro ao extrair protocolo da alteração:`, e);
            falhaAlteracao.add(1);
            taxaSucessoAlteracao.add(0);
            return;
        }
        
        // ========== PARTE 4: AGUARDAR PROCESSAMENTO DA ALTERAÇÃO ==========
        
        let inicioProcessamentoAlteracao = new Date().getTime();
        console.log(`${PARTICIPANTE_NOME}: Lote de alteração criado - Código do protocolo: ${protocoloAlteracao}`);
        console.log(`${PARTICIPANTE_NOME}: Aguardando processamento da alteração...`);
        
        // Reiniciar variáveis para monitorar o status da alteração
        status = 0;
        tentativas = 0;
        tempoEspera = 10;
        
        while (status !== 7 && tentativas < maxTentativas) {
            sleep(tempoEspera);
            tentativas++;
            
            // Exponential backoff: aumentar o tempo de espera gradualmente
            if (tentativas > 10) {
                tempoEspera = Math.min(30, tempoEspera * 1.5);
            }
            
           
            let resStatusAlteracao;
            if (ambienteDeExecucao === "DEV") {
                resStatusAlteracao = http.get(`${urlConsultaStatusLoteDEV}${protocoloLote}`, paramsConsulta);
                console.log(`${PARTICIPANTE_NOME}: Consulta ${tentativas} - API Lote: ${urlConsultaStatusLoteDEV}${protocoloLote}`);
            }else{
                resStatusAlteracao = http.get(`${urlConsultaStatusLote}${protocoloLote}`, paramsConsulta);
                console.log(`${PARTICIPANTE_NOME}: Consulta ${tentativas} - API Lote: ${urlConsultaStatusLote}${protocoloLote}`);
            }
            
           
            
            const statusCheckAlteracao = check(resStatusAlteracao, {
                'Consulta de status da alteração retorna 200': (r) => r.status === 200,
                'Resposta contém loteStatusCode da alteração': (r) => {
                    try {
                        const body = JSON.parse(r.body);
                        return body.data && body.data.requestStatus && typeof body.data.requestStatus.loteStatusCode === 'number';
                    } catch (e) {
                        return false;
                    }
                },
            });
            
            if (statusCheckAlteracao && resStatusAlteracao.status === 200) {
                try {
                    let body = JSON.parse(resStatusAlteracao.body);
                    status = body.data.requestStatus.loteStatusCode;
                    console.log(`${PARTICIPANTE_NOME}: Tentativa ${tentativas}: Status atual da alteração ${protocoloAlteracao} -> ${status}`);
                    
                    // Verificar se houve erro no processamento da alteração
                    if ([4].includes(status)) { // Códigos de erro comuns (ajuste conforme necessário)
                        console.error(`${PARTICIPANTE_NOME}: Erro no processamento da alteração. Status: ${status}`);
                        falhaAlteracao.add(1);
                        taxaSucessoAlteracao.add(0);
                        break;
                    }
                } catch (e) {
                    console.warn(`${PARTICIPANTE_NOME}: Erro ao analisar resposta da alteração: ${e.message}`);
                }
            } else {
                console.warn(`${PARTICIPANTE_NOME}: Erro ao consultar status da alteração. Tentativa ${tentativas}`);
            }
        }
        
        let fimProcessamentoAlteracao = new Date().getTime();
        let tempoProcessamentoAlteracao = fimProcessamentoAlteracao - inicioProcessamentoAlteracao;
        processoAlteracaoTrend.add(tempoProcessamentoAlteracao);
        
        if (status === 7) {
            console.log(`${PARTICIPANTE_NOME}: Alteração ${protocoloAlteracao} processada com sucesso em ${tempoProcessamentoAlteracao/1000} segundos.`);
            sucessoAlteracao.add(1);
            taxaSucessoAlteracao.add(1);
            
            // Exibir resultados comparativos
            console.log(`
====== RESULTADOS COMPARATIVOS PARA ${PARTICIPANTE_NOME} ======
Tempo de processamento do lote inicial: ${tempoProcessamento/1000} segundos
Tempo de processamento da alteração: ${tempoProcessamentoAlteracao/1000} segundos
Diferença: ${Math.abs(tempoProcessamentoAlteracao - tempoProcessamento)/1000} segundos
            `);
        } else {
            console.warn(`${PARTICIPANTE_NOME}: Tempo limite atingido. A alteração ${protocoloAlteracao} ainda não foi processada após ${tempoProcessamentoAlteracao/1000} segundos.`);
            falhaAlteracao.add(1);
            taxaSucessoAlteracao.add(0);
        }
        
    } else {
        console.warn(`${PARTICIPANTE_NOME}: Tempo limite atingido. O lote inicial ${protocoloLote} ainda não foi processado após ${tempoProcessamento/1000} segundos. Não será possível testar a alteração.`);
        falhaLote.add(1);
        taxaSucesso.add(0);
    }
    
    // Espera antes da próxima iteração para evitar sobrecarga
    sleep(5);
}