# Utilizando Prompts Personalizados para Revisão de PR

## Visão Geral

O Validador de Pull Request suporta o uso de prompts personalizados através de um arquivo markdown armazenado no seu repositório. Esta funcionalidade permite que você defina instruções específicas para o revisador de código AI sem precisar modificar a configuração da task no seu pipeline.

## Como Configurar

1. Crie um diretório chamado `.agl` na raiz do seu repositório git:

```bash
mkdir .agl
```

2. Crie um arquivo chamado `pr-review.prompt.md` dentro deste diretório:

```bash
touch .agl/pr-review.prompt.md
```

3. Edite o arquivo com suas instruções personalizadas para revisão de código. Exemplo:

```markdown
# Instruções para Revisão de PR

## Objetivo
Você é um revisor especializado em nosso código base que segue as diretrizes específicas do projeto.

## Regras de Validação
- Verifique se o código segue o padrão arquitetural definido
- Identifique possíveis exceções não tratadas
- Valide nomenclatura de acordo com nossos padrões internos
- Analise problemas de segurança específicos da nossa indústria
- Verifique se há código duplicado ou oportunidades de refatoração

## Recomendações
- Recomende melhorias na documentação quando necessário
- Sugira otimizações para performance em operações críticas
- Indique oportunidades para melhorar a testabilidade do código
```

4. Comite e envie este arquivo ao repositório:

```bash
git add .agl/pr-review.prompt.md
git commit -m "Adiciona instruções personalizadas para revisão de PR"
git push
```

## Como Funciona

Quando o Validador de PR é executado, ele verifica automaticamente se o arquivo `.agl/pr-review.prompt.md` existe no repositório. Se encontrado, seu conteúdo é utilizado como prompt principal para instruir a IA durante a análise do código, sobrepondo quaisquer prompts adicionais configurados na task.

## Benefícios

- Mantém as instruções de revisão junto com o código fonte
- Permite versionar e revisar as mudanças nas instruções de análise
- Facilita a customização da revisão sem alterar os pipelines
- Permite instruções específicas por projeto ou repositório

## Notas

- O arquivo markdown pode conter formatações como títulos, listas, e ênfase para melhor estruturação
- Recomenda-se manter o arquivo conciso e focado nas necessidades específicas do projeto
- As instruções devem ser claras e específicas para obter melhores resultados da IA
