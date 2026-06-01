# X3Timesheet

## O que aprendi sobre time entries no X3

No SAGE X3, o registo de horas de trabalho é feito através do módulo **Time Sheet** (Registo de Atividade), dentro do módulo de Project Management. Cada registo representa um dia de trabalho de um utilizador numa determinada data.

### Estrutura de um Time Sheet

Um Time Sheet é composto por dois níveis:

**Cabeçalho** — identifica o registo principal:
- **ID Time Sheet** — identificador único gerado automaticamente pelo sistema (ex: `SW01ONAL26/001531`)
- **Estabelecimento** — a entidade/empresa à qual o registo pertence (ex: `SW01 - Several Ways`)
- **Utilizador** — o colaborador que registou as horas (ex: `ONAL - Oleksandr Nalyvaiko`)
- **Data** — o dia a que as horas dizem respeito
- **Total Horas** — soma automática das horas de todas as linhas de detalhe
- **Validado** — indica se o registo foi aprovado pelo responsável hierárquico

**Detalhes** — linhas de trabalho realizado nesse dia:
- **Terceiro** — o cliente associado ao trabalho (ex: `CA-00040 - Several Ways Lda`)
- **Razão Social** — nome completo do cliente
- **Projecto** — o projeto onde as horas foram imputadas (ex: `SW012403000255 - SEVWAYS ESTÁGIOS`)
- **Designação** — descrição da atividade realizada
- **Local** — modalidade de trabalho (ex: Remoto, Presencial)
- **Horas Faturadas** — horas a faturar ao cliente
- **Total Horas** — total de horas trabalhadas nessa linha
- **Horas Extra** — horas adicionais fora do horário normal
- **Título Tarefa** — descrição curta da tarefa executada

### Fluxo típico

1. O colaborador cria um novo Time Sheet para o dia
2. Adiciona uma ou mais linhas de detalhe com o projeto e horas
3. O registo fica em estado pendente até ser validado
4. O responsável valida (ou rejeita) o Time Sheet

### Observações importantes

- Cada Time Sheet corresponde a **um único dia** de trabalho
- É possível registar horas em **múltiplos projetos** no mesmo dia (várias linhas de detalhe)
- O ID é gerado automaticamente no formato `[Estab][User][Ano]/[Sequência]`
- Não existe ambiente sandbox — todos os registos são feitos diretamente em produção
- O campo **Projecto** é uma referência obrigatória — não é possível registar horas sem associar a um projeto