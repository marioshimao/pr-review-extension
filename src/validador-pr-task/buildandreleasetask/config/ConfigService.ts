import * as tl from 'azure-pipelines-task-lib/task';
import * as path from 'path';

import { ConsoleLogService } from '../adapters/ConsoleLogService';
import { FileSystemService } from '../adapters/FileSystemService';
import { AzureDevOpsRepository } from '../adapters/AzureDevOpsRepository';
import { OpenAICodeAnalyzer } from '../adapters/OpenAICodeAnalyzer';

import { ILogService } from '../interfaces/ILogService';
import { IFileService } from '../interfaces/IFileService';
import { IRepository } from '../interfaces/IRepository';
import { ICodeAnalyzer } from '../interfaces/ICodeAnalyzer';

/**
 * Configurações da aplicação
 */
export interface AppConfig {
    repositoryPath: string;
    excludePatterns: string[];
    failOnIssues: boolean;
    outputFilePath: string;
    additionalPrompts?: string[];
    isPullRequestContext: boolean;
}

/**
 * Serviço de configuração da aplicação
 * Esta classe é responsável por carregar configurações e inicializar dependências
 */
export class ConfigService {
    private logService: ILogService;
    private fileService: IFileService;
    private repository: IRepository | null = null;
    private codeAnalyzer: ICodeAnalyzer | null = null;
    private appConfig: AppConfig | null = null;

    constructor() {
        // Inicializar serviços básicos
        this.logService = new ConsoleLogService();
        this.fileService = new FileSystemService(this.logService);
    }

    /**
     * Carrega as configurações da task
     * @returns Configurações da aplicação
     */
    public async loadConfig(): Promise<AppConfig> {
        if (this.appConfig) {
            return this.appConfig;
        }

        try {
            // Recuperar os inputs da task
            const repositoryPath: string = tl.getPathInput('repositoryPath', true, true)!;
            const excludePatterns: string[] = tl.getDelimitedInput('excludePatterns', '\n', false);
            const failOnIssues: boolean = tl.getBoolInput('failOnIssues', false);
            const outputFilePath: string = tl.getInput('outputFilePath', false) || '';
            const additionalPrompts = tl.getInput('additionalPrompts', false)?.split(',');
            
            // Verificar se estamos em um contexto de Pull Request
            const isPullRequestContext = !!tl.getVariable('System.PullRequest.PullRequestId');

            this.appConfig = {
                repositoryPath,
                excludePatterns,
                failOnIssues,
                outputFilePath,
                additionalPrompts,
                isPullRequestContext
            };

            return this.appConfig;
        } catch (error: any) {
            this.logService.error(`Erro ao carregar configurações: ${error.message}`);
            throw error;
        }
    }

    /**
     * Inicializa o repositório
     * @returns Repositório inicializado ou null se não for possível inicializar
     */
    public async initializeRepository(): Promise<IRepository | null> {
        if (this.repository) {
            return this.repository;
        }

        try {
            // Recuperar informações do ambiente para configuração do repositório
            const organization = tl.getVariable('System.TeamFoundationCollectionUri')?.split('/').pop() || '';
            const project = tl.getVariable('System.TeamProject') || '';
            const repositoryId = tl.getVariable('Build.Repository.ID') || '';
              // O token de acesso precisa ter permissão para usar a API do Azure DevOps
            const accessToken = tl.getVariable('System.AccessToken') || tl.getInput('azureDevopsToken', false) || '';
            
            // Verificar se o PR ID está disponível (usado em builds de PR)
            const pullRequestIdString = tl.getVariable('System.PullRequest.PullRequestId');
            const pullRequestId = pullRequestIdString ? parseInt(pullRequestIdString, 10) : undefined;
            
            // Verificar se temos todas as informações necessárias
            if (!organization || !project || !repositoryId || !accessToken) {
                this.logService.warn('Informações insuficientes para configurar o acesso ao repositório:');
                this.logService.warn(`Organization: ${organization ? 'OK' : 'Faltando'}`);
                this.logService.warn(`Project: ${project ? 'OK' : 'Faltando'}`);
                this.logService.warn(`Repository ID: ${repositoryId ? 'OK' : 'Faltando'}`);
                this.logService.warn(`Access Token: ${accessToken ? 'OK' : 'Faltando'}`);
                return null;
            }
            
            this.logService.log('Configurando acesso ao repositório Azure DevOps...');
            this.logService.log(`Organization: ${organization}`);
            this.logService.log(`Project: ${project}`);
            this.logService.log(`Repository ID: ${repositoryId}`);
            this.logService.log(`Pull Request ID: ${pullRequestId || 'N/A'}`);
            
            // Inicializar o repositório
            this.repository = new AzureDevOpsRepository(
                organization,
                project,
                repositoryId,
                accessToken,
                this.logService,
                pullRequestId
            );
            
            // Conectar à API
            await this.repository.initialize();
            this.logService.log('Repositório Azure DevOps inicializado com sucesso!');
            
            return this.repository;
        } catch (error: any) {
            this.logService.error(`Erro ao inicializar repositório: ${error.message}`);
            return null;
        }
    }

    /**
     * Inicializa o analisador de código
     * @returns Analisador de código inicializado
     */
    public async initializeCodeAnalyzer(): Promise<ICodeAnalyzer> {
        if (this.codeAnalyzer) {
            return this.codeAnalyzer;
        }

        try {            // Recuperar configurações para o OpenAI
            const apiKey = tl.getInput('apiKey', true)!;
            const azureApiEndpoint = tl.getInput('apiEndpoint', false);
            const azureApiVersion = tl.getInput('apiVersion', false);
            const azureModelDeployment = tl.getInput('aiModel', false);

            // Configurar analisador
            if (azureApiEndpoint && azureApiVersion) {
                // Usar Azure OpenAI
                this.logService.info('Configurando analisador com Azure OpenAI');
                this.logService.info(`Azure API Endpoint: ${azureApiEndpoint}`);
                this.logService.info(`Azure API Version: ${azureApiVersion}`);
                this.logService.info(`Azure Model Deployment: ${azureModelDeployment || 'Não especificado'}`);

                this.codeAnalyzer = new OpenAICodeAnalyzer(
                    apiKey,
                    this.logService,
                    {
                        endpoint: azureApiEndpoint,
                        apiVersion: azureApiVersion,
                        deploymentName: azureModelDeployment || 'gpt-4'
                    }
                );
            } else {
                // Usar OpenAI padrão
                this.logService.info('Configurando analisador com OpenAI padrão');
                this.codeAnalyzer = new OpenAICodeAnalyzer(apiKey, this.logService);
            }

            return this.codeAnalyzer;
        } catch (error: any) {
            this.logService.error(`Erro ao inicializar analisador de código: ${error.message}`);
            throw error;
        }
    }

    /**
     * Obtém o serviço de log
     * @returns Serviço de log
     */
    public getLogService(): ILogService {
        return this.logService;
    }

    /**
     * Obtém o serviço de arquivos
     * @returns Serviço de arquivos
     */
    public getFileService(): IFileService {
        return this.fileService;
    }
}
