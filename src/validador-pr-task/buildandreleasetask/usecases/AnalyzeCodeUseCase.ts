import { ICodeAnalyzer } from '../interfaces/ICodeAnalyzer';
import { IFileService } from '../interfaces/IFileService';
import { ILogService } from '../interfaces/ILogService';
import { AnalysisReport } from '../entities/AnalysisReport';
import { CodeIssue } from '../entities/CodeIssue';

/**
 * Caso de uso para analisar código e gerar relatório
 * Esta classe implementa a lógica de negócio para analisar código fonte e gerar um relatório
 */
export class AnalyzeCodeUseCase {
    private codeAnalyzer: ICodeAnalyzer;
    private fileService: IFileService;
    private logger: ILogService;

    /**
     * Construtor para a classe AnalyzeCodeUseCase
     * @param codeAnalyzer Analisador de código
     * @param fileService Serviço de arquivos
     * @param logger Serviço de log
     */
    constructor(
        codeAnalyzer: ICodeAnalyzer,
        fileService: IFileService,
        logger: ILogService
    ) {
        this.codeAnalyzer = codeAnalyzer;
        this.fileService = fileService;
        this.logger = logger;
    }

    /**
     * Analisa um conjunto de arquivos e gera um relatório
     * @param repositoryPath Caminho base do repositório
     * @param excludePatterns Padrões para excluir arquivos
     * @param additionalPrompts Prompts adicionais para análise
     * @returns Promise com o relatório de análise
     */
    public async execute(
        repositoryPath: string,
        excludePatterns: string[] = [],
        additionalPrompts?: string[]
    ): Promise<AnalysisReport> {
        try {
            this.logger.info(`Iniciando análise de código em: ${repositoryPath}`);
            this.logger.info(`Padrões de exclusão: ${excludePatterns.join(', ')}`);

            // Encontrar arquivos para análise
            const filesToAnalyze = await this.fileService.findFiles(repositoryPath, excludePatterns);
            this.logger.info(`Encontrados ${filesToAnalyze.length} arquivos para análise.`);

            if (filesToAnalyze.length === 0) {
                this.logger.warn('Nenhum arquivo encontrado para análise.');
                return new AnalysisReport([]);
            }

            // Analisar arquivos
            const codeIssues = await this.codeAnalyzer.analyzeFiles(filesToAnalyze, additionalPrompts);
            this.logger.info(`Análise concluída. Encontrados ${codeIssues.length} problemas.`);

            // Criar relatório
            const report = new AnalysisReport(codeIssues);
            return report;
        } catch (error: any) {
            this.logger.error(`Erro durante a análise de código: ${error.message}`);
            
            // Criar um relatório de erro
            const errorIssue = new CodeIssue(
                'global',
                0,
                `Erro global na análise: ${error.message}`,
                'high'
            );
            
            return new AnalysisReport([errorIssue]);
        }
    }
}
