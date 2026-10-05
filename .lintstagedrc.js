// Config lint-staged du domaine.
export default {
    '*.{ts,tsx,js,mjs,cjs,json,md,yml,yaml}': ['prettier --write'],
    '*.{ts,tsx,js,mjs,cjs}': ['eslint --fix']
};
