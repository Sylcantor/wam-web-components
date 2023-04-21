const template = document.createElement('template');
template.innerHTML = `
    <div class="wam-host">
        <p class="p">Select MIDI input device
            <select id="selectMidiInput" class="widget"></select>
        </p>
        <p class="p">Select live input device
            <select id="selectAudioInput" class="widget"></select>
        </p>
        <p>
            <button id="toggleLiveInput" class="widget">Live input:
                <span style='color:#cc7c6e;'>NOT ACTIVATED</span>, click to toggle on/off!</button>
        </p>
        <div class=wam-plugins>
        </div>
    </div>
    <style>
        .wam-host {
            display: flex;
            flex-direction: column;
        }
        .p > * {
            display: flex;
            flex-direction: row;
        }
        .wam-plugins {
            display: flex;
            flex-wrap: wrap;
        }
        .plugins{
            display : flex;
        }
    </style>
`;

const getBaseURL = () => {
	return new URL('.', import.meta.url);
};

// A web component to load a host for wamPlugins web components
class WamHost extends HTMLElement {
    constructor() {
        super();
        // Create a shadow root
        const root = this.attachShadow({ mode: 'open' });
        root.appendChild(template.content.cloneNode(true));

        //get the div with class wam-host, wam-plugins and the select selectAudioInput
        this.mount = root.querySelector('.wam-host');
        this.mountPlug = root.querySelector('.wam-plugins');
        this.audioInput = root.querySelector('#selectAudioInput');
        this.firstAudioNode;
        // get the toggleLiveInput button
        const liveInputButton = root.querySelector('#toggleLiveInput');
        liveInputButton.onclick = this.toggleLiveInput.bind(this, root);

        // Safari...
        this.AudioContext = window.AudioContext // Default
        || window.webkitAudioContext // Safari and old versions of Chrome
        || false;
    
        this.audioContext = new AudioContext();

        // Default constraints for live input
        this.defaultConstraints = {
            audio: {
                echoCancellation: false,
                mozNoiseSuppression: false,
                mozAutoGainControl: false,
            },
        };
        this.liveInputActivated = false;

        this.setupMidiInput(root);
    }

    // called when the element is added to the DOM
    async connectedCallback() {
        this.plugins = Array.from(this.childNodes).filter(node => node.nodeType === Node.ELEMENT_NODE);
        this.hostGroupId = await this.initWamHost();
        await this.loadPlugins();
        this.mountPlugins();
        this.loadInterface();
        this.connectPlugins();
        this.buildAudioDeviceMenu();

        // initial live input setup.
        navigator.mediaDevices.getUserMedia(this.defaultConstraints).then((stream) => {
            this.setLiveInputToNewStream(stream);
            this.connectLiveInput();
        });
    }

    // setup the midi input device selector and handle midi messages
    setupMidiInput = (root) => {
        const midiInputSelector = root.querySelector('#selectMidiInput');
        if (navigator.requestMIDIAccess) {
            navigator.requestMIDIAccess().then((midiAccess) => {
                let currentInput;
                const handleMidiMessage = (e) => {
                    if (!this.firstAudioNode) return;
                    this.audioContext.resume();
                    this.firstAudioNode.scheduleEvents({ type: 'wam-midi', time: this.firstAudioNode.context.currentTime, data: { bytes: e.data } });
                };
                const handleStateChange = () => {
                    const { inputs } = midiAccess;
                    if (midiInputSelector.options.length === inputs.size + 1) return;
                    if (currentInput) currentInput.removeEventListener('midimessage', handleMidiMessage);
                    midiInputSelector.innerHTML = '<option value="-1" disabled selected>Select...</option>';
                    inputs.forEach((midiInput) => {
                        const { name, id } = midiInput;
                        const option = new Option(name, id);
                        midiInputSelector.add(option);
                    });
                };
                handleStateChange();
                midiAccess.addEventListener('statechange', handleStateChange);
                midiInputSelector.addEventListener('input', (e) => {
                    if (currentInput) currentInput.removeEventListener('midimessage', handleMidiMessage);
                    const id = e.target.value;
                    currentInput = midiAccess.inputs.get(id);
                    currentInput.addEventListener('midimessage', handleMidiMessage);
                });
            });
        }
    }

    toggleLiveInput = (root) => {
        this.audioContext.resume();
    
        const button = root.querySelector('#toggleLiveInput');
    
        if (!this.liveInputActivated) {
            button.innerHTML = "Live input: <span style='color:#99c27a;'>ACTIVATED</span>, click to toggle on/off!";
            this.liveInputGainNode.gain.setValueAtTime(1, this.audioContext.currentTime);
        } else {
            button.innerHTML = "Live input: <span style='color:#cc7c6e;'>NOT ACTIVATED</span>, click to toggle on/off!";
            this.liveInputGainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
        }
        this.liveInputActivated = !this.liveInputActivated;
    };

    // convert the sound to mono
    convertToMono(input) {
        const splitter = this.audioContext.createChannelSplitter(2);
        const merger = this.audioContext.createChannelMerger(2);
    
        input.connect(splitter);
        splitter.connect(merger, 0, 0);
        splitter.connect(merger, 0, 1);
        splitter.connect(merger, 1, 0);
        splitter.connect(merger, 1, 1);
        return merger;
    }
    
    // set the live input to the new stream
    setLiveInputToNewStream = (stream) => {
        window.stream = stream;
        const inputStreamNode = this.audioContext.createMediaStreamSource(stream);
        const inputinputStreamNodeMono = this.convertToMono(inputStreamNode);
    
        this.liveInputGainNode = this.audioContext.createGain();
    
        this.liveInputGainNode.gain.value = this.liveInputActivated ? 1 : 0;
        console.log(`liveInputGainNode.gain.value = ${this.liveInputGainNode.gain.value}`);
        inputinputStreamNodeMono.connect(this.liveInputGainNode);
    
        console.log('Live Input node created...');
    };

    // change the live input stream
    changeStream = (id) => {
        const constraints = {
            audio: {
                echoCancellation: false,
                mozNoiseSuppression: false,
                mozAutoGainControl: false,
                deviceId: id ? { exact: id } : undefined,
            },
        };
        navigator.mediaDevices.getUserMedia(constraints).then(async (stream) => {
            this.setLiveInputToNewStream(stream);
            this.connectLiveInput();
        });
    };

    // build the audio device menu
    buildAudioDeviceMenu = () => {
        console.log('Building device menu...');
        navigator.mediaDevices
            .enumerateDevices()
            .then(this.gotDevices)
            .catch((error) => {
                console.log('navigator.MediaDevices.getUserMedia error: ', error.message, error.name);
            });
    
        this.audioInput.onchange = (e) => {
            const index = e.target.selectedIndex;
            const id = e.target[index].value;
            const label = e.target[index].text;
    
            console.dir(`Audio input selected : ${label} id = ${id}`);
            this.changeStream(id);
        };
    };
    
    // get the audio devices
    gotDevices = (deviceInfos) => {
        // lets rebuild the menu
        this.audioInput.innerHTML = '';
    
        // eslint-disable-next-line no-plusplus
        for (let i = 0; i !== deviceInfos.length; ++i) {
            const deviceInfo = deviceInfos[i];
            if (deviceInfo.kind === 'audioinput') {
                const option = document.createElement('option');
                option.value = deviceInfo.deviceId;
                option.text = deviceInfo.label || `microphone ${this.audioInput.length + 1}`;
                this.audioInput.appendChild(option);
                console.log(`adding ${option.text}`);
            } else {
                console.log('Some other kind of source/device: ', deviceInfo);
            }
        }
    };

    // connect the live input to the first plugin
    connectLiveInput = async () => {
        const instance = await this.plugins[0].instance;
        const audioNode = instance.audioNode;
        if (audioNode.numberOfInputs) this.liveInputGainNode.connect(audioNode);
        console.log('connected live input node to plugin node');
    };

    // connect the plugins
    connectPlugins = async () => {
        for(let i = 0; i < this.plugins.length; i++) {
            const plugin = this.plugins[i];
            const instance = await plugin.instance;
            const audioNode = instance.audioNode;
            console.log(audioNode);
            const dest = i === this.plugins.length - 1 ? this.audioContext.destination : this.plugins[i+1].instance.audioNode;
            plugin.connectPlugin(dest);
        }
    };

    // connect the keyboard to the first plugin
    connectKeyboard = (audioNode,keyboardAudioNode) => {
        keyboardAudioNode.connect(audioNode);
        keyboardAudioNode.connectEvents(audioNode.instanceId);
    };

    // mount the plugin to the dom
    mountPlugin = (domNode) => {
        this.mountPlug.innerHtml = '';
        this.mountPlug.appendChild(domNode);
    };

    // load the host interface
    loadInterface = async () => {

        // load the interface for instrument plugins
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
            const instanceKeyboard = await keyboardWAM.createInstance(this.hostGroupId, this.audioContext);
    
            this.connectKeyboard(firstInstance.audioNode,instanceKeyboard.audioNode);
    
            const keyboardUi = await instanceKeyboard.createGui();
            keyboardUi.onclick = () => {
                this.audioContext.resume();
                console.log("click");
            }
            this.mount.innerHtml = '';
            this.mount.appendChild(keyboardUi);
        }

        const loadEffectInterface = async (firstInstance) => {
            const audio = document.createElement('audio');
            audio.id = 'player';
            audio.controls = true;
            audio.loop = true;
            audio.crossOrigin = 'anonymous';
            audio.onplay = () => {
                this.audioContext.resume();
            };
        
            // Create the select list
            const soundSelect = document.createElement('select');
            soundSelect.style.width = '300px';


            soundSelect.id = 'soundSelect';
            soundSelect.addEventListener('change', (event) => {
                const soundUrl = event.target.value;
                audio.src = soundUrl;
                console.log(`Sound changed to ${soundUrl}`);
            });
        
            // Fetch the sound list and populate the select list
            const loadSoundList = async () => {
                const baseUrl = getBaseURL();
                const response = await fetch(baseUrl + 'assets/sounds/audio_files.json');
                const soundList = await response.json();
        
                soundList.forEach((sound) => {
                    const option = document.createElement('option');
                    console.log(baseUrl);
                    option.value = baseUrl + `assets/sounds/${sound.path}`;
                    console.log(option.value);
                    option.text = sound.name;
                    
                    soundSelect.appendChild(option);
                });
        
                // Set the initial audio source
                if (soundList.length > 0) {
                    audio.src = baseUrl + `assets/sounds/${soundList[0].path}`;
                }
            };
        
            await loadSoundList();
        
            this.mount.prepend(soundSelect); // Add the select list to the DOM
            this.mount.prepend(audio);
            this.mediaElementSource = this.audioContext.createMediaElementSource(audio);
            this.mediaElementSource.connect(firstInstance.audioNode);
        };

        // get the first plugin instance
        const firstInstance = await this.plugins[0].instance;
        // check if the plugin is an instrument or an effect and load the corresponding interface
        if(firstInstance.descriptor.isInstrument) {
            loadInstrumentInterface(firstInstance);
        }
        else {
            loadEffectInterface(firstInstance);
        }
        
    }

    // initialize the host
    initWamHost =  async () => {
        const { default: initializeWamHost } = await import("./lib/sdk/src/initializeWamHost.js");
        const [hostGroupId] = await initializeWamHost(this.audioContext);
        return hostGroupId;
    }

    // load the plugins
    loadPlugins =  async () => {
        //do async stuff 
        const promises = this.plugins.map(async plugin => {
            await plugin.loadPlugin(this.audioContext,this.hostGroupId)
            plugin.audioContext = this.audioContext; // plugin will know the audio context of the host in case it need it
        });
        await Promise.all(promises);
        this.firstAudioNode = this.plugins[0].instance.audioNode;
        console.log(this.plugins[0].instance.audioNode);
    }

    // mount the plugins to the dom
    mountPlugins = async () => {
        const promises = this.plugins.map(async plugin => {
            const domNode = await plugin.instance.createGui();
            this.mountPlugin(domNode);
        });
        await Promise.all(promises); // wait for all plugins to be mounted
    }
}

export { WamHost };
customElements.define('wam-host', WamHost);