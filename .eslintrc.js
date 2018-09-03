module.exports = {
    extends: 'airbnb-base',
    rules: {
        "max-len": ['error', 120, 2, {
            ignoreUrls: true,
            ignoreComments: false,
            ignoreRegExpLiterals: true,
            ignoreStrings: true,
            ignoreTemplateLiterals: true,
        }]
    }
};