"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AnalyzeCodeUseCase = void 0;
const AnalysisReport_1 = require("../entities/AnalysisReport");
const CodeIssue_1 = require("../entities/CodeIssue");
/**
 * Caso de uso para analisar código e gerar relatório
 * Esta classe implementa a lógica de negócio para analisar código fonte e gerar um relatório
 */
class AnalyzeCodeUseCase {
    codeAnalyzer;
    fileService;
    logger;
    /**
     * Construtor para a classe AnalyzeCodeUseCase
     * @param codeAnalyzer Analisador de código
     * @param fileService Serviço de arquivos
     * @param logger Serviço de log
     */
    constructor(codeAnalyzer, fileService, logger) {
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
    async execute(repositoryPath, excludePatterns = [], additionalPrompts) {
        try {
            this.logger.info(`Iniciando análise de código em: ${repositoryPath}`);
            this.logger.info(`Padrões de exclusão: ${excludePatterns.join(', ')}`);
            // Encontrar arquivos para análise
            const filesToAnalyze = await this.fileService.findFiles(repositoryPath, excludePatterns);
            this.logger.info(`Encontrados ${filesToAnalyze.length} arquivos para análise.`);
            if (filesToAnalyze.length === 0) {
                this.logger.warn('Nenhum arquivo encontrado para análise.');
                return new AnalysisReport_1.AnalysisReport([]);
            }
            // Analisar arquivos
            const codeIssues = await this.codeAnalyzer.analyzeFiles(filesToAnalyze, additionalPrompts);
            this.logger.info(`Análise concluída. Encontrados ${codeIssues.length} problemas.`);
            // Criar relatório
            const report = new AnalysisReport_1.AnalysisReport(codeIssues);
            return report;
        }
        catch (error) {
            this.logger.error(`Erro durante a análise de código: ${error.message}`);
            // Criar um relatório de erro
            const errorIssue = new CodeIssue_1.CodeIssue('global', 0, `Erro global na análise: ${error.message}`, 'high');
            return new AnalysisReport_1.AnalysisReport([errorIssue]);
        }
    }
}
exports.AnalyzeCodeUseCase = AnalyzeCodeUseCase;
