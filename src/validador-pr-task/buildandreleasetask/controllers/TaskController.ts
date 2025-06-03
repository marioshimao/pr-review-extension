import * as tl from 'azure-pipelines-task-lib/task';
import * as path from 'path';

import { ConfigService } from '../config/ConfigService';
import { AnalyzeCodeUseCase } from '../usecases/AnalyzeCodeUseCase';
import { ReportPullRequestIssuesUseCase } from '../usecases/ReportPullRequestIssuesUseCase';
import { ILogService } from '../interfaces/ILogService';

/**
 * Controlador principal da task
 * Esta classe coordena os casos de uso e o fluxo principal da aplicação
 */
export class TaskController {
    private configService: ConfigService;
    private logger: ILogService;

    constructor(configService: ConfigService) {
        this.configService = configService;
        this.logger = configService.getLogService();
    }

    /**
     * Executa a task principal
     * @returns Promise que resolve quando a task for concluída
     */
    public async execute(): Promise<void> {
        try {
            // Carregar configurações
            const config = await this.configService.loadConfig();
            
            // Inicializar repositório
            const repository = await this.configService.initializeRepository();
            
            // Inicializar analisador de código
            const codeAnalyzer = await this.configService.initializeCodeAnalyzer();
            
            // Obter serviço de arquivos
            const fileService = this.configService.getFileService();
            
            let filesToAnalyze: string[] = [];
            
            // Se estamos em um contexto de Pull Request e o repositório foi inicializado com sucesso
            if (repository && config.isPullRequestContext) {
                this.logger.info('Detectado contexto de Pull Request. Baixando arquivos alterados...');
                
                // Criar um diretório temporário para os arquivos do PR
                const prFilesDir = path.join(config.repositoryPath, '.pr_files_temp');
                  // Baixar os arquivos alterados no PR
                filesToAnalyze = await repository.downloadPullRequestFiles(prFilesDir, 
                    // Converter padrões de exclusão para inclusão (negando-os)
                    config.excludePatterns.length > 0 
                        ? config.excludePatterns.map(pattern => `!${pattern}`) 
                        : undefined
                );
                
                this.logger.info(`Baixados ${filesToAnalyze.length} arquivos do PR para análise.`);
            } else {
                // Caso não seja um PR ou não tenha sido possível inicializar o repositório,
                // use a abordagem padrão de busca local de arquivos
                this.logger.info('Usando busca local de arquivos...');
                filesToAnalyze = await fileService.findFiles(config.repositoryPath, config.excludePatterns);
            }
            
            // Criação do caso de uso de análise
            const analyzeCodeUseCase = new AnalyzeCodeUseCase(
                codeAnalyzer,
                fileService,
                this.logger
            );
            
            // Executar análise
            const report = await analyzeCodeUseCase.execute(
                config.repositoryPath,
                config.excludePatterns,
                config.additionalPrompts
            );
            
            // Criação do caso de uso para reportar resultados
            const reportPullRequestIssuesUseCase = new ReportPullRequestIssuesUseCase(
                repository || { 
                    initialize: async () => {},
                    isPullRequestContext: async () => false,
                    downloadPullRequestFiles: async () => [],
                    addPullRequestComment: async () => {},
                    setPullRequestStatus: async () => {},
                    addAnalysisResultToPullRequest: async () => {}
                },
                fileService,
                this.logger
            );
            
            // Reportar resultados
            const success = await reportPullRequestIssuesUseCase.execute(
                report,
                config.repositoryPath,
                config.outputFilePath,
                config.failOnIssues
            );
            
            // Definir resultado da task
            if (!success) {
                tl.setResult(tl.TaskResult.Failed, `Análise de código falhou. Verifique o relatório para detalhes.`);
            } else {
                tl.setResult(tl.TaskResult.Succeeded, 'Análise de código concluída com sucesso.');
            }
            
        } catch (error: any) {
            this.logger.error(`Erro durante execução da task: ${error.message}`);
            tl.setResult(tl.TaskResult.Failed, error.message);
        }
    }
}
