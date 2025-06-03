// Script para testar a task localmente
const path = require('path');
const process = require('process');

// Simular variáveis de ambiente do Azure DevOps
process.env.INPUT_REPOSITORYPATH = path.resolve(__dirname, './controllers'); // Pasta do projeto
process.env.INPUT_EXCLUDEPATTERNS = '**/*.md\n**/*.json\n**/*.png\n**/*.jpg\n**/node_modules/**';
process.env.INPUT_FAILONISSUES = 'false';
process.env.INPUT_OUTPUTFILEPATH = path.resolve(__dirname, '../test-report.md');

// Você precisa fornecer sua API key aqui
process.env.INPUT_APIKEY = 'Aoi7JlmnyWlWOGyEP1NvF7DPZkbewtUe5pr1RNmSb8bXbgiTLrueJQQJ99BDACLArgHXJ3w3AAAAACOG9kxv'; 

// Se estiver usando Azure OpenAI, descomente estas linhas e preencha os valores
process.env.INPUT_APIENDPOINT = 'https://aglpesquisaaif6796673640.openai.azure.com/';
process.env.INPUT_APIVERSION = '2025-01-01-preview';
process.env.INPUT_AIMODEL = 'gpt-4o';

process.env.INPUT_ADDITIONALPROMPTS = 'Foque em problemas de segurança,Verifique boas práticas em TypeScript';

// Executar a task
require('./index');
