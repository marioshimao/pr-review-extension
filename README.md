# Validador de Pull Request para Azure DevOps

Este projeto fornece uma extensão para Azure DevOps que automatiza a validação de Pull Requests utilizando inteligência artificial (OpenAI/Azure OpenAI), com o objetivo de melhorar a qualidade do código e eliminar más práticas. A extensão identifica problemas comuns, aplica boas práticas e ajuda a manter um alto padrão de código durante todo o ciclo de desenvolvimento.

## Visão Geral

A extensão executa uma análise completa do código alterado em um pull request, identifica potenciais problemas e fornece sugestões de melhoria diretamente nos comentários do pull request. Utilizando modelos avançados de IA, a extensão consegue identificar uma ampla variedade de problemas de código, incluindo:

- Bugs potenciais e lógica incorreta
- Vulnerabilidades de segurança
- Problemas de performance
- Code smells e dívida técnica
- Desvios de padrões e boas práticas

## Estrutura do Projeto

```
src/
  validador-pr-task/               # Extensão do Azure DevOps
    buildandreleasetask/           # Task para pipeline
      adapters/                    # Implementações de interfaces
      config/                      # Configuração da aplicação
      controllers/                 # Controladores
      entities/                    # Entidades de negócio
      interfaces/                  # Contratos da aplicação
      usecases/                    # Casos de uso da aplicação
    images/                        # Recursos visuais
    vss-extension.json             # Definição da extensão
```

## Principais Componentes

- **TaskController**: Coordena o fluxo geral da task
- **AnalyzeCodeUseCase**: Gerencia a lógica de análise de código
- **ReportPullRequestIssuesUseCase**: Gerencia a criação de comentários no PR
- **OpenAICodeAnalyzer**: Conecta-se à API OpenAI/Azure OpenAI para análise
- **AzureDevOpsRepository**: Interage com as APIs do Azure DevOps

## Instalação e Uso

Consulte o arquivo [README da extensão](src/validador-pr-task/README.md) para instruções detalhadas sobre instalação, configuração e uso.

## Testando

Consulte o arquivo [como-testar-a-extensao.md](como-testar-a-extensao.md) para instruções sobre como testar a extensão localmente e no Azure DevOps.

## Desenvolvendo

O código foi desenvolvido seguindo os princípios da Arquitetura Limpa (Clean Architecture). Para mais informações sobre a estrutura e design da aplicação, consulte o arquivo [INSTRUCOES-REFATORACAO.md](src/validador-pr-task/buildandreleasetask/INSTRUCOES-REFATORACAO.md).

## Contribuição

Contribuições são bem-vindas! Por favor, siga estas etapas para contribuir:

1. Faça um fork do repositório
2. Crie um branch para sua feature (`git checkout -b feature/sua-feature`)
3. Faça commit de suas mudanças (`git commit -am 'Adiciona nova funcionalidade'`)
4. Faça push para o branch (`git push origin feature/sua-feature`)
5. Crie um Pull Request

## Licença

[Incluir informação de licença]
