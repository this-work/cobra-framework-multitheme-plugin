const options = <%= serialize(options) %>;

/**
 *
 * Inject Multitheme as Vue 2 Plugin
 * Can be used in vue 2 context with this.$multitheme
 * @param {function} inject From vue 2 given inject function. Inject something (Param 2) under given name (Param 1) in the vue context
 *
 */
export default ({}, inject) => {

    inject('multitheme', {

        removeThemeStyles() {
            const elements = document.querySelectorAll('[' + options.identificationAttribute + ']');
            elements.forEach(element => {
                element.disabled = true;
                element.remove();
            });
        },

        injectThemeStyles(theme) {
            this.removeThemeStyles();
            if (theme && theme !== options.defaultTheme) {
                this.addThemeStyleToDom(theme);
                this.addThemeStyleToDom(theme, options.fontSuffix);
            }
        },

        addThemeStyleToDom(theme, suffix = '') {

            const element = document.createElement('link');
            element.href = `/${options.path}/${theme}${suffix}.css`;
            element.rel = 'stylesheet';
            element.setAttribute(options.identificationAttribute, theme);

            document.documentElement.append(element);

        }
    });

};
