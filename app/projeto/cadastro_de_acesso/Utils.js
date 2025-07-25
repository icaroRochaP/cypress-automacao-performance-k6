

export function gerarCPF() {
    let cpf = '';
    for (let i = 0; i < 9; i++) {
        cpf += Math.floor(Math.random() * 10).toString();
    }
    
    // Calculando os dígitos verificadores
    const calcularDigito = (cpf, peso) => {
        let soma = 0;
        for (let i = 0; i < cpf.length; i++) {
            soma += parseInt(cpf.charAt(i)) * (peso - i);
        }
        let resto = soma % 11;
        return resto < 2 ? 0 : 11 - resto;
    };

    let digito1 = calcularDigito(cpf, 10);
    let digito2 = calcularDigito(cpf + digito1, 11);
    
    cpf += digito1.toString() + digito2.toString();
    return cpf;
}


export function gerarNumeroUnico(maxDigits = 9) {
    if (maxDigits < 7 || maxDigits > 9) {
        throw new Error('O número de dígitos deve estar entre 7 e 9.');
    }

    const digitsDisponiveis = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];

    // Remover '0' das opções para o primeiro dígito, se maxDigits for pelo menos 1
    const firstDigitOptions = digitsDisponiveis.slice(1);
    const primeiroDigito = firstDigitOptions[Math.floor(Math.random() * firstDigitOptions.length)];
    
    let numero = primeiroDigito;
    let digitsRestantes = digitsDisponiveis.filter(d => d !== primeiroDigito);

    // Garantir que pelo menos 7 dígitos sejam adicionados
    const quantidadeDigitos = Math.floor(Math.random() * (maxDigits - 6)) + 7; // Entre 7 e maxDigits

    for (let i = 1; i < quantidadeDigitos; i++) {
        const indiceAleatorio = Math.floor(Math.random() * digitsRestantes.length);
        const digitoSelecionado = digitsRestantes.splice(indiceAleatorio, 1)[0];
        numero += digitoSelecionado;
    }

    return parseInt(numero, 10);
}