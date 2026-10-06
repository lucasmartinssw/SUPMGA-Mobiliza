# SUPMGAMobiliza

Protótipo sustentável em React + Vite, com dados fictícios e armazenamento no navegador.

## Executar

```sh
npm install
npm run dev
npm test
npm run build
```

Login demonstrativo: **lucas@supmga.demo** / **Mobiliza123**. A sessão fica na aba; sair preserva os históricos. Não há autenticação real ou back-end.

## Ciclo das mobilizações

1. Crie uma mobilização, selecione materiais, revise quantidades e datas e salve o planejamento.
2. Inicie a mobilização: a saída reduz o estoque livre e exige saldo suficiente. Materiais retornados e recuperados são priorizados, registrando automaticamente seu novo uso e a mobilização de origem.
3. Conclua a obra: a tela de triagem reúne todos os materiais ainda não conferidos de todas as mobilizações concluídas.
4. Distribua o total entre reutilizável, recuperação, destinação, consumo, desperdício e perda. A soma deve fechar o total enviado. Unidades são inteiras; metros admitem duas casas decimais. Perda/desperdício exige justificativa.
5. Materiais aptos voltam ao estoque livre. A classificação para destinação é sugerida pela descrição/categoria e pode ser corrigida. Disjuntores sugerem eletroeletrônicos.
6. Em **Destinação sustentável**, clique no material para abrir o modal. Registre o resultado técnico da recuperação: apto retorna ao estoque; sem recuperação fica pendente de destinação. É possível avaliar parte da quantidade e continuar depois.
7. Confirme a entrega ao ponto compatível com data, responsável e referência do comprovante. Pode anexar PNG, JPEG ou PDF de até 750 KB e baixá-lo no histórico dos indicadores. A confirmação abrange toda a quantidade de descarte pendente naquele momento. Se outra recuperação falhar posteriormente, sua quantidade permite uma nova entrega sem duplicar a anterior.

**Inventário** apresenta saldos agregados CAT e permite registrar entradas com quantidade, responsável e data. Saídas anteriores à atualização não são descontadas retroativamente do saldo inicial. Saldos e registros atuais ficam juntos em `supmgamobiliza-cycle-v2`; dados anteriores em `supmgamobiliza-mobilizations-v1` e planejamentos legados são preservados e importados.

## Indicadores

Filtros por período e mobilização permitem consultar consumo, desperdício, perda, recuperação, reutilização e destinação confirmada. Eventos seguem suas datas informadas; disponibilidade e pendências mostram a situação atual. Unidades e metros são contabilizados separadamente. O histórico completo da mobilização selecionada mantém avaliações, reutilizações e comprovantes.

O custo de reposição não aparece na triagem. Conferências novas gravam `unitCost: null`; valores históricos são preservados e podem alimentar a estimativa de compra evitada. Valores desconhecidos não são inventados. Não há Área de Suprimentos.

## Fichas individuais anteriores

As fichas MAT permanecem em seções separadas, com etiqueta atual, número interno, RFID opcional, movimentações e histórico. Seus eventos avulsos não são atribuídos automaticamente às mobilizações CAT. A busca aceita etiqueta, número interno, descrição, contrato e RFID opcional. Códigos duplicados ou históricos reservados não podem ser vinculados a outra ficha. Não há hardware integrado.

## Limites do protótipo

Os destinos e locais sugeridos são demonstrativos e precisam ser substituídos por pontos reais validados pela empresa. Confirmações e anexos não representam certificação ambiental. Dados e arquivos ficam apenas no navegador, sujeitos ao limite de armazenamento; não há compartilhamento entre usuários. A logo oficial permanece no login e menu. A publicação na main aciona o CI/CD existente na Vercel.
