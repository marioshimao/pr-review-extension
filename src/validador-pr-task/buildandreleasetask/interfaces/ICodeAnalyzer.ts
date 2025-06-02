import { CodeIssue } from '../entities/CodeIssue';

/**
 * Interface para serviços de análise de código
 * Esta interface abstrai o serviço de análise de código, permitindo diferentes implementações
 */
export interface ICodeAnalyzer {
    /**
     * Analisa arquivos de código fonte e identifica problemas
     * @param files Lista de caminhos de arquivo para analisar
     * @param additionalPrompts Prompts adicionais para customizar a análise
     * @returns Promise com array de problemas encontrados
     */
    analyzeFiles(files: string[], additionalPrompts?: string[]): Promise<CodeIssue[]>;
}
