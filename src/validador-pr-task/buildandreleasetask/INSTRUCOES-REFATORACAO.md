# Instruções para Finalizar a Refatoração

A refatoração para seguir os princípios da Arquitetura Limpa está quase completa. Falta apenas:

## 1. Compilar o código

```bash
cd c:\Git\validador-pr\validador-pr-azure-devops\src\validador-pr-task\buildandreleasetask
npm run build
```

## 2. Substituir o arquivo index.ts original

Após verificar que o novo código compila corretamente, substitua o arquivo `index.ts` pelo novo arquivo `index.new.ts`:

```bash
move /y c:\Git\validador-pr\validador-pr-azure-devops\src\validador-pr-task\buildandreleasetask\index.new.ts c:\Git\validador-pr\validador-pr-azure-devops\src\validador-pr-task\buildandreleasetask\index.ts
```

## 3. Atualizar as importações em outros arquivos se necessário

Certifique-se de que qualquer outro arquivo que importava funcionalidades do arquivo `index.ts` original seja atualizado para usar as novas classes e interfaces.

## Novas Funcionalidades

O código agora segue os princípios da Arquitetura Limpa:

1. **Separação de Responsabilidades**: Cada componente tem uma função específica.
2. **Independência de Frameworks**: A lógica de negócios não depende diretamente de frameworks externos.
3. **Testabilidade**: Cada componente pode ser facilmente testado de forma isolada.
4. **Inversão de Dependência**: As dependências apontam para dentro, não para fora.
5. **Isolamento de Detalhes**: Os detalhes de implementação são isolados em adaptadores.

## Estrutura de Arquivos

```
src/
  validador-pr-task/
    buildandreleasetask/
      index.ts                      # Ponto de entrada que inicializa o controlador
      
      entities/                     # Entidades de negócio
        CodeIssue.ts                # Representa um problema no código
        AnalysisReport.ts           # Relatório completo de análise
        
      usecases/                     # Casos de uso (lógica de negócio)
        AnalyzeCodeUseCase.ts       # Analisa código e encontra problemas
        ReportPullRequestIssuesUseCase.ts # Reporta problemas no PR
      
      interfaces/                   # Interfaces para adaptadores
        IRepository.ts              # Interface para repositório
        ICodeAnalyzer.ts            # Interface para analisador de código
        IFileService.ts             # Interface para manipulação de arquivos
        ILogService.ts              # Interface para logging
      
      adapters/                     # Implementações de adaptadores
        AzureDevOpsRepository.ts    # Implementação do repositório Azure DevOps
        OpenAICodeAnalyzer.ts       # Implementação do analisador usando OpenAI
        FileSystemService.ts        # Implementação do serviço de arquivos
        ConsoleLogService.ts        # Implementação do serviço de log
      
      controllers/                  # Controladores
        TaskController.ts           # Coordena os casos de uso
      
      config/                       # Configuração e injeção de dependências
        ConfigService.ts            # Gerencia configuração e dependências
```
