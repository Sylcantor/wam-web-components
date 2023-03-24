# WAM Host Web Component

## Description
The WAM Host Web Component provides a simple way to load and use WAM plugins in a web application. It supports instrument and effect plugins, connects them together, provides a MIDI keyboard, and handles live MIDI and audio input.
## Installation
Copy the WAM Host Web Component files into your project, making sure to maintain the directory structure. Be sure to include the WAM Host Web Component file in your HTML file.
```html
<script type="module" src="path/to/wam-host.js"></script>
```
## Usage
To use the WAM Host Web Component, add a <wam-host> tag in your HTML file and add <wam-plugin> tags as children of this tag. Each <wam-plugin> tag must have a src attribute pointing to the JavaScript file of the plugin to load.
```html
<wam-host>
    <wam-plugin src="path/to/plugin1.js"></wam-plugin>
    <wam-plugin src="path/to/plugin2.js"></wam-plugin>
</wam-host>
```
Make sure the JavaScript files of the plugins are accessible from the specified paths and wam-plugin.js is imported in your HTML file.  
See [WAM Plugin Web Component](https://github.com/Sylcantor/wam-web-components/tree/main/web-components/wamPlugin) for more information on how to use the WAM Plugin Web Component.