/** @type {import('jest').Config} */
module.exports = {
  displayName: 'ui',
  testEnvironment: 'jsdom',
  transform: {
    '^.+\\.[tj]sx?$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.json' }],
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  testMatch: ['<rootDir>/src/**/*.spec.{ts,tsx}', '<rootDir>/src/**/*.test.{ts,tsx}'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  setupFilesAfterEnv: ['<rootDir>/src/__tests__/setup.ts'],
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/index.ts',
    '!src/compat.tsx',
    // Exclude standard shadcn-ui components from coverage (thin wrappers, no custom logic to test)
    '!src/components/alert-dialog.tsx',
    '!src/components/button.tsx',
    '!src/components/card.tsx',
    '!src/components/checkbox.tsx',
    '!src/components/dialog.tsx',
    '!src/components/dropdown-menu.tsx',
    '!src/components/input.tsx',
    '!src/components/label.tsx',
    '!src/components/popover.tsx',
    '!src/components/progress.tsx',
    '!src/components/select.tsx',
    '!src/components/separator.tsx',
    '!src/components/skeleton.tsx',
    '!src/components/slider.tsx',
    '!src/components/switch.tsx',
    '!src/components/tabs.tsx',
    '!src/components/textarea.tsx',
    '!src/components/toast.tsx',
    '!src/components/toaster.tsx',
    '!src/components/tooltip.tsx',
    // Exclude standard shadcn-ui hooks
    '!src/hooks/use-toast.ts',
    // Exclude internal utilities
    '!src/lib/icon-compat.tsx',
    '!src/tokens/index.ts',
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
};
