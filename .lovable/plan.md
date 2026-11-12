# Reativar o servidor do app

## Diagnóstico (confirmado)
O banco de dados e o login do app estão **pausados** (inativos por falta de uso). Por isso o login mostra "Failed to fetch". O servidor não foi apagado; seus dados continuam guardados. Nada no código precisa mudar.

## Passos
1. Reativar o servidor (Lovable Cloud) — leva alguns minutos.
2. Checar o status até ficar ativo e saudável.
3. Confirmar que o login responde (teste de entrar na tela de login).
4. Se continuar falhando depois de ativo, reiniciar o servidor uma vez e checar de novo.

## Como testar depois
- Abra o app, faça login com sua conta. Deve entrar direto em "Meu Jardim".
- No Vercel, não precisa refazer o deploy: as mesmas chaves continuam válidas.
