# Publicando a Extensão no Azure DevOps Marketplace

Este guia explica como publicar a extensão "Validador de Pull Request" no Azure DevOps Marketplace como uma extensão pública.

## Pré-requisitos

1. Uma conta Microsoft que será associada ao publisher
2. Node.js e npm instalados
3. TFX CLI instalado (`npm install -g tfx-cli`)

## Passos para Publicação

### 1. Criar um Publisher

Se você ainda não tem um publisher no Azure DevOps Marketplace:

1. Acesse [https://marketplace.visualstudio.com/manage/publishers](https://marketplace.visualstudio.com/manage/publishers)
2. Clique em "Create publisher"
3. Preencha as informações necessárias:
   - **Publisher ID**: Identificador único (ex: "MarioKShimao")
   - **Display name**: Nome para exibição (ex: "Mario K. Shimao")
   - **Descrição**: Breve descrição sobre você/sua empresa

### 2. Atualizar o ID do Publisher no Manifest

Se necessário, atualize o ID do publisher no arquivo `src/validador-pr-task/vss-extension.json`:

```json
{
    "manifestVersion": 1,
    "id": "validador-pr-task",
    "name": "Validador de Pull Request",
    "version": "0.1.0",
    "publisher": "SeuPublisherID",
    ...
}
```

### 3. Empacotar a Extensão

Execute o script de empacotamento fornecido:

```powershell
.\empacotar-extensao.ps1
```

Isto criará um arquivo .vsix na pasta `src/validador-pr-task/`.

### 4. Publicar a Extensão

1. Acesse [https://marketplace.visualstudio.com/manage/publishers](https://marketplace.visualstudio.com/manage/publishers)
2. Selecione seu publisher
3. Clique em "New extension" > "Azure DevOps"
4. Escolha "Upload your extension" e selecione o arquivo .vsix gerado
5. Clique em "Upload"

### 5. Definindo Visibilidade da Extensão

Por padrão, a extensão será enviada como pública mas não será imediatamente visível no marketplace público.

Para publicar a extensão no marketplace público:

1. Vá para a página de gerenciamento da extensão
2. Clique em "Share/Publish"
3. Selecione "Public" para tornar a extensão disponível para todos
4. Clique em "Confirm"

### 6. Atualizando a Extensão

Para atualizar versões futuras:

1. Incremente o número da versão no arquivo `vss-extension.json` e `task.json`
2. Execute o script de empacotamento novamente
3. Acesse a página de gerenciamento da extensão e faça upload da nova versão

## Verificando a Publicação

Após a publicação, sua extensão estará disponível em:
`https://marketplace.visualstudio.com/items?itemName=SeuPublisherID.validador-pr-task`

## Recursos Adicionais

- [Documentação oficial de publicação de extensões](https://docs.microsoft.com/en-us/azure/devops/extend/publish/overview?view=azure-devops)
- [Gerenciando extensões no Marketplace](https://docs.microsoft.com/en-us/azure/devops/extend/publish/manage-extensions?view=azure-devops)
