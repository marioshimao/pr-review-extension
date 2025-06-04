import { ConsoleLogService } from './adapters/ConsoleLogService';
import { AzureDevOpsRepository } from './adapters/AzureDevOpsRepository';
import { AzureDevOpsRepositoryNew } from './adapters/AzureDevOpsRepositoryNew';
import * as path from 'path';
import * as fs from 'fs';

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

    const logger = new ConsoleLogService();
    
    // Criar instâncias de ambas as classes
    const originalRepo = new AzureDevOpsRepository(
        organization,
        'https://dev.azure.com/', 
        project, 
        repositoryId, 
        accessToken, 
        logger, 
        prId
    );

    const newRepo = new AzureDevOpsRepositoryNew(
        organization,
        'https://dev.azure.com/', 
        project, 
        repositoryId, 
        accessToken, 
        logger, 
        prId
    );

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
        
        if (!fs.existsSync(tempDir1)) fs.mkdirSync(tempDir1, { recursive: true });
        if (!fs.existsSync(tempDir2)) fs.mkdirSync(tempDir2, { recursive: true });
        
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
    } catch (error) {
        console.error('Erro durante os testes:', error);
    }
}

// Executar os testes
testMigration().catch(console.error);
