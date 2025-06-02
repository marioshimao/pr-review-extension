// Script para testar a task localmente
const path = require('path');
const process = require('process');

// Simular variáveis de ambiente do Azure DevOps
process.env.INPUT_REPOSITORYPATH = path.resolve(__dirname, '../../../'); // Pasta do projeto
process.env.INPUT_EXCLUDEPATTERNS = '**/*.md\n**/*.json\n**/*.png\n**/*.jpg\n**/node_modules/**';
process.env.INPUT_FAILONISSUES = 'false';
process.env.INPUT_OUTPUTFILEPATH = path.resolve(__dirname, '../test-report.md');

// Você precisa fornecer sua API key aqui
process.env.INPUT_API_KEY = 'SUA_API_KEY_AQUI'; 

// Se estiver usando Azure OpenAI, descomente estas linhas e preencha os valores
// process.env.INPUT_API_ENDPOINT = 'https://seurecurso.openai.azure.com/';
// process.env.INPUT_API_VERSION = '2023-05-15';
// process.env.INPUT_AI_MODEL = 'seu-deployment-name';

process.env.INPUT_ADDITIONAL_PROMPTS = 'Foque em problemas de segurança,Verifique boas práticas em TypeScript';

// Executar a task
require('./index');
