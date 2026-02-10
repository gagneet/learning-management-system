import { defineConfig } from '@prisma/client';

const config = defineConfig({
  adapter: {
    provider: 'postgresql',
    url: process.env.DATABASE_URL!,
  },
});

export default config;
