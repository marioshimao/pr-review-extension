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
const tl = __importStar(require("azure-pipelines-task-lib/task"));
const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
const openai_1 = require("openai");
const repositoryAzureDevops_1 = require("./repositoryAzureDevops");
async function run() {
    try {
        // Recuperar os inputs da task
        const repositoryPath = tl.getPathInput('repositoryPath', true, true);
        const excludePatterns = tl.getDelimitedInput('excludePatterns', '\n', false);
        const failOnIssues = tl.getBoolInput('failOnIssues', false);
        const outputFilePath = tl.getInput('outputFilePath', false) || '';
        const apiKey = tl.getInput('api_key', true);
        const azureApiEndpoint = tl.getInput('api_endpoint', false);
        const azureApiVersion = tl.getInput('api_version', false);
        const azureModelDeployment = tl.getInput('ai_model', false);
        const prompt = tl.getInput('additional_prompts', false)?.split(',');
        console.info(`azureApiEndpoint: ${azureApiEndpoint}`);
        console.info(`azureApiVersion: ${azureApiVersion}`);
        console.info(`azureModelDeployment: ${azureModelDeployment}`);
        console.info(`Prompts adicionais: ${prompt}`);
        console.log(`Analisando código em: ${repositoryPath}`);
        console.log(`Padrões de exclusão: ${excludePatterns.join(', ')}`);
        // Configurar as variáveis de ambiente para OpenAI
        process.env.OPENAI_API_KEY = apiKey;
        process.env.AZURE_OPENAI_API_KEY = apiKey;
        process.env.AZURE_OPENAI_ENDPOINT = azureApiEndpoint;
        process.env.AZURE_OPENAI_API_VERSION = azureApiVersion;
        process.env.AZURE_OPENAI_DEPLOYMENT_NAME = azureModelDeployment;
        // Inicializar o repositório do Azure DevOps (se disponível)
        const repository = await initializeRepository();
        let filesToAnalyze = [];
        // Se estamos em um contexto de Pull Request e o repositório foi inicializado com sucesso
        if (repository && tl.getVariable('System.PullRequest.PullRequestId')) {
            console.log('Detectado contexto de Pull Request. Baixando arquivos alterados...');
            // Criar um diretório temporário para os arquivos do PR
            const prFilesDir = path.join(repositoryPath, '.pr_files_temp');
            // Baixar os arquivos alterados no PR
            filesToAnalyze = await repository.downloadPullRequestFiles(prFilesDir, 
            // Converter padrões de exclusão para inclusão (negando-os)
            excludePatterns.length > 0
                ? excludePatterns.map(pattern => `!${pattern}`)
                : undefined);
            console.log(`Baixados ${filesToAnalyze.length} arquivos do PR para análise.`);
        }
        else {
            // Caso não seja um PR ou não tenha sido possível inicializar o repositório,
            // use a abordagem padrão de busca local de arquivos
            console.log('Usando busca local de arquivos...');
            filesToAnalyze = findFiles(repositoryPath, excludePatterns);
        }
        console.log(`Encontrados ${filesToAnalyze.length} arquivos para análise.`);
        // Analisar os arquivos e encontrar problemas
        const codeIssues = await analyzeFiles(filesToAnalyze);
        // Criar relatório
        let report = '# Relatório de Análise de Código\n\n';
        if (codeIssues.length === 0) {
            report += '✅ Todas as melhores práticas e regras foram seguidas.\n';
        }
        else {
            report += `## Problemas Encontrados (${codeIssues.length})\n\n`;
            codeIssues.forEach(issue => {
                report += `- **[${issue.file}:${issue.line}]** ${issue.message}\n`;
            });
        }
        // Salvar o relatório
        if (outputFilePath) {
            const folder = path.dirname(outputFilePath);
            if (!fs.existsSync(folder)) {
                fs.mkdirSync(folder, { recursive: true });
            }
            fs.writeFileSync(outputFilePath, report);
            console.log(`Relatório salvo em: ${outputFilePath}`);
        }
        // Exibir informações no console
        console.log(`\n${report}`);
        // Se estamos em um contexto de PR e temos o repositório configurado, adicionar comentários
        if (repository && tl.getVariable('System.PullRequest.PullRequestId')) {
            try {
                console.log('Adicionando comentários ao PR...');
                // Adicionar comentário resumo ao PR
                await repository.addPullRequestComment(report);
                // Adicionar comentários em linha para cada problema
                for (const issue of codeIssues) {
                    // Extrair o caminho relativo ao repositório
                    const relativeFilePath = path.relative(repositoryPath, issue.file);
                    // Comentar no arquivo específico e linha
                    await repository.addPullRequestComment(issue.message, relativeFilePath, issue.line);
                }
                // Definir o status do PR baseado nos problemas encontrados
                if (codeIssues.length > 0) {
                    if (failOnIssues) {
                        await repository.setPullRequestStatus('rejected', `Encontrados ${codeIssues.length} problemas que precisam ser corrigidos.`);
                    }
                    else {
                        await repository.setPullRequestStatus('waiting', `Encontrados ${codeIssues.length} problemas que precisam de atenção.`);
                    }
                }
                else {
                    await repository.setPullRequestStatus('approved', 'Nenhum problema encontrado na análise de código.');
                }
                console.log('Comentários adicionados ao PR com sucesso.');
            }
            catch (commentError) {
                console.warn(`Erro ao adicionar comentários ao PR: ${commentError.message}`);
                // Não falhar o build por causa disso
            }
        }
        // Decidir se deve falhar o build
        if (failOnIssues && codeIssues.length > 0) {
            tl.setResult(tl.TaskResult.Failed, `Encontrados ${codeIssues.length} problemas no código.`);
            return;
        }
        tl.setResult(tl.TaskResult.Succeeded, 'Análise de código concluída com sucesso.');
    }
    catch (err) {
        tl.setResult(tl.TaskResult.Failed, err.message);
    }
}
/**
 * Encontra arquivos em um diretório usando padrões glob
 * @param rootPath Diretório raiz para busca
 * @param excludePatterns Padrões glob para exclusão
 * @returns Array com caminhos completos dos arquivos encontrados
 */
function findFiles(rootPath, excludePatterns) {
    try {
        // Usar azure-pipelines-task-lib para buscar arquivos com glob patterns
        const includePattern = '**/*.*';
        // Adicionar /** ao final dos padrões de exclusão, se necessário
        const normalizedExcludePatterns = excludePatterns.map(pattern => {
            // Se o padrão já termina com *, não adicionar /**
            if (pattern.endsWith('*')) {
                return pattern;
            }
            // Se o padrão é um diretório (termina com /), adicionar **
            if (pattern.endsWith('/')) {
                return `${pattern}**`;
            }
            // Caso contrário, não modificar
            return pattern;
        });
        console.log(`Buscando arquivos: ${includePattern}`);
        console.log(`Excluindo padrões: ${normalizedExcludePatterns.join(', ')}`); // Buscar arquivos baseados nos padrões
        const matchedFiles = tl.findMatch(rootPath, [includePattern], {
            followSpecifiedSymbolicLink: true,
            followSymbolicLinks: true,
            allowBrokenSymbolicLinks: false
        });
        // Filtrar diretórios e arquivos excluídos
        const files = matchedFiles.filter(file => {
            try {
                // Verificar se é um arquivo
                if (!fs.statSync(file).isFile()) {
                    return false;
                }
                // Verificar se o arquivo deve ser excluído pelos padrões
                if (normalizedExcludePatterns.length > 0) {
                    const relativePath = path.relative(rootPath, file).replace(/\\/g, '/');
                    for (const pattern of normalizedExcludePatterns) {
                        if (tl.match([relativePath], pattern).length > 0) {
                            console.log(`Excluindo arquivo por padrão: ${file} (padrão: ${pattern})`);
                            return false;
                        }
                    }
                }
                return true;
            }
            catch (error) {
                return false;
            }
        });
        console.log(`Encontrados ${files.length} arquivos após aplicar filtros.`);
        return files;
    }
    catch (error) {
        console.warn(`Erro ao buscar arquivos: ${error.message}`);
        return [];
    }
}
// Função para analisar arquivos com OpenAI
async function analyzeFiles(files) {
    const issues = [];
    try {
        // Configurar cliente OpenAI
        const openai = process.env.OPENAI_API_KEY
            ? new openai_1.OpenAI({ apiKey: process.env.OPENAI_API_KEY })
            : new openai_1.AzureOpenAI({
                apiKey: process.env.AZURE_OPENAI_API_KEY,
                endpoint: process.env.AZURE_OPENAI_ENDPOINT,
                apiVersion: process.env.AZURE_OPENAI_API_VERSION,
            });
        console.log('Cliente OpenAI configurado. Analisando arquivos...');
        // Processar cada arquivo
        for (const file of files) {
            try {
                // Verificar se o arquivo existe
                if (!fs.existsSync(file)) {
                    console.warn(`Arquivo não encontrado: ${file}`);
                    continue;
                }
                // Ler o conteúdo do arquivo
                const fileContent = fs.readFileSync(file, 'utf8');
                // Limitar o tamanho do arquivo para evitar exceder tokens
                const truncatedContent = fileContent.length > 10000
                    ? fileContent.substring(0, 10000) + "... (conteúdo truncado)"
                    : fileContent;
                console.log(`Analisando arquivo: ${file}`);
                // Implementar retry com exponential backoff
                const maxRetries = 3;
                let retryCount = 0;
                let success = false;
                while (!success && retryCount < maxRetries) {
                    try {
                        // Enviar para análise
                        const response = await openai.chat.completions.create({
                            model: process.env.AZURE_OPENAI_DEPLOYMENT_NAME || "gpt-4",
                            messages: [
                                {
                                    role: "system",
                                    content: "Você é um especialista em revisão de código. Analise o código a seguir e identifique problemas de segurança, performance, boas práticas e manutenibilidade. Formate a saída em JSON com os campos 'line', 'message' e 'severity' (high, medium, low)."
                                },
                                {
                                    role: "user",
                                    content: `Arquivo: ${file}\n\nConteúdo:\n${truncatedContent}`
                                }
                            ],
                            temperature: 0.1,
                            max_tokens: 1500,
                        });
                        // Processar a resposta
                        if (response.choices[0]?.message?.content) {
                            // Extrair resultados do formato JSON
                            try {
                                const analysisContent = response.choices[0].message.content;
                                const analysisResults = JSON.parse(analysisContent);
                                if (Array.isArray(analysisResults)) {
                                    // Adicionar cada problema encontrado à lista de issues
                                    analysisResults.forEach(issue => {
                                        issues.push({
                                            file: file,
                                            line: issue.line || 0,
                                            message: `[${issue.severity || 'info'}] ${issue.message}`
                                        });
                                    });
                                }
                            }
                            catch (error) {
                                // Se falhar ao processar como JSON, tentar extrair informações do texto
                                const parseError = error;
                                console.warn(`Falha ao processar resposta como JSON: ${parseError.message}`);
                                issues.push({
                                    file: file,
                                    line: 1,
                                    message: `Não foi possível analisar este arquivo em formato estruturado. Resultado raw: ${response.choices[0]?.message?.content?.substring(0, 200) || ''}...`
                                });
                            }
                        }
                        success = true;
                    }
                    catch (apiError) {
                        retryCount++;
                        // Implementar backoff exponencial
                        const delay = Math.pow(2, retryCount) * 1000;
                        console.warn(`Tentativa ${retryCount}/${maxRetries} falhou. Tentando novamente em ${delay}ms. Erro: ${apiError.message}`);
                        // Esperar antes de tentar novamente
                        await new Promise(resolve => setTimeout(resolve, delay));
                    }
                }
                if (!success) {
                    issues.push({
                        file: file,
                        line: 0,
                        message: `Não foi possível analisar este arquivo após ${maxRetries} tentativas.`
                    });
                }
            }
            catch (fileError) {
                console.error(`Erro ao processar arquivo ${file}: ${fileError.message}`);
                issues.push({
                    file: file,
                    line: 0,
                    message: `Erro ao processar arquivo: ${fileError.message}`
                });
            }
        }
    }
    catch (error) {
        console.error(`Erro na análise de código: ${error.message}`);
        issues.push({
            file: "global",
            line: 0,
            message: `Erro global na análise: ${error.message}`
        });
    }
    return issues;
}
/**
 * Inicializa e configura o acesso ao repositório do Azure DevOps
 * @returns RepositoryAzureDevops configurado ou null em caso de erro
 */
async function initializeRepository() {
    try {
        // Recuperar informações do ambiente para configuração do repositório
        const organization = tl.getVariable('System.TeamFoundationCollectionUri')?.split('/').pop() || '';
        const project = tl.getVariable('System.TeamProject') || '';
        const repositoryId = tl.getVariable('Build.Repository.ID') || '';
        // O token de acesso precisa ter permissão para usar a API do Azure DevOps
        const accessToken = tl.getVariable('System.AccessToken') || tl.getInput('azure_devops_token', false) || '';
        // Verificar se o PR ID está disponível (usado em builds de PR)
        const pullRequestIdString = tl.getVariable('System.PullRequest.PullRequestId');
        const pullRequestId = pullRequestIdString ? parseInt(pullRequestIdString, 10) : undefined;
        // Verificar se temos todas as informações necessárias
        if (!organization || !project || !repositoryId || !accessToken) {
            console.warn('Informações insuficientes para configurar o acesso ao repositório:');
            console.warn(`Organization: ${organization ? 'OK' : 'Faltando'}`);
            console.warn(`Project: ${project ? 'OK' : 'Faltando'}`);
            console.warn(`Repository ID: ${repositoryId ? 'OK' : 'Faltando'}`);
            console.warn(`Access Token: ${accessToken ? 'OK' : 'Faltando'}`);
            return null;
        }
        console.log('Configurando acesso ao repositório Azure DevOps...');
        console.log(`Organization: ${organization}`);
        console.log(`Project: ${project}`);
        console.log(`Repository ID: ${repositoryId}`);
        console.log(`Pull Request ID: ${pullRequestId || 'N/A'}`);
        // Inicializar o repositório
        const repo = new repositoryAzureDevops_1.RepositoryAzureDevops(organization, project, repositoryId, accessToken, pullRequestId);
        // Conectar à API
        await repo.initialize();
        console.log('Repositório Azure DevOps inicializado com sucesso!');
        return repo;
    }
    catch (error) {
        console.error(`Erro ao inicializar repositório: ${error.message}`);
        return null;
    }
}
run();
