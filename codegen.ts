import type { CodegenConfig } from '@graphql-codegen/cli';

const apiUrl = process.env.VITE_API_URL || 'http://localhost:4000';

const config: CodegenConfig = {
  overwrite: true,
  schema: `${apiUrl}/graphql`,
  documents: 'src/**/*.{ts,tsx,graphql}',
  generates: {
    'src/gql/': {
      preset: 'client',
      presetConfig: {
        gqlTagName: 'gql',
      },
    },
  },
};

export default config;
