# Extensão de domínio — JavaScript/Node genérico

Além do núcleo, verifique:
- divisão por zero ou denominador potencialmente zero sem checagem
- operação sobre array/coleção vazia (média, redução, índice) sem tratamento
- `NaN`/`undefined`/`null` retornado silenciosamente em vez de erro/validação
- tipos de entrada não validados quando a função recebe dado externo
- ausência de teste cobrindo o edge case acima, em função nova ou alterada
- exceção não tratada em código assíncrono