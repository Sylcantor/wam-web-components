import { WamHost } from './wamHost.js';
class WamHostTest extends WamHost {
    constructor() {
        super();
        this.test();
    }

    waitPluginLoad = async () => {
        const pluginLoaded = new Promise((resolve, reject) => {
            this.addEventListener('pluginLoaded', (e) => {
                resolve(e.detail);
            });
        });
        await pluginLoaded;
    }

    test = async () => {
        await this.waitPluginLoad();
        const plugin = this.plugin;
        console.log(plugin);
        console.log(await plugin.audioNode.getParameterInfo());
        console.log(await plugin.audioNode.getParameterValues());

        this.testPlugin(plugin);
    }

    testPlugin = (param) => {
        var expect = chai.expect;
        var assert = chai.assert;
        let plugin = param;

        //Parameter Info
        describe('Parameter Info', function () {
            it('plugin should have a JSON getParameterInfo() method', function () {
                expect(plugin.audioNode.getParameterInfo()).to.exist;
            });
            it('the getParameterInfo() function should return a json object', function () {
                plugin.audioNode.getParameterInfo().then((res) => { expect(res).to.not.be.empty });
            });
        });

        //Parameter Values
        describe('Parameter Values', function () {
            it('plugin should have a JSON getParameterValues() method', function () {
                expect(plugin.audioNode.getParameterValues()).to.exist;
            });
            it('the getParameterValues() function should return a json object', function () {
                plugin.audioNode.getParameterValues().then((res) => { expect(res).to.not.be.empty });
            });
        });

        //Set Parameter Values
        describe('Set Parameter Values', function () {
            it('plugin should have a JSON setParameterValues() method', function () {
                expect(plugin.audioNode.setParameterValues()).to.exist;
            }); 
            it('the setParameterValues() function should return a json object', function () {
                plugin.audioNode.setParameterValues().then((res) => { expect(res).to.not.be.empty });
            });
        });

        //Web Audio Module
        describe('Web Audio Module', function () {
            it('plugin should have a JSON isWebAudioModule getter', function () {
                expect(plugin.isWebAudioModule).to.exist;
            });
            it('the isWebAudioModule getter that return a boolean', function () {
                expect(plugin.isWebAudioModule).to.be.a('boolean');
            });
        });

        //Audio Context
        describe('Audio Context', function () {
            it('plugin should have a JSON audioContext getter', function () {
                expect(plugin.audioContext).to.exist;
            });
            it('the audioContextgetter that return an BaseAudioContext', function () {
                expect(plugin.audioContext).to.be.a('AudioContext'); // pas bon à revoir 
            });
        });

        //Audio Node
        describe('Audio Node', function () {
            it('plugin should have a JSON audioNode getter', function () {
                expect(plugin.audioNode).to.exist;
            });
            it('the audioNode getter that returns the AudioNode to be inserted into an audio graph', function () {
                expect(plugin.audioNode).to.be.a('AudioNode'); // pas bon à revoir
            });
        });
        
        //Initialized
        describe('Initialized', function () {
            it('plugin should have a JSON initialized getter', function () {
                expect(plugin.initialized).to.exist;
            });
            it('the initialized getter that return a boolean', function () {
                expect(plugin.initialized).to.be.a('boolean');
            });
        });

        //Groupe ID
        describe('Groupe ID', function () {
            it('plugin should have a JSON groupId getter', function () {
                expect(plugin.groupId).to.exist;
            });
            it('the groupId getter that return a string ', function () {
                expect(plugin.groupId).to.be.a('string');
            });
        });

        //Module ID
        describe('Module ID', function () {
            it('plugin should have a JSON moduleId getter', function () {
                expect(plugin.moduleId).to.exist;
            });
            it('the moduleId getter that return a string ', function () {
                expect(plugin.moduleId).to.be.a('string');
            });
        });

        //Instance ID
        describe('Instance ID', function () {
            it('plugin should have a JSON instanceId getter', function () {
                expect(plugin.instanceId).to.exist;
            });
            it('the instanceId getter that return a string ', function () {
                expect(plugin.instanceId).to.be.a('string');
            });
        });

        //Descriptor
        describe('Descriptor', function () {
            it('plugin should have a JSON descriptor() method', function () {
                expect(plugin.descriptor).to.exist;
            });
            it('the descriptor getter that return a WamDescriptor ', function () {
                expect(plugin.descriptor).to.be.a('object');
            });
        });

        //Name
        describe('Name', function () {
            it('plugin should have a JSON name getter', function () {
                expect(plugin.name).to.exist;
            });
            it('the name getter that return a string', function () {
                expect(plugin.name).to.be.a('string');
            });
        });

        //Vendor
        describe('Vendor', function () {
            it('plugin should have a JSON vendor getter', function () {
                expect(plugin.vendor).to.exist;
            });
            it('the vendor getter that return a string', function () {
                expect(plugin.vendor).to.be.a('string');
            });
        });

        //Create Audio Node
        describe('Create Audio Node', function () {
            it('plugin should have a JSON createAudioNode() method', function () {
                expect(plugin.createAudioNode()).to.exist;
            });
            it('the createAudioNode() method that asynchronously instantiates an AudioNode (which may or may not be a Wamnode which will be inserted into the hosts audio graph', function () {
                expect(plugin.createAudioNode()).to.be.a('Promise'); // regarder si c'est bien une promesse
            });
        });

        //Initialize
        describe('Initialize', function () {
            it('plugin should have a JSON initialize() method', function () {
                expect(plugin.initialize()).to.exist;
            });
            it('the initialize() method  that asynchronously initializes the newly constructed WAM and creates its AudioNode via createAudioNode', function () {
                expect(plugin.initialize()).to.be.a('Promise'); // regarder si c'est bien une promesse
            });
        });

        //Create GUI
        describe('Create GUI', function () {
            it('plugin should have a JSON createGui() method', function () {
                expect(plugin.createGui()).to.exist;
            });
            it('the createGui() method that asynchronously creates an Element', function () {
                expect(plugin.createGui()).to.be.a('Promise'); // regarder si c'est bien une promesse
            });
        });

        //Destroy GUI
        describe('Destroy GUI', function () {
            it('plugin should have a JSON destroyGui() method', function () {
                expect(plugin.destroyGui()).to.exist;
            });
            it('the destroyGui() method that cleans up the WAMs existing but no longer useful GUI element created via createGui', function () {
                expect(plugin.destroyGui()).to.be.a('Promise'); // regarder si c'est bien une promesse
            });
        });

        
        mocha.run()
      }


}

customElements.define('wam-host-test', WamHostTest);