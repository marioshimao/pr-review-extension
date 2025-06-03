import * as azdev from 'azure-devops-node-api';
import * as gitApi from 'azure-devops-node-api/GitApi';
import * as gitInterfaces from 'azure-devops-node-api/interfaces/GitInterfaces';
import * as path from 'path';
import * as fs from 'fs';
import { IRepository } from '../interfaces/IRepository';
import { ILogService } from '../interfaces/ILogService';
import { AnalysisReport } from '../entities/AnalysisReport';

/**
 * Implementação de IRepository para Azure DevOps
 * Esta classe gerencia as operações relacionadas ao repositório no Azure DevOps
 */
export class AzureDevOpsRepository implements IRepository {
    private gitApi: gitApi.IGitApi | null = null;
    private readonly projectName: string;
    private readonly repositoryId: string;
    private readonly organization: string;
    private readonly azureDevOpsUri: string = 'https://dev.azure.com/';
    private readonly accessToken: string;
    private readonly pullRequestId?: number;
    private readonly logger: ILogService;    
    private initialized: boolean = false;

    /**
     * Construtor para a classe AzureDevOpsRepository
     * @param organization Nome da organização do Azure DevOps
     * @param azureDevOpsUri URI do Azure DevOps (opcional, padrão é 'https://dev.azure.com/')
     * @param projectName Nome do projeto
     * @param repositoryId ID do repositório
     * @param accessToken Token de acesso para autenticação
     * @param logger Serviço de log
     * @param pullRequestId ID do Pull Request (opcional)
     */
    constructor(
        organization: string,
        azureDevOpsUri: string = 'https://dev.azure.com/',
        projectName: string,
        repositoryId: string,
        accessToken: string,
        logger: ILogService,
        pullRequestId?: number
    ) {
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
     * Implementa retry com exponential backoff para lidar com falhas de conexão
     */
    public async initialize(): Promise<void> {
        try {
            const maxRetries = 3;
            let retryCount = 0;
            let success = false;

            while (!success && retryCount < maxRetries) {                try {
                    const authHandler = azdev.getPersonalAccessTokenHandler(this.accessToken);
                    
                    // Construct the connection URL based on the Azure DevOps URI format
                    let connectionUrl: string;
                    if (this.azureDevOpsUri.includes('dev.azure.com')) {
                        // For dev.azure.com format, append the organization
                        connectionUrl = `${this.azureDevOpsUri}${this.organization}`;
                    } else {
                        // For *.visualstudio.com format, use the URI as is
                        connectionUrl = this.azureDevOpsUri;
                    }
                    
                    const connection = new azdev.WebApi(connectionUrl, authHandler);
                    
                    this.gitApi = await connection.getGitApi();
                    success = true;
                    this.initialized = true;
                    
                    this.logger.info('Conexão com Azure DevOps estabelecida com sucesso.');
                } catch (error: any) {
                    retryCount++;
                    const delay = Math.pow(2, retryCount) * 1000;
                    
                    this.logger.warn(`Tentativa ${retryCount}/${maxRetries} de conexão com Azure DevOps falhou: ${error.message}`);
                    this.logger.warn(`Tentando novamente em ${delay}ms...`);
                    
                    // Esperar antes de tentar novamente
                    await new Promise(resolve => setTimeout(resolve, delay));
                }
            }
            
            if (!success) {
                throw new Error(`Não foi possível conectar ao Azure DevOps após ${maxRetries} tentativas.`);
            }
        } catch (error: any) {
            this.logger.error(`Erro ao inicializar conexão com Azure DevOps: ${error.message}`);
            throw error;
        }
    }

    /**
     * Verifica se o contexto atual é um Pull Request
     * @returns Promise que resolve para true se estamos em um contexto de PR, false caso contrário
     */
    public async isPullRequestContext(): Promise<boolean> {
        return !!this.pullRequestId;
    }

    /**     * Baixa os arquivos alterados em um Pull Request
     * @param targetDirectory Diretório para salvar os arquivos
     * @param excludePatterns Padrões glob para exclusão de arquivos (opcional)
     * @returns Promise com lista de caminhos de arquivos baixados
     */
    public async downloadPullRequestFiles(targetDirectory: string, excludePatterns?: string[]): Promise<string[]> {
        if (!this.initialized || !this.gitApi || !this.pullRequestId) {
            throw new Error('Repositório não inicializado ou PR ID não fornecido.');
        }

        try {
            // Garantir que o diretório de destino exista
            if (!fs.existsSync(targetDirectory)) {
                fs.mkdirSync(targetDirectory, { recursive: true });
            }

            // Obter as alterações no PR
            const changes = await this.gitApi.getPullRequestIterationChanges(
                this.repositoryId,
                this.pullRequestId,
                1, // Usar a primeira iteração (número fixo em vez de undefined)
                this.projectName
            );

            if (!changes || !changes.changeEntries) {
                this.logger.warn('Nenhuma alteração encontrada no PR.');
                return [];
            }

            const downloadedFiles: string[] = [];

            // Processar cada arquivo alterado
            for (const change of changes.changeEntries || []) {
                // Pular se não for um arquivo ou se foi excluído
                if (change.item?.isFolder || change.changeType === gitInterfaces.VersionControlChangeType.Delete) {
                    continue;
                }

                const filePath = change.item?.path;
                if (!filePath) continue;                
                // Verificar se o arquivo corresponde aos padrões de exclusão
                if (excludePatterns && this.matchesExcludePatterns(filePath, excludePatterns)) {
                    this.logger.log(`Arquivo excluído pelos padrões de exclusão: ${filePath}`);
                    continue;
                }

                try {
                    // Obter o conteúdo do arquivo
                    const fileContentStream = await this.gitApi.getItemContent(
                        this.repositoryId,
                        filePath,
                        undefined,
                        undefined,
                        undefined,
                        undefined,
                        undefined,
                        true, // includeContent
                        {
                            version: undefined,
                            versionOptions: gitInterfaces.GitVersionOptions.None,
                            versionType: gitInterfaces.GitVersionType.Branch
                        }
                    );

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
                } catch (fileError: any) {
                    this.logger.warn(`Erro ao baixar arquivo ${filePath}: ${fileError.message}`);
                }
            }

            this.logger.info(`Baixados ${downloadedFiles.length} arquivos do PR para análise.`);
            return downloadedFiles;
        } catch (error: any) {
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
    public async addPullRequestComment(commentContent: string, filePath?: string, lineNumber?: number): Promise<void> {
        if (!this.initialized || !this.gitApi || !this.pullRequestId) {
            throw new Error('Repositório não inicializado ou PR ID não fornecido.');
        }

        try {
            if (filePath && lineNumber !== undefined) {
                // Comentário em uma linha específica
                const thread: gitInterfaces.GitPullRequestCommentThread = {
                    comments: [
                        {
                            content: commentContent,
                            commentType: gitInterfaces.CommentType.Text
                        }
                    ],
                    status: gitInterfaces.CommentThreadStatus.Active,
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

                await this.gitApi.createThread(
                    thread,
                    this.repositoryId,
                    this.pullRequestId,
                    this.projectName
                );

                this.logger.log(`Comentário adicionado ao arquivo ${filePath} na linha ${lineNumber}`);
            } else {
                // Comentário geral no PR
                const thread: gitInterfaces.GitPullRequestCommentThread = {
                    comments: [
                        {
                            content: commentContent,
                            commentType: gitInterfaces.CommentType.Text
                        }
                    ],
                    status: gitInterfaces.CommentThreadStatus.Active
                };

                await this.gitApi.createThread(
                    thread,
                    this.repositoryId,
                    this.pullRequestId,
                    this.projectName
                );

                this.logger.log('Comentário geral adicionado ao PR');
            }
        } catch (error: any) {
            this.logger.error(`Erro ao adicionar comentário ao PR: ${error.message}`);
            throw error;
        }
    }

    /**
     * Define o status do Pull Request
     * @param status Status a ser definido ('approved', 'rejected', ou 'waiting')
     * @param description Descrição opcional do status
     */
    public async setPullRequestStatus(status: 'approved' | 'rejected' | 'waiting', description?: string): Promise<void> {
        if (!this.initialized || !this.gitApi || !this.pullRequestId) {
            throw new Error('Repositório não inicializado ou PR ID não fornecido.');
        }

        try {
            // Mapear status para os tipos do Azure DevOps
            let voteValue: number;
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
            const reviewer: gitInterfaces.IdentityRefWithVote = {
                vote: voteValue,
                displayName: 'Validador PR',
                id: reviewerId
            };

            // 1. Atualizar o revisor com o voto
            await this.gitApi.createPullRequestReviewer(
                reviewer,
                this.repositoryId,
                this.pullRequestId,
                reviewerId,
                this.projectName
            );

            // 2. Atualizar o status do PR
            await this.gitApi.createPullRequestStatus(
                {
                    state: status === 'approved' ? gitInterfaces.GitStatusState.Succeeded :
                           status === 'rejected' ? gitInterfaces.GitStatusState.Failed :
                           gitInterfaces.GitStatusState.Pending,
                    description: description || `Revisão de código: ${status}`,
                    context: {
                        name: 'validador-pr',
                        genre: 'code-review'
                    }
                },
                this.repositoryId,
                this.pullRequestId,
                this.projectName
            );

            this.logger.info(`Status do PR atualizado para: ${status}`);
        } catch (error: any) {
            this.logger.error(`Erro ao definir status do PR: ${error.message}`);
            throw error;
        }
    }

    /**
     * Adiciona o resultado de uma análise como comentários ao Pull Request
     * @param report Relatório de análise
     * @param repositoryPath Caminho base do repositório local
     */
    public async addAnalysisResultToPullRequest(report: AnalysisReport, repositoryPath: string): Promise<void> {
        if (!this.initialized || !this.gitApi || !this.pullRequestId) {
            throw new Error('Repositório não inicializado ou PR ID não fornecido.');
        }

        try {
            // Adicionar comentário resumo ao PR
            await this.addPullRequestComment(report.generateMarkdownReport());
            
            // Adicionar comentários em linha para cada problema
            for (const issue of report.getIssues()) {
                // Extrair o caminho relativo ao repositório
                const relativeFilePath = path.relative(repositoryPath, issue.file);
                
                // Comentar no arquivo específico e linha
                await this.addPullRequestComment(
                    issue.message,
                    relativeFilePath,
                    issue.line
                );
            }
            
            // Definir o status do PR baseado nos problemas encontrados
            if (report.hasIssues()) {
                await this.setPullRequestStatus('waiting', 
                    `Encontrados ${report.getIssueCount()} problemas que precisam de atenção.`);
            } else {
                await this.setPullRequestStatus('approved', 
                    'Nenhum problema encontrado na análise de código.');
            }
            
            this.logger.info('Comentários adicionados ao PR com sucesso.');
        } catch (error: any) {
            this.logger.error(`Erro ao adicionar resultados ao PR: ${error.message}`);
            throw error;
        }
    }    /**
     * Verifica se um caminho de arquivo corresponde a algum dos padrões de exclusão
     * @param filePath Caminho do arquivo
     * @param excludePatterns Padrões glob para exclusão
     * @returns true se o arquivo deve ser excluído, false caso contrário
     */
    private matchesExcludePatterns(filePath: string, excludePatterns: string[]): boolean {
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
            } else {
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
    private async streamToBuffer(stream: NodeJS.ReadableStream): Promise<Buffer> {
        return new Promise<Buffer>((resolve, reject) => {
            const chunks: Buffer[] = [];
            
            stream.on('data', (chunk: Buffer) => chunks.push(Buffer.from(chunk)));
            stream.on('error', (err) => reject(err));
            stream.on('end', () => resolve(Buffer.concat(chunks)));
        });
    }
}
