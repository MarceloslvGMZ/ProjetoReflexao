import { defineConfig } from 'vitest/config';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    globals: true,
    root: './',
    include: ['**/*.e2e-spec.ts'],
    env: {
      DB_STORAGE: ':memory:',
      JWT_SECRET: 'segredo-dos-testes-e2e',
      ADMIN_CPF: '12345678909',
      ADMIN_USUARIO: 'admin',
      ADMIN_SENHA: 'Admin12345',
    },
  },
});
