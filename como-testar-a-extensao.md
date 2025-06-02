# Como Testar a Extensão de Validação de PR

Este guia explica como testar a extensão de validação de pull requests para o Azure DevOps, que utiliza IA (OpenAI/Azure OpenAI) para análise de código.

## Opções para Testar a Extensão

Existem basicamente duas abordagens para testar:

1. **Teste local**: Testar a task localmente para verificar sua funcionalidade básica
2. **Teste em ambiente Azure DevOps**: Publicar a extensão em uma organização e testá-la em um pipeline real

## Passo 1: Compilar a extensão

Primeiro, compilar o código TypeScript para JavaScript:

```powershell
cd "c:\Git\validador-pr\validador-pr-azure-devops\src\validador-pr-task\buildandreleasetask"
npm install
npm run build
```

## Passo 2: Preparar os parâmetros para teste local

O arquivo `test-local.js` já foi criado para simular o ambiente do Azure DevOps. Você precisa editar o arquivo para inserir sua API key:

```javascript
// Script para testar a task localmente
const path = require('path');
const process = require('process');

// Simular variáveis de ambiente do Azure DevOps
process.env.INPUT_REPOSITORYPATH = path.resolve(__dirname, '../../../'); // Pasta do projeto
process.env.INPUT_EXCLUDEPATTERNS = '**/*.md\n**/*.json\n**/*.png\n**/*.jpg\n**/node_modules/**';
process.env.INPUT_FAILONISSUES = 'false';
process.env.INPUT_OUTPUTFILEPATH = path.resolve(__dirname, '../test-report.md');

// Você precisa fornecer sua API key aqui
process.env.INPUT_APIKEY = 'SUA_API_KEY_AQUI'; // Substitua pelo valor real

// Se estiver usando Azure OpenAI, descomente estas linhas e preencha os valores
// process.env.INPUT_APIENDPOINT = 'https://seurecurso.openai.azure.com/';
// process.env.INPUT_APIVERSION = '2023-05-15';
// process.env.INPUT_AIMODEL = 'seu-deployment-name';

process.env.INPUT_ADDITIONALPROMPTS = 'Foque em problemas de segurança,Verifique boas práticas em TypeScript';

// Executar a task
require('./index');
```

## Passo 3: Executar o teste local

Após editar o arquivo `test-local.js` e inserir sua API key, execute o script:

```powershell
cd "c:\Git\validador-pr\validador-pr-azure-devops\src\validador-pr-task\buildandreleasetask"
node test-local.js
```

Isso executará a task localmente e gerará um relatório no caminho especificado.

## Passo 4: Empacotar a extensão para o Azure DevOps

Para testar diretamente no Azure DevOps, você precisará empacotar e publicar a extensão:

```powershell
# Instalar a ferramenta TFX CLI (se ainda não tiver instalado)
npm install -g tfx-cli

# Navegar até a pasta da extensão e empacotá-la
cd "c:\Git\validador-pr\validador-pr-azure-devops\src\validador-pr-task"
tfx extension create --manifest-globs vss-extension.json
```

Isso vai gerar um arquivo VSIX (ex: `MarioKShimao.validador-pr-task-0.1.0.vsix`).

## Passo 5: Publicar a extensão no Azure DevOps (Marketplace)

Para publicar no Azure DevOps e testá-la em um ambiente real:

1. Acesse https://marketplace.visualstudio.com/manage/publishers
2. Crie um publisher se ainda não tiver um
3. Faça o upload do arquivo VSIX gerado 
4. Compartilhe a extensão com a sua organização do Azure DevOps

## Passo 6: Usar a extensão em um pipeline do Azure DevOps

Depois de publicada, você pode usar a task em um pipeline YAML assim:

```yaml
steps:
- task: ValidadorPR@0
  displayName: 'Validar código com IA'
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
    apiKey: '$(OPENAI_API_KEY)' # Use uma variável secreta para a chave da API
    apiEndpoint: '$(AZURE_OPENAI_ENDPOINT)' # Opcional, para Azure OpenAI
    apiVersion: '2023-05-15' # Opcional, para Azure OpenAI
    aiModel: 'gpt-4' # Nome do modelo ou deployment
    additionalPrompts: 'Foque em segurança,Analise boas práticas'
```

## Depuração

Para depuração mais avançada:
- Use o Visual Studio Code com o Node.js debugger
- Configure `launch.json` para executar `test-local.js` e definir breakpoints
- Utilize logs adicionais no código para acompanhar a execução

## Testando em Contexto de Pull Request

Para testar a funcionalidade completa com comentários em PRs:

1. Configure as variáveis de ambiente no script `test-local.js` para simular um PR:
   ```javascript
   // Simular variáveis de ambiente de PR do Azure DevOps
   process.env.SYSTEM_PULLREQUEST_PULLREQUESTID = '123';
   process.env.SYSTEM_TEAMFOUNDATIONCOLLECTIONURI = 'https://dev.azure.com/suaorganizacao';
   process.env.SYSTEM_TEAMPROJECT = 'SeuProjeto';
   process.env.BUILD_REPOSITORY_ID = 'seu-repo-id';
   process.env.SYSTEM_ACCESSTOKEN = 'seu-access-token'; // PAT com permissões adequadas
   ```

2. Execute o script e verifique se os comentários são feitos no PR e se o status do PR é atualizado.
