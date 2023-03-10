//do a template and all children that are in the slot will be show in line
const template = document.createElement('template');
template.innerHTML = `
    <div class="wam-host">
        <form id="form">
            <div id="select">
            </div>
        </form>
        <div>
            <slot class"plugins"></slot>
        </div>
    </div>
    <style>
        .wam-host > * {
            display: flex;
            flex-wrap: wrap;
        }
        .plugins{
            display : flex;
        }
    </style>
`;



class WamHost extends HTMLElement {
    constructor() {
        super();
        const root = this.attachShadow({ mode: 'open' });
        root.appendChild(template.content.cloneNode(true));

        this.mount = root.querySelector('.wam-host');

        // Safari...
        this.AudioContext = window.AudioContext // Default
        || window.webkitAudioContext // Safari and old versions of Chrome
        || false;
    
        this.audioContext = new AudioContext();

        //this.loadPluginList(root);
    }

    /*
    loadPluginList = (root) => {
        const strings = ["Premier élément", "Deuxième élément", "Troisième élément"];
        

        // Récupération de l'élément HTML où la liste déroulante sera insérée
        const selectElement = root.querySelector("#select");


        // Création de la liste déroulante
        let selectList = document.createElement("select");

        // Parcours du tableau et création d'une option pour chaque élément
        for (let i = 0; i < strings.length; i++) {
            let option = document.createElement("option");
            option.value = strings[i];
            option.text = strings[i];
            selectList.appendChild(option);
        }

        // Ajout de la liste déroulante à l'élément HTML
        selectElement.appendChild(selectList);

    }
    */

    async connectedCallback() {
        this.instances = [];
        const childElements = Array.from(this.childNodes).filter(node => node.nodeType === Node.ELEMENT_NODE);

        const hostGroupId = await this.loadPlugins(childElements);
        this.loadInterface(hostGroupId);
        this.connectPlugins();
    }

    connectPlugins = async () => {

        for(let i = 0; i < this.instances.length; i++) {
            const instance = await this.instances[i];
            console.log(instance);
            //check if the instance is the last one
            if(i === this.instances.length - 1) {
                this.connectPlugin(instance.audioNode,this.audioContext.destination);
            }
            else {
                const nextInstance = await this.instances[i+1];
                this.connectPlugin(instance.audioNode,nextInstance.audioNode);
            }
        }
    };

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

    connectKeyboard = (audioNode,keyboardAudioNode) => {
        keyboardAudioNode.connect(audioNode);
        keyboardAudioNode.connectEvents(audioNode.instanceId);
    };

    mountPlugin = (domNode) => {
        this.mount.innerHtml = '';
        this.mount.appendChild(domNode);
    };

    loadInterface = async (hostGroupId) => {

        const loadInstrumentInterface =  async (firstInstance) => {

            const loadKeyboard = () => {
                let keyboard = this.getAttribute('keyboard');
                if(keyboard === null || !keyboard.endsWith('.js')) {
                    keyboard = "./assets/midiKeyboard/simpleMidiKeyboard/index.js";
                }
                return keyboard;
            };

            const keyboard = loadKeyboard();
            const { default : keyboardWAM } = await import(keyboard);
            const instanceKeyboard = await keyboardWAM.createInstance(hostGroupId, this.audioContext);
    
            this.connectKeyboard(firstInstance.audioNode,instanceKeyboard.audioNode);
    
            const keyboardUi = await instanceKeyboard.createGui();
            keyboardUi.onclick = () => {
                this.audioContext.resume();
                console.log("click");
            }
            this.mountPlugin(keyboardUi);
        }

        const loadEffectInterface =  (firstInstance) => {
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

            this.mount.prepend(audio);
            this.mediaElementSource = this.audioContext.createMediaElementSource(audio);
            this.connectPlugin(this.mediaElementSource,firstInstance.audioNode);
        }

        const firstInstance = await this.instances[0];
        if(firstInstance.descriptor.isInstrument) {
            loadInstrumentInterface(firstInstance);
        }
        else {
            loadEffectInterface(firstInstance);
        }
    }


    loadPlugins =  async (plugins) => {
        const { default: initializeWamHost } = await import("./lib/sdk/src/initializeWamHost.js");
        const [hostGroupId] = await initializeWamHost(this.audioContext);
        plugins.forEach(plugin => {
            this.instances.push(plugin.loadPlugin(this.audioContext,hostGroupId));
        });

        return hostGroupId;
    }
}

export { WamHost };
customElements.define('wam-host', WamHost);