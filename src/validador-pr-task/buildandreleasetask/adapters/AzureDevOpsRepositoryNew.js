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
exports.AzureDevOpsRepositoryNew = void 0;
const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
const azureapirest_1 = require("../azureapirest");
/**
 * Implementação de IRepository para Azure DevOps usando as classes personalizadas
 * Esta classe gerencia as operações relacionadas ao repositório no Azure DevOps
 */
class AzureDevOpsRepositoryNew {
    gitClient = null;
    pullRequestClient = null;
    projectName;
    repositoryId;
    organization;
    azureDevOpsUri;
    accessToken;
    pullRequestId;
    logger;
    initialized = false;
    /**
     * Construtor para a classe AzureDevOpsRepositoryNew
     * @param organization Nome da organização do Azure DevOps
     * @param azureDevOpsUri URI do Azure DevOps (opcional, padrão é 'https://dev.azure.com/')
     * @param projectName Nome do projeto
     * @param repositoryId ID do repositório
     * @param accessToken Token de acesso para autenticação
     * @param logger Serviço de log
     * @param pullRequestId ID do Pull Request (opcional)
     */
    constructor(organization, azureDevOpsUri = 'https://dev.azure.com/', projectName, repositoryId, accessToken, logger, pullRequestId) {
        this.organization = organization;
        this.azureDevOpsUri = azureDevOpsUri;
        this.projectName = projectName;
        this.repositoryId = repositoryId;
        this.accessToken = accessToken;
        this.pullRequestId = pullRequestId;
        this.logger = logger;
    }
    /**
     * Inicializa a conexão com a API do Azure DevOps
     */
    async initialize() {
        try {
            // Criar clientes para as APIs do Azure DevOps
            // O mecanismo de retry já está incorporado na classe AzureDevOpsApiClient
            const baseClient = new azureapirest_1.AzureDevOpsApiClient(this.organization, this.projectName, this.accessToken);
            this.logger.info(`Conectando em ${this.azureDevOpsUri}${this.organization}, com projeto: ${this.projectName}`);
            this.gitClient = new azureapirest_1.GitClient(this.organization, this.projectName, this.accessToken);
            this.pullRequestClient = new azureapirest_1.PullRequestClient(this.organization, this.projectName, this.accessToken);
            this.initialized = true;
            this.logger.info('Conexão com Azure DevOps estabelecida com sucesso.');
        }
        catch (error) {
            this.logger.error(`Erro ao inicializar conexão com Azure DevOps: ${error.message}`);
            throw error;
        }
    }
    /**
     * Verifica se o contexto atual é um Pull Request
     * @returns Promise que resolve para true se estamos em um contexto de PR, false caso contrário
     */
    async isPullRequestContext() {
        return !!this.pullRequestId;
    }
    /**
     * Baixa os arquivos alterados em um Pull Request
     * @param targetDirectory Diretório para salvar os arquivos
     * @param excludePatterns Padrões glob para exclusão de arquivos (opcional)
     * @returns Promise com lista de caminhos de arquivos baixados
     */
    async downloadPullRequestFiles(targetDirectory, excludePatterns) {
        if (!this.initialized || !this.gitClient || !this.pullRequestId) {
            throw new Error('Repositório não inicializado ou PR ID não fornecido.');
        }
        try {
            // Garantir que o diretório de destino exista
            if (!fs.existsSync(targetDirectory)) {
                fs.mkdirSync(targetDirectory, { recursive: true });
            } // Get all iterations first
            const iterations = await this.gitClient.getPullRequestIterations(this.repositoryId, this.pullRequestId);
            if (!iterations || iterations.length === 0) {
                this.logger.warn('Nenhuma iteração encontrada no PR.');
                return [];
            }
            const latestIteration = iterations[iterations.length - 1];
            // Obter as alterações no PR
            const changes = await this.gitClient.getPullRequestIterationChanges(this.repositoryId, this.pullRequestId, latestIteration?.id);
            if (!changes || !changes.changeEntries) {
                this.logger.warn('Nenhuma alteração encontrada no PR.');
                return [];
            }
            const downloadedFiles = [];
            // Processar cada arquivo alterado
            for (const change of changes.changeEntries || []) {
                // Pular se não for um arquivo ou se foi excluído
                if (change.item?.isFolder || change.changeType === azureapirest_1.VersionControlChangeType.Delete) {
                    continue;
                }
                const filePath = change.item?.path;
                if (!filePath)
                    continue;
                // Verificar se o arquivo corresponde aos padrões de exclusão
                if (excludePatterns && this.matchesExcludePatterns(filePath, excludePatterns)) {
                    this.logger.log(`Arquivo excluído pelos padrões de exclusão: ${filePath}`);
                    continue;
                }
                try {
                    // Obter o conteúdo do arquivo
                    const fileContentStream = await this.gitClient.getItemContent(this.repositoryId, filePath, undefined, undefined, undefined, undefined, undefined, true, // includeContent
                    {
                        versionType: 0 // GitVersionType.Branch
                    });
                    if (!fileContentStream) {
                        this.logger.warn(`Não foi possível obter conteúdo para: ${filePath}`);
                        continue;
                    }
                    // Definir o caminho de destino do arquivo
                    const destinationPath = path.join(targetDirectory, filePath);
                    const destinationDir = path.dirname(destinationPath);
                    // Criar diretório de destino se não existir
                    if (!fs.existsSync(destinationDir)) {
                        fs.mkdirSync(destinationDir, { recursive: true });
                    }
                    // Ler o stream e salvar o conteúdo do arquivo
                    const buffer = await this.streamToBuffer(fileContentStream);
                    fs.writeFileSync(destinationPath, buffer);
                    downloadedFiles.push(destinationPath);
                    this.logger.log(`Arquivo baixado: ${destinationPath}`);
                }
                catch (fileError) {
                    this.logger.warn(`Erro ao baixar arquivo ${filePath}: ${fileError.message}`);
                }
            }
            this.logger.info(`Baixados ${downloadedFiles.length} arquivos do PR para análise.`);
            return downloadedFiles;
        }
        catch (error) {
            this.logger.error(`Erro ao baixar arquivos do PR: ${error.message}`);
            throw error;
        }
    }
    /**
     * Adiciona um comentário ao Pull Request
     * @param commentContent Conteúdo do comentário
     * @param filePath Caminho do arquivo para comentário em linha (opcional)
     * @param lineNumber Número da linha para comentário em linha (opcional)
     */
    async addPullRequestComment(commentContent, filePath, lineNumber) {
        if (!this.initialized || !this.pullRequestClient || !this.pullRequestId) {
            throw new Error('Repositório não inicializado ou PR ID não fornecido.');
        }
        try {
            if (filePath && lineNumber !== undefined) {
                // Comentário em uma linha específica
                const thread = {
                    comments: [
                        {
                            content: commentContent,
                            commentType: azureapirest_1.CommentType.Text
                        }
                    ],
                    status: azureapirest_1.CommentThreadStatus.Active,
                    threadContext: {
                        filePath: filePath,
                        leftFileEnd: {
                            line: lineNumber,
                            offset: 1
                        },
                        leftFileStart: {
                            line: lineNumber,
                            offset: 1
                        },
                        rightFileEnd: {
                            line: lineNumber,
                            offset: 1
                        },
                        rightFileStart: {
                            line: lineNumber,
                            offset: 1
                        }
                    }
                };
                await this.pullRequestClient.createThread(thread, this.repositoryId, this.pullRequestId, this.projectName);
                this.logger.log(`Comentário adicionado ao arquivo ${filePath} na linha ${lineNumber}`);
            }
            else {
                // Comentário geral no PR
                const thread = {
                    comments: [
                        {
                            content: commentContent,
                            commentType: azureapirest_1.CommentType.Text
                        }
                    ],
                    status: azureapirest_1.CommentThreadStatus.Active
                };
                await this.pullRequestClient.createThread(thread, this.repositoryId, this.pullRequestId, this.projectName);
                this.logger.log('Comentário geral adicionado ao PR');
            }
        }
        catch (error) {
            this.logger.error(`Erro ao adicionar comentário ao PR: ${error.message}`);
            throw error;
        }
    }
    /**
     * Define o status do Pull Request
     * @param status Status a ser definido ('approved', 'rejected', ou 'waiting')
     * @param description Descrição opcional do status
     */
    async setPullRequestStatus(status, description) {
        if (!this.initialized || !this.pullRequestClient || !this.pullRequestId) {
            throw new Error('Repositório não inicializado ou PR ID não fornecido.');
        }
        try {
            // Mapear status para os tipos do Azure DevOps
            let voteValue;
            switch (status) {
                case 'approved':
                    voteValue = 10; // Approved
                    break;
                case 'rejected':
                    voteValue = -10; // Rejected
                    break;
                case 'waiting':
                default:
                    voteValue = -5; // Waiting
                    break;
            }
            // Configurar o voto do revisor
            const reviewerId = '00000000-0000-0000-0000-000000000000'; // ID padrão para o serviço
            const reviewer = {
                vote: voteValue,
                displayName: 'Validador PR',
                id: reviewerId
            };
            // 1. Atualizar o revisor com o voto
            await this.pullRequestClient.createPullRequestReviewer(reviewer, this.repositoryId, this.pullRequestId, reviewerId, this.projectName);
            // 2. Atualizar o status do PR
            await this.pullRequestClient.createPullRequestStatus({
                state: status === 'approved' ? azureapirest_1.GitStatusState.Succeeded :
                    status === 'rejected' ? azureapirest_1.GitStatusState.Failed :
                        azureapirest_1.GitStatusState.Pending,
                description: description || `Revisão de código: ${status}`,
                context: {
                    name: 'validador-pr',
                    genre: 'code-review'
                }
            }, this.repositoryId, this.pullRequestId, this.projectName);
            this.logger.info(`Status do PR atualizado para: ${status}`);
        }
        catch (error) {
            this.logger.error(`Erro ao definir status do PR: ${error.message}`);
            throw error;
        }
    }
    /**
     * Adiciona o resultado de uma análise como comentários ao Pull Request
     * @param report Relatório de análise
     * @param repositoryPath Caminho base do repositório local
     */
    async addAnalysisResultToPullRequest(report, repositoryPath) {
        if (!this.initialized || !this.pullRequestClient || !this.pullRequestId) {
            throw new Error('Repositório não inicializado ou PR ID não fornecido.');
        }
        try {
            // Adicionar comentários em linha para cada problema
            for (const issue of report.getIssues()) {
                try {
                    // Extrair o caminho relativo ao repositório
                    let relativeFilePath = path.relative(repositoryPath, issue.file);
                    // Normalizar o caminho (converter backslashes para forward slashes)
                    relativeFilePath = relativeFilePath.replace(/\\/g, '/');
                    this.logger.log(`Tentando adicionar comentário ao arquivo ${relativeFilePath} na linha ${issue.line}`);
                    if (issue.responseFormat === 'json' || issue.responseFormat === 'markdown') {
                        // Comentar no arquivo específico e linha
                        await this.addPullRequestComment(issue.message, relativeFilePath, issue.line);
                    }
                    this.logger.log(`Comentário adicionado ao arquivo ${relativeFilePath} na linha ${issue.line}`);
                }
                catch (commentError) {
                    this.logger.warn(`Não foi possível adicionar comentário ao arquivo: ${commentError.message}`);
                    // Tentar adicionar como comentário geral se o comentário em linha falhar
                    try {
                        const fileInfo = `**Arquivo:** ${path.basename(issue.file)}\n**Linha:** ${issue.line}\n\n`;
                        await this.addPullRequestComment(fileInfo + issue.message);
                        this.logger.log(`Adicionado como comentário geral porque o comentário em linha falhou`);
                    }
                    catch (generalCommentError) {
                        this.logger.error(`Também falhou ao adicionar comentário geral: ${generalCommentError.message}`);
                    }
                }
            }
            this.logger.info('Comentários adicionados ao PR com sucesso.');
        }
        catch (error) {
            this.logger.error(`Erro ao adicionar resultados ao PR: ${error.message}`);
            throw error;
        }
    }
    /**
     * Verifica se um caminho de arquivo corresponde a algum dos padrões de exclusão
     * @param filePath Caminho do arquivo
     * @param excludePatterns Padrões glob para exclusão
     * @returns true se o arquivo deve ser excluído, false caso contrário
     */
    matchesExcludePatterns(filePath, excludePatterns) {
        // Se não houver padrões de exclusão, não excluir nenhum arquivo
        if (!excludePatterns || excludePatterns.length === 0) {
            return false;
        }
        // Verificar cada padrão
        for (const pattern of excludePatterns) {
            if (pattern.startsWith('!')) {
                // Padrão de negação (não excluir o que seria excluído)
                const normalPattern = pattern.substring(1);
                if (filePath.match(new RegExp(normalPattern.replace(/\*/g, '.*')))) {
                    return false;
                }
            }
            else {
                // Padrão de exclusão normal
                if (filePath.match(new RegExp(pattern.replace(/\*/g, '.*')))) {
                    return true;
                }
            }
        }
        // Por padrão, não excluir o arquivo se nenhum padrão corresponder
        return false;
    }
    /**
     * Converte um ReadableStream em um Buffer
     * @param stream Stream para converter
     * @returns Promise com o buffer contendo os dados do stream
     */
    async streamToBuffer(stream) {
        return new Promise((resolve, reject) => {
            const chunks = [];
            stream.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
            stream.on('error', (err) => reject(err));
            stream.on('end', () => resolve(Buffer.concat(chunks)));
        });
    }
}
exports.AzureDevOpsRepositoryNew = AzureDevOpsRepositoryNew;
