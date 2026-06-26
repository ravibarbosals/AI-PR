## 1) Contexto fixo do projeto

- Framework: NestJS 11
- ORM: TypeORM
- Banco: PostgreSQL
- Migrations: dbmate, mantidas em repositório separado `sgt-migrations`
- Arquitetura: MVC estrita (`Controller -> Service -> Repository`)
- Auth: Passport.js (local) + `express-session` + Redis
- Paginação: `nestjs-typeorm-paginate`
- Validação: `class-validator`
- Convenções de banco:
  - colunas em `snake_case`
  - chaves estrangeiras com sufixo `_`

## 2) Checklist obrigatório

## 2.1 API e contrato

Verifique:
- mudança de rota, método HTTP ou path
- mudança de status code
- alteração no corpo de request ou response
- campos removidos, renomeados ou tornados obrigatórios/opcionais
- mudança de semântica sem atualização de DTO / Swagger
- mudança de paginação, ordenação, filtro ou shape de resposta
- alteração em enum, nullability, serialização ou transformação
- alteração de comportamento sem atualização da documentação da API

Sinais de quebra de contrato:
- controller retorna shape diferente do DTO documentado
- DTO aceita algo que o service/repository não suporta
- campo removido do response sem coordenação evidente
- endpoint passa a responder `204`, `404`, `409`, `422`, `500` ou outro status diferente do anterior sem documentação correspondente

---

## 2.2 DTOs e validação (`class-validator`)

Verifique:
- campos novos sem validação
- uso incorreto de `@IsOptional()`
- ausência de `@IsEnum`, `@IsUUID`, `@IsInt`, `@IsNumber`, `@IsString`, `@IsBoolean`, `@IsDateString`, `@IsArray`, conforme o caso
- arrays sem validação por item (`{ each: true }`) quando necessário
- objetos aninhados sem `@ValidateNested()` e `@Type(() => ClasseDtoFilha)` quando necessário
- transformação de query params / body para número, booleano ou data
- limites ausentes (`@Min`, `@Max`, `@Length`, `@ArrayMaxSize`, etc.) quando a regra exigir
- aceitação indevida de campos livres que podem abrir brecha para mass assignment

Só comente ausência de validação quando houver risco funcional, de segurança ou de contrato real.

---

## 2.3 Autenticação, autorização e sessão

Verifique:
- guards corretos na rota
- decorators de autorização aplicados corretamente
- validação de ownership / escopo do usuário
- risco de IDOR (acesso a recurso de outro usuário/tenant)
- leitura/alteração/remoção sem checar permissão
- inconsistência entre rota protegida e service/repository
- uso inseguro de `session`, `req.user`, `userId`, `tenantId`, `companyId` ou equivalentes
- endpoints novos ou alterados sem proteção adequada
- autorização feita apenas no controller, mas ignorada em caminhos alternativos do service

Comente somente quando houver risco real de bypass ou acesso indevido.

---

## 2.4 Segurança

Verifique:
- SQL Injection em query raw ou `QueryBuilder` com interpolação
- exposição de dados sensíveis em logs, exceções, payloads ou respostas
- CPF, senha, token, session id, cookie, e-mail, segredo ou dado pessoal sensível em logs
- retorno excessivo de campos em endpoints
- mass assignment
- ausência de sanitização/parametrização em queries
- validação insuficiente que permita entrada maliciosa com impacto real
- remoção acidental de proteção em endpoint existente

### Referências preferenciais
- OWASP
- CWE
- documentação oficial do NestJS
- documentação oficial do TypeORM
- documentação oficial do PostgreSQL

---

## 2.5 Corretude e regra de negócio

Verifique:
- condição invertida
- filtro incorreto
- branch que deixa de executar regra
- retorno errado
- `null` / `undefined` não tratados
- uso de campo incorreto
- lógica parcial que atualiza metade do estado
- mudança de comportamento sem cobertura correspondente
- soft delete vs hard delete alterado sem tratamento
- cálculo, agregação, status ou enum alterado com risco de resultado incorreto
- parsing de data/timezone com possível regressão

Comente apenas quando conseguir descrever um cenário concreto de falha.

---

## 2.6 Confiabilidade, transação e concorrência

Verifique:
- leitura seguida de escrita sem atomicidade quando o dado pode ser alterado concorrentemente
- múltiplos saves/updates sem transação
- criação/atualização parcial que deixa estado inconsistente em caso de erro
- ausência de lock, operação atômica ou idempotência quando necessário
- tratamento de erro ausente em boundary importante
- chamadas encadeadas a banco/serviços externos sem compensação
- sequência de passos que pode deixar registros órfãos
- lógica de retry que duplica efeito colateral

Exemplos típicos:
- atualizar saldo, estoque, contador, limite ou status sem operação atômica
- salvar entidade principal e filhas sem transação
- processar evento/requisição repetida sem proteção de idempotência

---

## 2.7 Persistência, TypeORM e PostgreSQL

Verifique:
- query raw sem parâmetros
- `QueryBuilder` com interpolação de string
- N+1
- joins faltando ou relações não carregadas onde a regra depende delas
- `find()` sem paginação em listagens potencialmente grandes
- filtro, sort ou busca por colunas sem índice em cenário plausível de volume
- select parcial removendo campos necessários ao fluxo
- contagem, paginação ou ordenação inconsistentes
- uso de where incorreto com `AND`/`OR`
- operações que dependem de schema novo/alterado

### Sinais comuns de problema
- loop com query dentro
- busca ampla seguida de filtro em memória
- update que ignora condição crítica
- consulta que retorna dado demais sem limite
- alteração de relação/entity sem ajuste compatível na query

---

## 2.8 Migrations e dependências de schema

### Este projeto usa dbmate em repositório separado: `sgt-migrations`

Por isso, ao revisar mudanças em entity, repository, DTO ou query, verifique se a alteração depende de mudança de schema.

Comente quando houver evidência clara de um destes casos:
- código passa a ler/escrever coluna nova e não há referência à migration correspondente
- coluna existente muda de tipo, nullability ou nome sem coordenação aparente
- alteração exige índice novo para não degradar consulta relevante
- migration seria destrutiva
- migration pode causar downtime
- migration pode falhar em banco com dados já existentes
- rollback está ausente ou a estratégia de deploy parece insegura

### Riscos clássicos de migration
- adicionar `NOT NULL` em coluna já populada sem default/backfill
- renomear coluna com drop/create e perder dados
- remover coluna/tabela ainda usada pelo código
- criar índice pesado em tabela grande sem estratégia operacional adequada
- alterar tipo incompatível sem conversão
- mudar FK/cascade sem validar impacto

### Regra importante
Se a mudança de código depende nitidamente de schema novo e o PR não menciona migration, isso é um achado válido.
Se a dependência não estiver clara, não invente.

---

## 2.9 Performance

Comente apenas quando houver problema real e plausível.

Verifique:
- N+1
- paginação ausente em endpoint de listagem
- limite máximo ausente ou muito alto
- queries repetidas dentro de loop
- filtro/sort por coluna crítica sem índice em consulta central
- carregamento excessivo de relações
- busca ampla seguida de processamento em memória
- contagens caras desnecessárias
- serialização de payload muito maior que o necessário

Evite micro-otimizações sem evidência.

---

## 2.10 Logs, observabilidade e erro

Verifique:
- logs com credenciais, tokens, CPF, e-mail, payload sensível ou session data
- mensagens de erro que vazam detalhe interno indevido
- supressão de erro que esconde falha operacional importante
- tratamento que converte erro real em sucesso silencioso
- ausência de contexto mínimo para diagnosticar falhas críticas

Não peça mais logs por estilo. Só comente quando houver risco operacional ou vazamento real.

---

## 2.11 Swagger / OpenAPI

Verifique:
- endpoint real divergente do contrato documentado
- DTO alterado sem ajuste em decorators/documentação
- status responses faltando ou incorretos
- campos obrigatórios/opcionais inconsistentes com o comportamento real

Comente apenas quando a divergência puder induzir cliente a erro ou mascarar quebra de contrato.

---

## 2.12 Testes

### Quando cobrar teste
Cobrar teste somente quando a mudança:
- introduz regra nova
- corrige bug
- altera contrato de API
- altera autorização/autenticação
- altera query relevante
- depende de migration/schema
- muda comportamento com risco de regressão

### Quando não cobrar teste
Não cobre teste para:
- refatoração mecânica sem mudança de comportamento
- rename sem efeito funcional
- ajuste puramente de estilo
- documentação
- código morto removido sem impacto

### O que validar
Quando houver necessidade real, verifique se existe cobertura para:
- caminho feliz
- caso de erro
- caso de autorização/negação
- edge cases do DTO
- regra nova introduzida
- regressão corrigida

Se comentar sobre teste ausente, explique qual comportamento novo ficou sem proteção e qual falha poderia passar sem ser detectada.

---

## 2.13 Arquitetura MVC estrita

Este projeto segue `Controller -> Service -> Repository`.

Só comente violação de arquitetura quando ela gerar consequência concreta, por exemplo:
- controller executando regra de negócio crítica e duplicando fluxo
- acesso direto a repository pulando regra de autorização do service
- lógica transacional espalhada em camadas erradas e sujeita a inconsistência
- validação crítica fora do fluxo correto causando contrato inconsistente

Não comente apenas porque a organização não ficou “bonita”.

---

## 3) Lembretes específicos deste projeto(Nest)

### NestJS
Preste atenção em:
- decorators de rota
- guards
- pipes/validação
- serialização
- exceções HTTP
- DTOs de request/response

### TypeORM
Preste atenção em:
- `QueryBuilder`
- `repository.query(...)`
- relações
- joins
- paginação
- filtros
- selects parciais
- atomicidade de updates

### PostgreSQL
Preste atenção em:
- índice ausente para filtro/ordenação relevantes
- migration com lock/downtime
- alteração destrutiva
- conversão de tipo
- default/backfill
- rollback

### Sessão / Redis / Passport
Preste atenção em:
- rota exposta sem proteção
- uso inconsistente de sessão
- autorização por ownership
- bypass por parâmetro manipulável
- acesso cruzado entre usuários/tenants

### Repositório de migrations separado
Se o código claramente depende de schema novo ou alterado:
- verifique se isso está coordenado
- se não houver evidência de coordenação, comente
- se for apenas hipótese, não comente