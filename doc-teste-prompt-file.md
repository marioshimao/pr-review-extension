# Arquivos de teste para validação do carregamento de prompts

Este arquivo serve apenas para testes e documentação do recurso de carregamento de prompts de um arquivo markdown.

## Steps para testar:

1. Adicionar o arquivo `.agl/pr-review.prompt.md` ao repositório
2. Configurar o pipeline para usar o validador de PR
3. Verificar nos logs se o arquivo foi carregado corretamente
4. Confirmar que o conteúdo do arquivo foi utilizado como prompt

## Exemplo de saída esperada nos logs:

```
Lendo arquivo de prompt adicional de: /path/to/repo/.agl/pr-review.prompt.md
Usando conteúdo do arquivo .agl/pr-review.prompt.md como prompt adicional
Conteúdo do prompt carregado com tamanho: 1234 caracteres
```
