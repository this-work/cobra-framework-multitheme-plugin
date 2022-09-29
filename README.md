# Cobra Framework Multitheme Plugin
Cobra-Framework Multitheme nuxt 2.13+ integration


### Requirements
- Nuxt
- Cobra-Framework


### Usage in Nuxt

Install framework dependencies
``` bash
$ npm install @this/cobra-framework-multitheme-plugin
```

Add module in nuxt.config.js
``` js
buildModules: [
    ['@this/cobra-framework-multitheme-plugin/nuxt'],
]
```

### Usage
The plugin creates a separate CSS file in the static folder for each theme. 
The CSS files can be loaded manually into pages or layouts depending on the project.

### Limitations
- Only ```.scss```, ```.sass``` and ```.less``` files will be imported
- A ```/assets/theme/YOURTHEMENAME/scss/theme.scss``` must exist in your theme folder
