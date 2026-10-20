# ViaFácil

Sistema de transporte escolar. O backend é uma API NestJS e o frontend é uma aplicação Angular. Os formulários da tela não são escritos campo a campo: a API lê os próprios DTOs por reflexão e o Angular desenha o que essa leitura descreve.

O banco usado no desenvolvimento é o `backend/database.sqlite`, já com registros de exemplo. Nenhum desses dados é de uma pessoa real.

## Depois de clonar

É preciso Node.js `^22.22.3`, `^24.15.0` ou `>=26`, e pnpm `10.18.2`. O pnpm é ativado pelo Corepack, que já vem com o Node:

```powershell
corepack enable
corepack prepare pnpm@10.18.2 --activate
pnpm install
```

O arquivo `backend/.env` não vai no Git. Crie esse arquivo com:

```
PORT=3333
DB_STORAGE=./database.sqlite
CORS_ORIGIN=http://localhost:4200

JWT_SECRET=cadastro-trasporte-publico-estudantil-gps
JWT_EXPIRES_IN=432000
ADMIN_CPF=39053344705
ADMIN_USUARIO=admin
ADMIN_SENHA=admin12345
```

`ADMIN_USUARIO` e `ADMIN_SENHA` só criam o administrador quando o banco ainda não tem nenhum usuário. No `database.sqlite` deste repositório ele já existe.

Na raiz do projeto:

```powershell
pnpm dev
```

A API fica em `http://localhost:3333` e a tela em `http://localhost:4200`.

| Usuário | Senha | Perfil |
| --- | --- | --- |
| `admin` | `admin12345` | Administrador |
| `joao` | `Motorista123` | Motorista |
| `ana` | `Estudante123` | Estudante |

`pnpm test`, `pnpm lint` e `pnpm build` rodam nos dois pacotes pelo Turborepo.

## Como a API descobre os formulários

Ninguém entrega ao frontend uma lista de controllers. Quem sobe a aplicação é o NestJS, e ele já registrou cada classe marcada com `@Controller`. O `FormulariosService` (`backend/src/shared/infrastructure/http/formulario/formularios.service.ts`) implementa `OnModuleInit`. O NestJS chama `onModuleInit` uma vez, quando o módulo fica pronto.

Esse método pede os controllers ao `DiscoveryService` (`getControllers`). Para cada classe, o `MetadataScanner` lista os nomes dos métodos do protótipo (`getAllMethodNames`). O nome do método vira a ação. Em `entrar`, a ação é `entrar`.

Para cada método, três leituras montam o formulário:

- `Reflect.getMetadata('design:paramtypes', ...)` devolve as classes dos parâmetros. O TypeScript grava isso na compilação porque o projeto usa `emitDecoratorMetadata`. Se uma dessas classes tem campos anotados com `@Campo`, ela é o DTO do formulário. Em `AuthController.entrar(@Body() dto: LoginDto)`, o parâmetro encontrado é `LoginDto`.
- O `Reflector` lê os metadados que o próprio NestJS gravou: `@Controller('auth')` e `@Post('login')`. Daí saem o recurso `auth`, o caminho `/auth/login` e o método HTTP `POST`.
- `lerCampos` lê a lista que o decorator `@Campo` gravou na classe do DTO. Cada propriedade passa por `Campo` quando o arquivo da classe é carregado. Ali, `design:type` diz se a propriedade é `String`, `Number` ou `Boolean`. `String` vira `texto`, a menos que o decorator informe outro tipo, como `tipo: 'senha'`.

O resultado fica num array na memória. `GET /formularios` devolve o array inteiro. `GET /formularios/auth/entrar` procura o item cujo recurso é `auth` e cuja ação é `entrar`. Essa busca não percorre as classes de novo.

Um método sem DTO anotado com `@Campo` não vira formulário. `GET /auth/me` é um exemplo: ele entra na varredura e é descartado porque nenhum parâmetro tem campos.

## Como a tela usa essa descrição

`login.html` só informa `recurso="auth"` e `acao="entrar"` ao componente `FormularioDinamico`. O componente chama `FormulariosService.buscar` no frontend, que faz `GET /formularios/auth/entrar`. Com o JSON, `montarFormulario` cria os campos.

No envio, o mesmo componente usa o `metodo` e o `caminho` que vieram na descrição (`POST` e `/auth/login`). Não há endereço de login escrito na tela. Quem recebe é `AuthController.entrar`, e esse método chama `LoginUseCase.executar`. A reflexão descreve o formulário. A autenticação continua no caso de uso.

O mesmo caminho vale para ônibus, pessoas, rotas, ocorrências e usuários: muda o recurso e a ação (`onibus` / `criar`, por exemplo), não o mecanismo.
