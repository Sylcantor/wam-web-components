# WAM Host Web Component

## Description
This README explains how to use the WAM Host Web Component to load and use Web Audio Module (WAM) plugins in a web environment. The WAM Host supports instrument and effect plugins, connects them together, provides a MIDI keyboard, and handles live MIDI and audio input.

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

The WAM Host will take care of loading the plugins, connecting them together, and providing a MIDI keyboard to play the instrument. Live audio input will also be handled for effects plugins.