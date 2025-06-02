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
exports.RepositoryAzureDevops = void 0;
const azdev = __importStar(require("azure-devops-node-api"));
const gitInterfaces = __importStar(require("azure-devops-node-api/interfaces/GitInterfaces"));
const tl = __importStar(require("azure-pipelines-task-lib/task"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
/**
 * Classe para acessar o repositório do Azure DevOps
 * Esta classe fornece métodos para interagir com repositórios Git no Azure DevOps
 * incluindo obtenção de informações de PR, comentários, e manipulação de arquivos
 */
class RepositoryAzureDevops {
    gitApi = null;
    projectName;
    repositoryId;
    organization;
    accessToken;
    pullRequestId;
    /**
     * Construtor para a classe RepositoryAzureDevops
     * @param organization - Nome da organização do Azure DevOps
     * @param projectName - Nome do projeto
     * @param repositoryId - ID do repositório
     * @param accessToken - Token de acesso pessoal (PAT) para autenticação
     * @param pullRequestId - ID do Pull Request (opcional)
     */
    constructor(organization, projectName, repositoryId, accessToken, pullRequestId) {
        this.organization = organization;
        this.projectName = projectName;
        this.repositoryId = repositoryId;
        this.accessToken = accessToken;
        this.pullRequestId = pullRequestId || 0;
    }
    /**
     * Inicializa a conexão com a API do Azure DevOps
     * Implementa retry com exponential backoff para lidar com falhas de conexão
     */
    async initialize() {
        try {
            const maxRetries = 3;
            let retryCount = 0;
            let success = false;
            while (!success && retryCount < maxRetries) {
                try {
                    console.log(`Inicializando conexão com Azure DevOps (tentativa ${retryCount + 1}/${maxRetries})...`);
                    // Criar um handler de autenticação usando PAT
                    const authHandler = azdev.getPersonalAccessTokenHandler(this.accessToken);
                    // Criar uma conexão com a API
                    const connection = new azdev.WebApi(`https://dev.azure.com/${this.organization}`, authHandler);
                    // Obter a API Git
                    this.gitApi = await connection.getGitApi();
                    console.log('Conexão estabelecida com Azure DevOps');
                    success = true;
                }
                catch (error) {
                    retryCount++;
                    const delay = Math.pow(2, retryCount) * 1000;
                    console.warn(`Falha na conexão com Azure DevOps: ${error.message}`);
                    console.warn(`Tentando novamente em ${delay}ms...`);
                    await new Promise(resolve => setTimeout(resolve, delay));
                }
            }
            if (!success) {
                throw new Error(`Falha ao conectar com Azure DevOps após ${maxRetries} tentativas`);
            }
        }
        catch (error) {
            tl.setResult(tl.TaskResult.Failed, `Erro ao inicializar conexão com Azure DevOps: ${error.message}`);
            throw error;
        }
    }
    /**
     * Obtém os arquivos alterados em um Pull Request
     * @returns Promise com array de nomes de arquivos alterados
     */
    async getChangedFiles() {
        try {
            if (!this.gitApi) {
                await this.initialize();
            }
            if (!this.pullRequestId) {
                throw new Error('ID do Pull Request não foi definido');
            }
            console.log(`Obtendo alterações do PR #${this.pullRequestId}...`);
            // Obter as alterações do PR
            const changes = await this.gitApi.getPullRequestIterationChanges(this.repositoryId, this.pullRequestId, 1 // Usar a primeira iteração
            );
            // Extrair nomes de arquivos alterados
            const changedFiles = [];
            if (changes && changes.changeEntries) {
                changes.changeEntries.forEach(change => {
                    if (change.item && change.item.path) {
                        changedFiles.push(change.item.path);
                    }
                });
            }
            console.log(`Encontrados ${changedFiles.length} arquivos alterados`);
            return changedFiles;
        }
        catch (error) {
            console.error(`Erro ao obter arquivos alterados: ${error.message}`);
            return [];
        }
    }
    /**
     * Obtém o conteúdo de um arquivo específico do repositório
     * @param filePath Caminho do arquivo no repositório
     * @param branch Nome da branch (opcional, padrão é 'main')
     * @returns Promise com o conteúdo do arquivo como string
     */
    async getFileContent(filePath, branch = 'main') {
        try {
            if (!this.gitApi) {
                await this.initialize();
            }
            console.log(`Obtendo conteúdo do arquivo: ${filePath} (branch: ${branch})`);
            // Criar um descritor de versão
            const versionDescriptor = {
                version: branch,
                versionOptions: 0, // Latest
                versionType: 0 // Branch
            };
            // Obter o item do repositório
            const item = await this.gitApi.getItem(this.repositoryId, filePath, undefined, // projectId
            undefined, // repositoryId
            undefined, // scopePath
            undefined, // recursionLevel
            undefined, // includeContentMetadata
            true, // latestProcessedChange
            versionDescriptor);
            if (!item.content) {
                throw new Error(`Arquivo não encontrado ou vazio: ${filePath}`);
            }
            return Buffer.from(item.content, 'base64').toString('utf8');
        }
        catch (error) {
            console.error(`Erro ao obter conteúdo do arquivo ${filePath}: ${error.message}`);
            throw error;
        }
    }
    /**
     * Adiciona um comentário a um Pull Request
     * @param content Conteúdo do comentário
     * @param filePath Caminho do arquivo para comentar (opcional)
     * @param lineNumber Número da linha para comentar (opcional)
     * @returns Promise com o ID do comentário criado
     */
    async addPullRequestComment(content, filePath, lineNumber) {
        try {
            if (!this.gitApi) {
                await this.initialize();
            }
            if (!this.pullRequestId) {
                throw new Error('ID do Pull Request não foi definido');
            }
            console.log(`Adicionando comentário ao PR #${this.pullRequestId}...`);
            // Criar objeto de comentário
            const comment = {
                content: content,
                commentType: gitInterfaces.CommentType.Text
            };
            // Se um arquivo e linha específicos foram fornecidos, criar um comentário em linha
            let threadContext;
            if (filePath && lineNumber) {
                threadContext = {
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
                };
            }
            // Criar o thread de comentário
            const commentThread = {
                comments: [comment],
                status: gitInterfaces.CommentThreadStatus.Active,
                threadContext: threadContext
            };
            // Adicionar o thread ao PR
            const thread = await this.gitApi.createThread(commentThread, this.repositoryId, this.pullRequestId);
            console.log(`Comentário adicionado com sucesso, thread ID: ${thread.id}`);
            return thread.id || 0;
        }
        catch (error) {
            console.error(`Erro ao adicionar comentário ao PR: ${error.message}`);
            throw error;
        }
    }
    /**
     * Define o status do Pull Request
     * @param status Status do PR ("approved", "rejected", "waiting")
     * @param description Descrição opcional
     * @returns Promise indicando sucesso da operação
     */
    async setPullRequestStatus(status, description) {
        try {
            if (!this.gitApi) {
                await this.initialize();
            }
            if (!this.pullRequestId) {
                throw new Error('ID do Pull Request não foi definido');
            }
            console.log(`Definindo status do PR #${this.pullRequestId} para ${status}...`);
            // Mapear o status para valores numéricos que representam o status de voto
            // 10 = Approved, 5 = Approved with suggestions, 0 = No vote, -5 = Waiting, -10 = Rejected
            let voteStatus;
            switch (status) {
                case 'approved':
                    voteStatus = 10; // Approved
                    break;
                case 'rejected':
                    voteStatus = -10; // Rejected
                    break;
                case 'waiting':
                default:
                    voteStatus = -5; // Waiting for author
                    break;
            }
            // Criar o revisor
            const reviewer = {
                vote: voteStatus,
                id: tl.getVariable('Build.RequestedForId') || undefined
            };
            // Atualizar o status do PR
            await this.gitApi.createPullRequestReviewer(reviewer, this.repositoryId, this.pullRequestId, reviewer.id);
            console.log(`Status do PR atualizado com sucesso para ${status}`);
            return true;
        }
        catch (error) {
            console.error(`Erro ao definir status do PR: ${error.message}`);
            return false;
        }
    }
    /**
     * Obtém os detalhes de um Pull Request
     * @returns Promise com os detalhes do PR
     */
    async getPullRequestDetails() {
        try {
            if (!this.gitApi) {
                await this.initialize();
            }
            if (!this.pullRequestId) {
                throw new Error('ID do Pull Request não foi definido');
            }
            console.log(`Obtendo detalhes do PR #${this.pullRequestId}...`);
            // Obter os detalhes do PR
            const pullRequest = await this.gitApi.getPullRequestById(this.pullRequestId);
            return pullRequest;
        }
        catch (error) {
            console.error(`Erro ao obter detalhes do PR: ${error.message}`);
            return null;
        }
    }
    /**
     * Baixa os arquivos de um Pull Request para um diretório local
     * @param targetDirectory Diretório local para salvar os arquivos
     * @param filesFilter Array opcional de filtros de arquivos (glob patterns)
     * @returns Promise com array de caminhos dos arquivos baixados
     */
    async downloadPullRequestFiles(targetDirectory, filesFilter) {
        try {
            if (!this.gitApi) {
                await this.initialize();
            }
            if (!this.pullRequestId) {
                throw new Error('ID do Pull Request não foi definido');
            }
            console.log(`Baixando arquivos do PR #${this.pullRequestId} para ${targetDirectory}...`);
            // Obter arquivos alterados no PR
            const changedFiles = await this.getChangedFiles();
            const downloadedFiles = [];
            // Criar diretório de destino se não existir
            if (!fs.existsSync(targetDirectory)) {
                fs.mkdirSync(targetDirectory, { recursive: true });
            }
            // Processar cada arquivo alterado
            for (const filePath of changedFiles) {
                // Verificar se o arquivo passa pelo filtro, se fornecido
                if (filesFilter && filesFilter.length > 0) {
                    // Implementação simples de filtro - pode ser melhorada com globby ou similar
                    const shouldInclude = filesFilter.some(pattern => filePath.includes(pattern) || filePath.match(new RegExp(pattern.replace('*', '.*'))));
                    if (!shouldInclude) {
                        continue;
                    }
                }
                try {
                    // Obter o conteúdo do arquivo da branch de destino do PR
                    const prDetails = await this.getPullRequestDetails();
                    if (!prDetails || !prDetails.targetRefName) {
                        throw new Error('Não foi possível determinar a branch de destino do PR');
                    }
                    // Extrair o nome da branch de destino (removendo o "refs/heads/" do início)
                    const targetBranch = prDetails.targetRefName.replace('refs/heads/', '');
                    // Obter o conteúdo do arquivo
                    const fileContent = await this.getFileContent(filePath, targetBranch);
                    // Determinar o caminho local para salvar o arquivo
                    const localFilePath = path.join(targetDirectory, filePath);
                    const localDir = path.dirname(localFilePath);
                    // Criar diretórios necessários
                    if (!fs.existsSync(localDir)) {
                        fs.mkdirSync(localDir, { recursive: true });
                    }
                    // Salvar o arquivo localmente
                    fs.writeFileSync(localFilePath, fileContent);
                    downloadedFiles.push(localFilePath);
                    console.log(`Arquivo baixado: ${filePath}`);
                }
                catch (fileError) {
                    console.warn(`Erro ao baixar arquivo ${filePath}: ${fileError.message}`);
                    // Continue para o próximo arquivo em caso de erro
                }
            }
            console.log(`Download concluído. ${downloadedFiles.length} arquivos baixados.`);
            return downloadedFiles;
        }
        catch (error) {
            console.error(`Erro ao baixar arquivos do PR: ${error.message}`);
            return [];
        }
    }
    /**
     * Define o ID do Pull Request para operações subsequentes
     * @param pullRequestId ID do Pull Request
     */
    setPullRequestId(pullRequestId) {
        this.pullRequestId = pullRequestId;
    }
    /**
     * Obtém os work items associados a um Pull Request
     * @returns Promise com os work items associados
     */
    async getAssociatedWorkItems() {
        try {
            if (!this.gitApi) {
                await this.initialize();
            }
            if (!this.pullRequestId) {
                throw new Error('ID do Pull Request não foi definido');
            }
            console.log(`Obtendo work items associados ao PR #${this.pullRequestId}...`);
            // Obter os work items associados
            const workItems = await this.gitApi.getPullRequestWorkItemRefs(this.repositoryId, this.pullRequestId);
            console.log(`Encontrados ${workItems.length} work items associados`);
            return workItems;
        }
        catch (error) {
            console.error(`Erro ao obter work items: ${error.message}`);
            return [];
        }
    }
}
exports.RepositoryAzureDevops = RepositoryAzureDevops;
