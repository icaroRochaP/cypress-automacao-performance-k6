# lst-sincad-automacao-performace

```
 ______     ______               ___           _       
|_   _ \   / ____ `.           .'   `.        / \      
  | |_) |  `'  __) |  ______  /  .-.  \      / _ \     
  |  __'.  _  |__ '. |______| | |   | |     / ___ \    
 _| |__) || \____) |          \  `-'  \_  _/ /   \ \_  
|_______/  \______.'           `.___.\__||____| |____


```
> [!NOTE]  
> A documentação completa pode ser encontrada em [docs/index.md](https://github.com/b3sa/lst-sincadcloud-automacao-performace/blob/develop/docs/index.md)



> [!NOTE] 
## Instrução
> Como executar o script de cadastro de acesso



> k6 run -e PARTICIPANTE_ID=COD_PARTICIPANTE -e COUNTER_ACCOUNT_CODE="NUMERO_CONTA_PROPRIA" -e PARTICIPANTE_NOME="Participante999" -e AMBIENTE="CERT" -e ALTERACAO=true .\cadastro_de_acesso_paralelo.js

> Exemplo prático de execução no ambiente de DEV

>Participante 999
>k6 run -e PARTICIPANTE_ID=999 -e COUNTER_ACCOUNT_CODE="26769.00-2" -e PARTICIPANTE_NOME="Participante999" -e AMBIENTE="DEV" -e ALTERACAO=true .\cadastro_de_acesso_paralelo.js


>PARTICIPANTE_ID = Obrigatório
>COUNTER_CODE = Obrigatório apenas se segmento igual a 1 ou 3
>PARTICIPANTE_NOME= Opcional
>AMBIENTE= Obrigatório
>ALTERACAO = Opcional, se você quiser simular uma alteração de algum lote que enviou para cadastro