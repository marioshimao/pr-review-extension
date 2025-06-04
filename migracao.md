# Plano de Migração: azure-devops-node-api para Classes Personalizadas

Este documento descreve o plano de migração das classes da biblioteca `azure-devops-node-api` para as classes personalizadas criadas na pasta `azureapirest`.

## Visão Geral

A migração envolve substituir as chamadas à API oficial do Azure DevOps (via biblioteca `azure-devops-node-api`) pelo cliente REST personalizado implementado na pasta `azureapirest`. Isso permitirá maior controle sobre as chamadas à API e a possibilidade de implementar funcionalidades específicas.
O cliente REST personalizado utiliza as apis apresentadas na documentação https://learn.microsoft.com/en-us/rest/api/azure/devops/?view=azure-devops-rest-7.2.
Utilizar a documentação https://learn.microsoft.com/en-us/rest/api/azure/devops/?view=azure-devops-rest-7.2 se for necessário realizar alguma alteração nas apis da pasta `azureapirest`.

## Análise das Dependências

### Dependências Atuais
- A classe `AzureDevOpsRepository` utiliza:
  - `azdev` do pacote `azure-devops-node-api`
  - `gitApi` do pacote `azure-devops-node-api/GitApi`
  - `gitInterfaces` do pacote `azure-devops-node-api/interfaces/GitInterfaces`

### Classes Personalizadas Disponíveis
- `AzureDevOpsApiClient`: Cliente base para chamadas REST à API do Azure DevOps
- `GitClient`: Cliente para interagir com repositórios Git
- `PullRequestClient`: Cliente para interagir com Pull Requests
- `WorkItemClient`: Cliente para gerenciar itens de trabalho
- `PipelineClient`: Cliente para interagir com pipelines

## Tarefas de Migração (em ordem de dependência)

### 1. Estudar as Interfaces e Classes
- **Tarefa**: Revisar as interfaces e classes existentes na pasta `azureapirest` e comparar com as usadas da biblioteca `azure-devops-node-api`
- **Dependência**: Nenhuma
- **Objetivo**: Entender as diferenças de API e identificar possíveis lacunas

### 2. Implementar Interfaces Ausentes
- **Tarefa**: Adicionar interfaces adicionais necessárias que existem em `gitInterfaces` mas não estão presentes nas classes personalizadas
- **Dependência**: Tarefa 1
- **Objetivo**: Garantir que todas as interfaces necessárias estejam disponíveis para a migração

### 3. Implementar Métodos Ausentes
- **Tarefa**: Adicionar métodos necessários ao `GitClient` e `PullRequestClient` que existem no `gitApi` mas não estão implementados nas classes personalizadas
- **Dependência**: Tarefa 2
- **Objetivo**: Garantir que toda a funcionalidade necessária esteja disponível

### 4. Implementar Mecanismo de Retry
- **Tarefa**: Adicionar mecanismo de retry com backoff exponencial ao `AzureDevOpsApiClient` similar ao implementado no `AzureDevOpsRepository`
- **Dependência**: Tarefa 1
- **Objetivo**: Manter a mesma resiliência na conexão que existe na implementação atual

### 5. Criar Classe Adaptadora
- **Tarefa**: Criar uma nova versão do `AzureDevOpsRepository` que utilize as classes personalizadas em vez da biblioteca oficial
- **Dependência**: Tarefas 3 e 4
- **Objetivo**: Implementar uma nova classe que mantenha a mesma interface pública, mas utilize as novas classes internamente

### 6. Modificar a Inicialização
- **Tarefa**: Atualizar o método `initialize()` para usar o `AzureDevOpsApiClient` em vez do `azdev.WebApi`
- **Dependência**: Tarefa 5
- **Objetivo**: Substituir a inicialização da conexão com o Azure DevOps

### 7. Migrar a Funcionalidade de PR
- **Tarefa**: Atualizar o método `downloadPullRequestFiles()` para usar o `GitClient` e `PullRequestClient` em vez do `gitApi`
- **Dependência**: Tarefa 6
- **Objetivo**: Substituir as chamadas relacionadas a Pull Requests

### 8. Migrar as Outras Funcionalidades
- **Tarefa**: Atualizar os demais métodos para usar as classes personalizadas
- **Dependência**: Tarefa 7
- **Objetivo**: Concluir a migração de todas as funcionalidades

### 9. Remover Dependência
- **Tarefa**: Remover a dependência `azure-devops-node-api` do `package.json` se não for mais necessária
- **Dependência**: Tarefa 8
- **Objetivo**: Eliminar a dependência após concluir com sucesso a migração

## Considerações Adicionais

### Vantagens da Migração
1. Maior controle sobre as chamadas à API
2. Possibilidade de implementar manipulação de erro personalizada
3. Menor dependência de bibliotecas de terceiros
4. Código mais específico para os casos de uso da aplicação

### Desafios Potenciais
1. Garantir que todas as funcionalidades sejam corretamente implementadas
2. Manter a compatibilidade com a API do Azure DevOps em caso de atualizações
3. Lidar com possíveis diferenças no comportamento entre a biblioteca oficial e a implementação personalizada

## Próximos Passos

Após a migração, considerar a expansão das funcionalidades das classes personalizadas conforme necessário para suportar novos casos de uso.
