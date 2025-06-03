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
exports.ConfigService = void 0;
const tl = __importStar(require("azure-pipelines-task-lib/task"));
const ConsoleLogService_1 = require("../adapters/ConsoleLogService");
const FileSystemService_1 = require("../adapters/FileSystemService");
const AzureDevOpsRepository_1 = require("../adapters/AzureDevOpsRepository");
const OpenAICodeAnalyzer_1 = require("../adapters/OpenAICodeAnalyzer");
/**
 * Serviço de configuração da aplicação
 * Esta classe é responsável por carregar configurações e inicializar dependências
 */
class ConfigService {
    logService;
    fileService;
    repository = null;
    codeAnalyzer = null;
    appConfig = null;
    constructor() {
        // Inicializar serviços básicos
        this.logService = new ConsoleLogService_1.ConsoleLogService();
        this.fileService = new FileSystemService_1.FileSystemService(this.logService);
    }
    /**
     * Carrega as configurações da task
     * @returns Configurações da aplicação
     */
    async loadConfig() {
        if (this.appConfig) {
            return this.appConfig;
        }
        try {
            // Recuperar os inputs da task
            const repositoryPath = tl.getPathInput('repositoryPath', true, true);
            const excludePatterns = tl.getDelimitedInput('excludePatterns', '\n', false);
            const failOnIssues = tl.getBoolInput('failOnIssues', false);
            const outputFilePath = tl.getInput('outputFilePath', false) || '';
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
        }
        catch (error) {
            this.logService.error(`Erro ao carregar configurações: ${error.message}`);
            throw error;
        }
    }
    /**
     * Inicializa o repositório
     * @returns Repositório inicializado ou null se não for possível inicializar
     */
    async initializeRepository() {
        if (this.repository) {
            return this.repository;
        }
        try {
            // Recuperar informações do ambiente para configuração do repositório
            const collectionUri = tl.getVariable('System.TeamFoundationCollectionUri') || '';
            // Extrair o organization name do URI, considerando diferentes formatos possíveis
            let organization = '';
            try {
                const url = new URL(collectionUri);
                if (url.hostname.endsWith('.visualstudio.com')) {
                    // Format: https://aglbr.visualstudio.com/
                    organization = url.hostname.split('.')[0];
                }
                else if (url.hostname === 'dev.azure.com') {
                    // Format: https://dev.azure.com/aglbr/
                    const pathParts = url.pathname.split('/').filter(p => p);
                    if (pathParts.length > 0) {
                        organization = pathParts[0];
                    }
                }
            }
            catch (e) {
                this.logService.warn(`Erro ao extrair organization do URI: ${collectionUri}`);
            }
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
            this.repository = new AzureDevOpsRepository_1.AzureDevOpsRepository(organization, project, repositoryId, accessToken, this.logService, pullRequestId);
            // Conectar à API
            await this.repository.initialize();
            this.logService.log('Repositório Azure DevOps inicializado com sucesso!');
            return this.repository;
        }
        catch (error) {
            this.logService.error(`Erro ao inicializar repositório: ${error.message}`);
            return null;
        }
    }
    /**
     * Inicializa o analisador de código
     * @returns Analisador de código inicializado
     */
    async initializeCodeAnalyzer() {
        if (this.codeAnalyzer) {
            return this.codeAnalyzer;
        }
        try {
            // Recuperar configurações para o OpenAI
            const apiKey = tl.getInput('apiKey', true);
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
                this.codeAnalyzer = new OpenAICodeAnalyzer_1.OpenAICodeAnalyzer(apiKey, this.logService, {
                    endpoint: azureApiEndpoint,
                    apiVersion: azureApiVersion,
                    deploymentName: azureModelDeployment || 'gpt-4'
                });
            }
            else {
                // Usar OpenAI padrão
                this.logService.info('Configurando analisador com OpenAI padrão');
                this.codeAnalyzer = new OpenAICodeAnalyzer_1.OpenAICodeAnalyzer(apiKey, this.logService);
            }
            return this.codeAnalyzer;
        }
        catch (error) {
            this.logService.error(`Erro ao inicializar analisador de código: ${error.message}`);
            throw error;
        }
    }
    /**
     * Obtém o serviço de log
     * @returns Serviço de log
     */
    getLogService() {
        return this.logService;
    }
    /**
     * Obtém o serviço de arquivos
     * @returns Serviço de arquivos
     */
    getFileService() {
        return this.fileService;
    }
}
exports.ConfigService = ConfigService;
