import { defineConfig } from 'vite';

// Build isolado de verificação: não acrescenta rotas ou ferramentas ao produto.
export default defineConfig({ build: { outDir: '.tmp/verification', rollupOptions: {
  input: ['tests/performance.html', 'tests/resilience.html'],
} } });
