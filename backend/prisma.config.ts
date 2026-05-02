import { defineConfig } from 'prisma/config';

// @ts-ignore — Prisma 7 config shape varies by version
export default defineConfig({
  schema: 'prisma/schema.prisma',
});
