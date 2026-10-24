import { defineConfig } from 'vitest/config';
import { resolve } from 'node:path';

export default defineConfig({
  resolve: {
    alias: {
      ddd: resolve(__dirname, 'packages/tools/ddd/src/index.ts'),
      'messages-core': resolve(__dirname, 'packages/tools/messages/src/index.ts'),
      'restaurant-core': resolve(__dirname, 'packages/restaurant/core/src/index.ts'),
      'restaurant-messages': resolve(__dirname, 'packages/restaurant/messages/src/index.ts'),
      'restaurant-adapters': resolve(__dirname, 'packages/restaurant/adapters/index.ts'),
    },
  },
  test: {
    include: ['**/*.test.ts'],
  },
});
