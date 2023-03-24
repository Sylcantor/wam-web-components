# WAM Plugin Web Component
## Description
The WAM Plugin Web Component provides a simple way to load and use WAM plugins in a web application. It can be used as a child element of the [WAM Host Web Component](https://github.com/Sylcantor/wam-web-components/tree/main/web-components/wamHost) or standalone for demo purposes.
## Installation
Copy the WAM Plugin Web Component files into your project, making sure to maintain the directory structure. Be sure to include the WAM Plugin Web Component file in your HTML file.
```html
<script type="module" src="path/to/wam-plugin.js"></script>
```
## Usage
To use the WAM Plugin Web Component, add a <wam-plugin> tag in your HTML file with a src attribute pointing to the JavaScript file of the plugin you want to load.  
When used as a standalone demo, the WAM Plugin will load a MIDI keyboard if the plugin is an instrument, or an audio player if the plugin is an effect.
```html
<wam-plugin src="path/to/plugin.js"></wam-plugin>
```
Make sure the JavaScript file of the plugin is accessible from the specified path.
