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
            
            let filesToAnalyze: string[] = [];
            
            // Se estamos em um contexto de Pull Request e o repositório foi inicializado com sucesso
            this.logger.info('Detectado contexto de Pull Request. Baixando arquivos alterados...');
            
            // Criar um diretório temporário para os arquivos do PR
            const prFilesDir = path.join(config.repositoryPath, '.pr_files_temp');
              // Baixar os arquivos alterados no PR
            filesToAnalyze = await repository.downloadPullRequestFiles(prFilesDir, 
                 config.excludePatterns.length > 0 
                    ? config.excludePatterns.map(pattern => `${pattern}`) 
                    : undefined
            );          

            this.logger.info(`Baixados ${filesToAnalyze.length} arquivos do PR para análise.`);

            // Se não houver arquivos para analisar, finalizar a task
            if (filesToAnalyze.length === 0) {
                this.logger.warn('Nenhum arquivo encontrado para análise no Pull Request.');
                tl.setResult(tl.TaskResult.Succeeded, 'Nenhum arquivo encontrado para análise no Pull Request.');
                return;
            }
            
            // Criação do caso de uso de análise
            const analyzeCodeUseCase = new AnalyzeCodeUseCase(
                codeAnalyzer,
                fileService,
                this.logger
            );
            // Executar análise passando os arquivos já baixados do PR
            const report = await analyzeCodeUseCase.execute(
                config.repositoryPath,
                config.excludePatterns,
                config.additionalPrompts,
                filesToAnalyze
            );
            
            // Criação do caso de uso para reportar resultados
            const reportPullRequestIssuesUseCase = new ReportPullRequestIssuesUseCase(
                repository,
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
