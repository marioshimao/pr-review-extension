"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const ConsoleLogService_1 = require("./adapters/ConsoleLogService");
const AzureDevOpsRepository_1 = require("./adapters/AzureDevOpsRepository");
const AzureDevOpsRepositoryNew_1 = require("./adapters/AzureDevOpsRepositoryNew");
const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
/**
 * Testa a migração do AzureDevOpsRepository para AzureDevOpsRepositoryNew
 * Este script compara o comportamento das duas implementações
 */
async function testMigration() {
    // Obter variáveis de ambiente
    const organization = process.env.AZURE_DEVOPS_ORG || '';
    const project = process.env.AZURE_DEVOPS_PROJECT || '';
    const repositoryId = process.env.AZURE_DEVOPS_REPO_ID || '';
    const accessToken = process.env.AZURE_DEVOPS_TOKEN || '';
    const prId = parseInt(process.env.AZURE_DEVOPS_PR_ID || '0');
    // Verificar se todas as variáveis necessárias estão definidas
    if (!organization || !project || !repositoryId || !accessToken || !prId) {
        console.error('Por favor, defina todas as variáveis de ambiente necessárias:');
        console.error('AZURE_DEVOPS_ORG, AZURE_DEVOPS_PROJECT, AZURE_DEVOPS_REPO_ID, AZURE_DEVOPS_TOKEN, AZURE_DEVOPS_PR_ID');
        process.exit(1);
    }
    const logger = new ConsoleLogService_1.ConsoleLogService();
    // Criar instâncias de ambas as classes
    const originalRepo = new AzureDevOpsRepository_1.AzureDevOpsRepository(organization, 'https://dev.azure.com/', project, repositoryId, accessToken, logger, prId);
    const newRepo = new AzureDevOpsRepositoryNew_1.AzureDevOpsRepositoryNew(organization, 'https://dev.azure.com/', project, repositoryId, accessToken, logger, prId);
    try {
        // Testar inicialização
        console.log('Inicializando repositórios...');
        console.log('Inicializando AzureDevOpsRepository original...');
        await originalRepo.initialize();
        console.log('Inicializando AzureDevOpsRepositoryNew...');
        await newRepo.initialize();
        console.log('Ambos os repositórios foram inicializados com sucesso.');
        // Testar download de arquivos
        console.log('\nTestando download de arquivos do PR...');
        const tempDir1 = path.join(__dirname, 'temp_original');
        const tempDir2 = path.join(__dirname, 'temp_new');
        if (!fs.existsSync(tempDir1))
            fs.mkdirSync(tempDir1, { recursive: true });
        if (!fs.existsSync(tempDir2))
            fs.mkdirSync(tempDir2, { recursive: true });
        console.log('Baixando arquivos com AzureDevOpsRepository original...');
        const files1 = await originalRepo.downloadPullRequestFiles(tempDir1);
        console.log('Baixando arquivos com AzureDevOpsRepositoryNew...');
        const files2 = await newRepo.downloadPullRequestFiles(tempDir2);
        console.log(`AzureDevOpsRepository: ${files1.length} arquivos baixados`);
        console.log(`AzureDevOpsRepositoryNew: ${files2.length} arquivos baixados`);
        // Testar adição de comentário
        console.log('\nTestando adição de comentário ao PR...');
        console.log('Adicionando comentário com AzureDevOpsRepository original...');
        await originalRepo.addPullRequestComment('[TESTE ORIGINAL] Comentário de teste da migração');
        console.log('Adicionando comentário com AzureDevOpsRepositoryNew...');
        await newRepo.addPullRequestComment('[TESTE NOVO] Comentário de teste da migração');
        console.log('Comentários adicionados com sucesso.');
        console.log('\nTestes concluídos com sucesso!');
    }
    catch (error) {
        console.error('Erro durante os testes:', error);
    }
}
// Executar os testes
testMigration().catch(console.error);
