# Validador de Pull Request

![Extension Icon](images/extension-icon.png)

## Visão Geral

Esta extensão do Azure DevOps fornece uma task para validação automatizada de código em pull requests utilizando inteligência artificial (OpenAI/Azure OpenAI). A extensão executa uma análise completa do código alterado em um pull request, identifica potenciais problemas e fornece sugestões de melhoria diretamente nos comentários do pull request.

## Características

- **Análise Automática de Código**: Executa análise nos arquivos alterados em pull requests
- **Detecção de Problemas**: Identifica bugs potenciais, vulnerabilidades de segurança, code smells e problemas de performance
- **Comentários Inteligentes**: Adiciona comentários detalhados diretamente no pull request
- **Personalização**: Configure regras e padrões de exclusão específicos para seu projeto
- **Relatórios**: Gera relatórios detalhados que podem ser salvos como artefatos de build
- **Integração**: Funciona perfeitamente com pipelines do Azure DevOps

## Pré-requisitos

- Uma organização Azure DevOps
- Acesso a uma API do OpenAI ou Azure OpenAI
- Permissões para executar pipelines de build

## Instalação

1. Instale esta extensão do [Azure DevOps Marketplace](https://marketplace.visualstudio.com/)
2. Configure um token de acesso pessoal (PAT) com permissões de leitura/escrita em pull requests
3. Configure sua chave de API do OpenAI ou Azure OpenAI

## Configuração

A task pode ser adicionada a qualquer pipeline do Azure DevOps com os seguintes parâmetros:

| Parâmetro | Descrição | Obrigatório |
|-----------|-----------|-------------|
| Caminho do Repositório | O caminho do repositório a ser analisado | Sim |
| Padrões de Exclusão | Padrões glob para excluir arquivos da análise | Não |
| Falhar o build se encontrar problemas | Define se o build deve falhar quando problemas sérios são encontrados | Não |
| Caminho do arquivo de saída | Onde salvar o relatório de análise | Não |
| Token de Acesso do Azure DevOps | Token para autorizar acesso à API | Sim |
| API Key (OpenAI/Azure) | Chave para o serviço de IA | Sim |
| Endpoint da API (Azure OpenAI) | URL do endpoint do Azure OpenAI | Condicional |
| Versão da API (Azure OpenAI) | Versão da API do Azure OpenAI | Condicional |
| Modelo de IA | Nome do modelo ou deployment | Condicional |
| Prompts adicionais | Instruções específicas para a análise | Não |

## Uso em Pipeline YAML

```yaml
steps:
- task: ValidadorPR@0
  displayName: 'Analisar Pull Request'
  inputs:
    repositoryPath: '$(Build.SourcesDirectory)'
    excludePatterns: |
      **/*.md
      **/*.json
      **/*.png
      **/*.jpg
      **/node_modules/**
    failOnIssues: false
    outputFilePath: '$(Build.ArtifactStagingDirectory)/code-review-report.md'
    azure_devops_token: '$(System.AccessToken)'
    api_key: '$(OpenAI.ApiKey)'
    # Para Azure OpenAI (opcional)
    # api_endpoint: '$(AzureOpenAI.Endpoint)'
    # api_version: '2023-05-15'
    # ai_model: 'gpt-deployment'
    additional_prompts: 'Foque em problemas de segurança,Verifique boas práticas em TypeScript'
```

## Arquitetura

Esta extensão foi desenvolvida seguindo os princípios da Arquitetura Limpa (Clean Architecture):

- **Entidades**: Objetos de negócio (CodeIssue, AnalysisReport)
- **Casos de Uso**: Implementam a lógica de negócio (AnalyzeCodeUseCase, ReportPullRequestIssuesUseCase)
- **Interfaces**: Definem contratos para adaptadores (IRepository, ICodeAnalyzer, IFileService, ILogService)
- **Adaptadores**: Implementam as interfaces para acessar recursos externos (AzureDevOpsRepository, OpenAICodeAnalyzer)
- **Controladores**: Coordenam os casos de uso (TaskController)
- **Configuração**: Gerencia dependências e configurações (ConfigService)

## Testando a Extensão

Para testar localmente:

```powershell
cd "caminho-para-extensão\buildandreleasetask"
npm install
npm run build

# Edite o arquivo test-local.js para incluir sua chave de API e outras configurações
node test-local.js
```

Para mais detalhes sobre como testar, consulte o arquivo [como-testar-a-extensao.md](../../como-testar-a-extensao.md).

## Contribuição

Contribuições são bem-vindas! Por favor, siga estas etapas para contribuir:

1. Faça um fork do repositório
2. Crie um branch para sua feature (`git checkout -b feature/sua-feature`)
3. Faça commit de suas mudanças (`git commit -am 'Adiciona nova funcionalidade'`)
4. Faça push para o branch (`git push origin feature/sua-feature`)
5. Crie um Pull Request

## Licença

[Incluir informação de licença]

## Suporte

[Incluir informação de suporte]