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
        this.audioContext;
        this.instance;
        this.domNode; // The GUI of the plugin

        // Safari...
        this.AudioContext = window.AudioContext // Default
        || window.webkitAudioContext // Safari and old versions of Chrome
        || false;      
    }
  
    connectedCallback() {
        if(this.parentNode.nodeName !== 'WAM-HOST') {
            this.audioContext = new AudioContext();
            this.loadPluginDemo();
        }
    }

    loadPlugin = async (audioContext,hostGroupId) => {
        // Import WAM
        const { default: WAM } = await import(this.src);
        
        // Create a new instance of the plugin
        // You can can optionnally give more options such as the initial state of the plugin
        this.instance = await WAM.createInstance(hostGroupId, audioContext);

        //wait that instance is define to continue the code
        console.log(this.instance);

        // Load the GUI if need (ie. if the option noGui was set to true)
        // And calls the method createElement of the Gui module
        this.domNode = await this.instance.createGui();
        
        //this.mountPlugin(this.domNode);

        return this.instance;
    };

    // Very simple function to connect the plugin audionode to the host
    connectPlugin = (dest,keyboardAudioNode) => {
        const audioNode = this.instance.audioNode;
        //keyboard is optional
        if(keyboardAudioNode) {
            keyboardAudioNode.connect(audioNode);
            keyboardAudioNode.connectEvents(audioNode.instanceId);
        }
        audioNode.connect(dest);
    };

    // Very simple function to append the plugin root dom node to the host
    mountPlugin = (domNode) => {
        this.mount.innerHtml = '';
        this.mount.appendChild(domNode);
    };



    //for demo

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

    loadInstrument = async (hostGroupId) => {

        const keyboard = this.loadKeyboard();
        const { default : keyboardWAM } = await import(keyboard);
        const instanceKeyboard = await keyboardWAM.createInstance(hostGroupId, this.audioContext);

        instanceKeyboard.audioNode.connect(this.instance.audioNode);
        instanceKeyboard.audioNode.connectEvents(this.instance.audioNode.instanceId);

        const keyboardUi = await instanceKeyboard.createGui();
        keyboardUi.onclick = () => {
            this.audioContext.resume();
            console.log("click");
        }
        this.mountPlugin(keyboardUi);
    };

    loadEffect = async () => {
        this.loadAudio();
        this.mediaElementSource.connect(this.instance.audioNode);
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
        this.instance = await WAM.createInstance(hostGroupId, this.audioContext);

        if(this.instance.descriptor.isInstrument) {
            this.loadInstrument(hostGroupId);
        }
        else if(!this.instance.descriptor.isInstrument) {
            this.loadEffect();
        }

        this.connectPlugin(this.audioContext.destination);
        
        // Load the GUI if need (ie. if the option noGui was set to true)
        // And calls the method createElement of the Gui module
        this.domNode = await this.instance.createGui();

        this.mountPlugin(this.domNode);
    }; 
}
export { WamPlugin }
customElements.define("wam-plugin", WamPlugin);