class WamHost extends HTMLElement {
    constructor() {
        super();
        this.root = this.attachShadow({ mode: 'open' });
        this.src = this.getAttribute('src');
    }
  
    connectedCallback() {
        // Do something
        this.css = document.createElement('style');
        this.css = `
            div {
                display: block;
            }
        `;
        this.html = `
            <div id='mount'></div>
        `;
        this.root.innerHTML = `<style>${this.css}</style>${this.html}`;
        this.mount = this.root.querySelector('#mount');

        // Safari...
        this.AudioContext = window.AudioContext // Default
        || window.webkitAudioContext // Safari and old versions of Chrome
        || false;
    
        this.audioContext = new AudioContext();
        this.loadPlugin;
    }



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

    loadAssests = async (descriptor) => {
        if(!descriptor.isInstrument) {
            this.loadAudio();
        }
        else if(descriptor.isInstrument) {
            await this.loadInstrument;
        }
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
        this.player = audio;
        this.mediaElementSource = this.audioContext.createMediaElementSource(this.player);

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


    loadPlugin = (async () => {
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
    })(); 
}
export { WamHost }
customElements.define("wam-host", WamHost);