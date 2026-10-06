# SUPMGAMobiliza

Protótipo navegável em React + Vite, com dados de demonstração e sem back-end.

```sh
npm install
npm run dev
```

Abra o endereço exibido pelo Vite. Para gerar a versão de produção: `npm run build`.

A tela inicial é **Nova mobilização**. O menu inclui **Identificação e movimentações**, Inventário, Cadastro, Visão geral, Retorno e triagem, Indicadores e Configuração.

## Roteiro de identificação e movimentações

1. No cenário inicial, **MAT-001** já está cadastrado com **ETQ-002**, sua etiqueta física existente. O formato dessa etiqueta não foi confirmado; não é presumido como QR, código de barras ou RFID.
2. Em **Identificação e movimentações**, digite **ETQ-002** e clique em **Localizar ficha**. A busca do Inventário também aceita esse código.
3. Registre **Saída para contrato**, informando destino, CONTRATO-034, data e responsável. O status passa a **Em contrato**.
4. Localize novamente pela etiqueta atual e registre **Remanejamento** para CONTRATO-041, mantendo MAT-001.
5. Em **Retorno e triagem**, localize ETQ-002 e salve **Retorno ao galpão**. O item fica **Aguardando triagem**.
6. Selecione **Apto**, confirme a conferência e conclua a triagem. O item fica **Livre**; a ficha mostra **MAT-001 = MAT-001**.
7. Opcionalmente, clique em **Vincular/substituir RFID opcional** e vincule **RFID-1001**. A leitura simulada passa a abrir a mesma MAT-001, preservando ETQ-002. RFID é uma possibilidade de evolução futura, não uma identificação já adotada pela empresa.
8. Se a etiqueta atual for perdida e substituída, use **Registrar perda/troca da etiqueta atual**. Informe novo código, motivo, data e responsável. O histórico guarda os códigos antigo e novo; o número interno e o RFID opcional permanecem iguais. A substituição de RFID possui ação própria e também registra seu histórico.

Cada ficha separa `idInterno`, `codigoEtiquetaAtual` e `rfidId` opcional. Códigos duplicados são impedidos no cadastro, na troca da etiqueta atual e no vínculo RFID; códigos antigos registrados no histórico também ficam reservados à ficha original. Busca manual aceita etiqueta atual, número interno, SISUP simulado, RFID opcional, descrição e contrato. Equipamentos, etiquetas, leituras e eventos são salvos automaticamente no `localStorage`. Não há hardware ou integração externa.

Dados salvos em versões anteriores são preservados: `etiquetaVisual` migra para `codigoEtiquetaAtual` mantendo o valor existente. Assim, quem já tinha uma ficha com EQ-001 deve continuar buscando EQ-001; não há troca automática para ETQ-002 nem reinicialização do histórico. ETQ-002 é o exemplo para o cenário inicial sem dados salvos.

## Planejamento

Adicione materiais e valide a lista como gestor para consultar saldos, retornos e faltas. Alterar o plano exige nova validação. **Salvar planejamento** guarda o rascunho no navegador. O cenário agregado usa códigos **CAT** e mantém os exemplos de disjuntores, conectores e cabos; as fichas individuais usam **MAT** e têm seu próprio estado demonstrativo. Movimentar uma ficha não altera os números desse cenário agregado.

Retorno previsto não representa disponibilidade confirmada. Metros e unidades não são somados. Compra direta e Web Supply-PMA são apenas etiquetas de avaliação com classes fictícias. **Configuração → Piloto futuro** descreve os requisitos para um teste real, sem implementá-lo.


## Login demonstrativo

A tela inicial agora é o login. Use **lucas@supmga.demo** e **Mobiliza123**, ou clique em **Preencher dados de teste**. O perfil é Lucas Martins. A sessão é mantida em `sessionStorage` na aba; **Sair do sistema** encerra o acesso demonstrativo sem apagar os materiais e históricos salvos. Este fluxo não implementa autenticação real, autorização ou proteção de dados; não deve ser usado como segurança de produção.

## Destinação após a triagem

1. Em **Retorno e triagem**, abra **MAT-003** (ETQ-004), inicialmente aguardando triagem, ou registre o retorno de outro equipamento em contrato.
2. Selecione **Não reutilizável**, classifique o tipo de material e confirme a conferência.
3. Ao concluir, o sistema abre **Destinação sustentável** com a mesma ficha selecionada. O item fica **Aguardando destinação**, sem voltar ao estoque livre.
4. Consulte o ponto demonstrativo compatível, selecione-o e informe responsável e data prevista para registrar o encaminhamento.
5. O status passa a **Encaminhamento planejado**. A ficha conserva o número interno, o local físico atual e todo o histórico; o destino planejado fica registrado separadamente. A entrega física não é confirmada por esta ação.

Pontos de segregação e destinos são fictícios: metais e cabos, eletroeletrônicos, plásticos e avaliação especializada para material contaminado ou sem classificação. A empresa deverá validar as regras e cadastrar os locais, endereços e parceiros reais antes de usar a recomendação operacionalmente. Danificado, manutenção e perdido não são automaticamente tratados como descarte. A página pode ser reaberta pelo menu; materiais e encaminhamentos persistem no `localStorage` existente.

## Triagem guiada

**Retorno e triagem** possui duas listas: **Aguardando triagem** e **Registrar retorno**. A busca aceita nome, número interno, etiqueta e contrato. Clique em **Iniciar triagem** no material recebido, escolha uma condição nos cartões e avance em **Revisar resultado**. Nenhum resultado é pré-selecionado. A etapa final mostra o efeito da escolha, pede data, responsável e confirmação antes de gravar. Materiais não reutilizáveis exigem classificação e seguem para os destinos sugeridos. O recebimento de material em contrato pode ser registrado diretamente na lista **Registrar retorno**, abrindo a avaliação na sequência; a ficha completa permanece acessível em **Consultar ficha e histórico**. A triagem guiada utiliza o mesmo histórico e armazenamento das fichas existentes.


Na destinação, a classificação é sugerida automaticamente a partir de `tipoMaterial` do cadastro, quando válido, ou de palavras reconhecidas na descrição/categoria. Disjuntores sugerem eletroeletrônicos; metais/cabos e plásticos têm sugestões próprias. Referências explícitas a óleo/contaminação na descrição direcionam à avaliação especializada. O operador pode corrigir a sugestão, que não substitui a avaliação da condição física. Materiais não reconhecidos continuam exigindo seleção manual.
