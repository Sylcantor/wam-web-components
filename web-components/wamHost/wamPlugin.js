const template = document.createElement('template');
template.innerHTML = `
    <div class="wam-plugin">
        <slot></slot>
    </div>
    <style>
        .wam-plugin {
            margin: 10px
        }
    </style>
`;

class WamPlugin extends HTMLElement {
    constructor() {
        super();
        const root = this.attachShadow({ mode: 'open' });

        root.appendChild(template.content.cloneNode(true));

        //get the div with class wam-plugin
        this.mount = root.querySelector('.wam-plugin');
        this.src = this.getAttribute('src');

        // Safari...
        this.AudioContext = window.AudioContext // Default
        || window.webkitAudioContext // Safari and old versions of Chrome
        || false;

        this.audioContext = new AudioContext();
    }
  
    connectedCallback() {
        if(this.parentNode.nodeName !== 'WAM-HOST') {
            console.log("test")
            this.audioContext = new AudioContext();
            this.loadPluginDemo();
        }
    }

    loadPlugin = async (audioContext,hostGroupId) => {
        


        
        // Import WAM
        const { default: WAM } = await import(this.src);
        
        // Create a new instance of the plugin
        // You can can optionnally give more options such as the initial state of the plugin
        const instance = await WAM.createInstance(hostGroupId, audioContext);

        window.instance = instance;

        console.log(instance);

        // Load the GUI if need (ie. if the option noGui was set to true)
        // And calls the method createElement of the Gui module
        const pluginDomNode = await instance.createGui();


        this.mountPlugin(pluginDomNode);


        return instance;
    };


    // Very simple function to connect the plugin audionode to the host
    connectPlugin = (audioNode,dest,keyboardAudioNode) => {
        //this.mediaElementSource.connect(audioNode); this.mediaElementSource is src

        //keyboard is optional
        if(keyboardAudioNode) {
            keyboardAudioNode.connect(audioNode);
            keyboardAudioNode.connectEvents(audioNode.instanceId);
        }
        //audioNode.connect(this.audioContext.destination); this.audioContext.destination is dest
        audioNode.connect(dest);
    };

    // Very simple function to append the plugin root dom node to the host
    mountPlugin = (domNode) => {
        this.mount.innerHtml = '';
        this.mount.appendChild(domNode);
    };

    loadAudio = () => {
        const audio = document.createElement('audio');
        audio.id = 'player';
        audio.src = "https://mainline.i3s.unice.fr/PedalEditor/Back-End/functional-pedals/published/StonePhaserSib/CleanGuitarRiff.mp3";
        audio.controls = true;
        audio.loop = true;
        audio.crossOrigin = 'anonymous';
        // Il faut une interaction pour que l'audioContext soit activé
        audio.onplay =  () => {
            this.audioContext.resume();
        };

        this.mount.appendChild(audio);
        this.mediaElementSource = this.audioContext.createMediaElementSource(audio);

    };

    loadKeyboard = () => {
        let keyboard = this.getAttribute('keyboard');
        if(keyboard === null || !keyboard.endsWith('.js')) {
            keyboard = "./assets/midiKeyboard/simpleMidiKeyboard/index.js";
        }
        return keyboard;
    };

    loadInstrument = async (instance,hostGroupId) => {

        const keyboard = this.loadKeyboard();
        const { default : keyboardWAM } = await import(keyboard);
        const instanceKeyboard = await keyboardWAM.createInstance(hostGroupId, this.audioContext);

        this.connectPlugin(instance.audioNode,this.audioContext.destination,instanceKeyboard.audioNode);

        const keyboardUi = await instanceKeyboard.createGui();
        keyboardUi.onclick = () => {
            this.audioContext.resume();
            console.log("click");
        }
        this.mountPlugin(keyboardUi);
    };

    loadEffect = async (instance) => {
        this.loadAudio();
        this.connectPlugin(this.mediaElementSource,instance.audioNode);
        this.connectPlugin(instance.audioNode,this.audioContext.destination);
    };

    loadPluginDemo = async () => {
        console.log("loadPluginDemo");
        // Init WamEnv
        const { default: initializeWamHost } = await import("./lib/sdk/src/initializeWamHost.js");
        const [hostGroupId] = await initializeWamHost(this.audioContext);
        
        // Import WAM
        const { default: WAM } = await import(this.src);
        
        // Create a new instance of the plugin
        // You can can optionnally give more options such as the initial state of the plugin
        const instance = await WAM.createInstance(hostGroupId, this.audioContext);

        window.instance = instance;

        if(instance.descriptor.isInstrument) {
            this.loadInstrument(instance,hostGroupId);
        }
        else if(!instance.descriptor.isInstrument) {
            this.loadEffect(instance);
        }
        
        // Load the GUI if need (ie. if the option noGui was set to true)
        // And calls the method createElement of the Gui module
        const pluginDomNode = await instance.createGui();

        this.mountPlugin(pluginDomNode);

        this.plugin = instance;
        this.dispatchEvent(new CustomEvent('pluginLoaded', { detail: this.plugin }));
    }; 
}
export { WamPlugin }
customElements.define("wam-plugin", WamPlugin);