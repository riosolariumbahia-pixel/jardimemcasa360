
Objetivo: corrigir o Diagnóstico por Foto no celular sem trocar a UX atual, garantindo que a análise execute com a mesma confiabilidade do desktop.

1. Diagnóstico da causa raiz
- O fluxo atual da tela `/diagnostico-ia` envia a imagem inteira em base64 direto do navegador para a função `ai-chat`.
- Em celular, fotos da câmera costumam vir muito maiores que no desktop, então o payload fica pesado e mais sujeito a falha de rede, timeout ou interrupção.
- Além disso, o parser de resposta em `DiagnosisAIPage.tsx` está mais frágil que o usado no chat e em Percepções: ele ignora linhas de keep-alive/controle e pode perder chunks quebrados em conexões móveis instáveis.
- Os dados disponíveis confirmam que o backend funciona e grava análises; o problema é de robustez do fluxo mobile, não do modelo em si.

2. Correção proposta
- Manter as duas opções atuais:
  - Tirar foto
  - Selecionar da galeria
- Antes de analisar, processar a imagem no cliente:
  - corrigir orientação
  - redimensionar para tamanho seguro para mobile
  - recomprimir para JPG/WebP com qualidade controlada
- Trocar o envio “imagem gigante em base64 original” por “imagem otimizada”.
- Fortalecer o parser SSE da página de diagnóstico para usar o mesmo padrão resiliente já usado em `AssistantPage.tsx`.
- Melhorar tratamento de erro para diferenciar:
  - falha de upload/processamento
  - falha de conexão
  - resposta inválida da IA
- Manter preview, remover/trocar imagem e loading.

3. Arquivos a ajustar
- `src/pages/DiagnosisAIPage.tsx`
  - extrair utilitário local de preparo da imagem
  - comprimir/redimensionar antes do `fetch`
  - usar token da sessão do usuário quando existir, em vez de depender sempre da chave pública no header
  - reaproveitar lógica de parsing de stream mais tolerante
  - adicionar mensagens de erro específicas para celular
- Opcionalmente criar utilitário compartilhado, se ficar limpo:
  - `src/lib/imageProcessing.ts`

4. Fluxo novo
```text
Usuário escolhe foto
→ app valida formato/tamanho bruto
→ app otimiza imagem para uso da IA
→ preview continua visível
→ app envia payload reduzido
→ parser lê stream com tolerância a chunks parciais
→ resultado aparece e é salvo no backend
```

5. Regras de implementação
- Limitar dimensão máxima da imagem para análise, por exemplo 1280–1600 px no maior lado.
- Reduzir qualidade para um nível seguro sem prejudicar diagnóstico.
- Se a imagem não puder ser processada, mostrar:
  - “Não consegui preparar a foto para análise. Tente outra imagem.”
- Se a análise falhar no celular, mostrar:
  - “Não consegui analisar sua planta agora. Tente novamente com uma foto mais nítida e próxima.”
- Não mudar a estrutura visual principal da página.

6. Sobre a sugestão de fila/background
- Eu não recomendo começar por arquitetura de fila agora.
- Pelo código atual, o backend responde normalmente e o maior risco real está no envio/parse da imagem no celular.
- A fila só faria sentido se, depois dessa correção, ainda houver timeout consistente no backend com imagens já otimizadas.

7. Validação que farei na implementação
- Testar fluxo com:
  - câmera no celular
  - galeria no celular
  - upload no desktop
- Confirmar:
  - preview aparece
  - botão analisar funciona
  - loading encerra corretamente
  - resultado é exibido
  - análise continua sendo salva em `analises_imagem`
- Verificar se erros deixam de ocorrer em conexões móveis mais lentas.

8. Detalhes técnicos
- Hoje a página usa `FileReader.readAsDataURL()` e envia a imagem original; isso infla bastante o tamanho do request.
- O stream da função `ai-chat` inclui linhas de controle e pode quebrar JSON entre chunks; o parser do diagnóstico precisa tratar isso como os outros chats já fazem.
- Se houver sessão autenticada, o ideal é buscar `supabase.auth.getSession()` e enviar o access token real no header Authorization.
- A correção é localizada no frontend e não exige mudança obrigatória no backend para esta etapa.
