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
exports.TaskController = void 0;
const tl = __importStar(require("azure-pipelines-task-lib/task"));
const path = __importStar(require("path"));
const AnalyzeCodeUseCase_1 = require("../usecases/AnalyzeCodeUseCase");
const ReportPullRequestIssuesUseCase_1 = require("../usecases/ReportPullRequestIssuesUseCase");
/**
 * Controlador principal da task
 * Esta classe coordena os casos de uso e o fluxo principal da aplicação
 */
class TaskController {
    configService;
    logger;
    constructor(configService) {
        this.configService = configService;
        this.logger = configService.getLogService();
    }
    /**
     * Executa a task principal
     * @returns Promise que resolve quando a task for concluída
     */
    async execute() {
        try {
            // Carregar configurações
            const config = await this.configService.loadConfig();
            // Inicializar repositório
            const repository = await this.configService.initializeRepository();
            // Verificar se estamos em um contexto de Pull Request
            if (!repository || !config.isPullRequestContext) {
                this.logger.info('Não estamos em um contexto de Pull Request. Finalizando a task sem realizar análise.');
                tl.setResult(tl.TaskResult.Succeeded, 'Task finalizada. Não é um contexto de Pull Request.');
                return;
            }
            // Inicializar analisador de código
            const codeAnalyzer = await this.configService.initializeCodeAnalyzer();
            // Obter serviço de arquivos
            const fileService = this.configService.getFileService();
            let filesToAnalyze = [];
            // Se estamos em um contexto de Pull Request e o repositório foi inicializado com sucesso
            this.logger.info('Detectado contexto de Pull Request. Baixando arquivos alterados...');
            // Criar um diretório temporário para os arquivos do PR
            const prFilesDir = path.join(config.repositoryPath, '.pr_files_temp');
            // Baixar os arquivos alterados no PR
            filesToAnalyze = await repository.downloadPullRequestFiles(prFilesDir, config.excludePatterns.length > 0
                ? config.excludePatterns.map(pattern => `${pattern}`)
                : undefined);
            this.logger.info(`Baixados ${filesToAnalyze.length} arquivos do PR para análise.`);
            // Se não houver arquivos para analisar, finalizar a task
            if (filesToAnalyze.length === 0) {
                this.logger.warn('Nenhum arquivo encontrado para análise no Pull Request.');
                tl.setResult(tl.TaskResult.Succeeded, 'Nenhum arquivo encontrado para análise no Pull Request.');
                return;
            }
            // Criação do caso de uso de análise
            const analyzeCodeUseCase = new AnalyzeCodeUseCase_1.AnalyzeCodeUseCase(codeAnalyzer, fileService, this.logger);
            // Executar análise passando os arquivos já baixados do PR
            const report = await analyzeCodeUseCase.execute(config.repositoryPath, config.excludePatterns, config.additionalPrompts, filesToAnalyze);
            // Criação do caso de uso para reportar resultados
            const reportPullRequestIssuesUseCase = new ReportPullRequestIssuesUseCase_1.ReportPullRequestIssuesUseCase(repository, fileService, this.logger);
            // Reportar resultados
            const success = await reportPullRequestIssuesUseCase.execute(report, config.repositoryPath, config.outputFilePath, config.failOnIssues);
            // Definir resultado da task
            if (!success) {
                tl.setResult(tl.TaskResult.Failed, `Análise de código falhou. Verifique o relatório para detalhes.`);
            }
            else {
                tl.setResult(tl.TaskResult.Succeeded, 'Análise de código concluída com sucesso.');
            }
        }
        catch (error) {
            this.logger.error(`Erro durante execução da task: ${error.message}`);
            tl.setResult(tl.TaskResult.Failed, error.message);
        }
    }
}
exports.TaskController = TaskController;
