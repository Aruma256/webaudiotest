const HISTORY_SIZE = 1024;
const PHASE = {
    WAITING: "WAITING",
    CONNECTING: "CONNECTING",
    RUNNING: "RUNNING",
};

for (let name in CHARACTERS) {
    CHARACTERS[name]["style"] = `rgb(${CHARACTERS[name]["color"].join(',')})`
}

const PARAMS = {
    MAX_FREQ: null,
    FREQ_LIMIT: 1024,
    FFT_SIZE: 32768,
    FREQ_BIN_COUNT: null,
};

async function getAnalyserNode() {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    const audioCtx = new AudioContext();
    // REF https://developer.mozilla.org/ja/docs/Web/API/AudioContext

    let stream = null;
    try {
        stream = await navigator.mediaDevices.getUserMedia({audio: true});
    } catch(err) {
        return null;
    }
    // REF https://developer.mozilla.org/ja/docs/Web/API/MediaDevices/getUserMedia

    const source = audioCtx.createMediaStreamSource(stream);
    // REF https://developer.mozilla.org/ja/docs/Web/API/AudioContext/createMediaStreamSource

    const analyserNode = audioCtx.createAnalyser();
    analyserNode.fftSize = PARAMS["FFT_SIZE"];

    source.connect(analyserNode);

    const sampleRate = audioCtx.sampleRate;
    console.log(`sample rate: ${sampleRate}`);
    PARAMS["MAX_FREQ"] = sampleRate / 2;
    console.log(`frequencyBinCount: ${analyserNode.frequencyBinCount}`);
    PARAMS["FREQ_BIN_COUNT"] = analyserNode.frequencyBinCount;
    return analyserNode;
}

class MyApp {

    constructor(appRenderer) {
        this.appRenderer = appRenderer;
        this.phase = PHASE.WAITING;
        this.history = new Array(HISTORY_SIZE);
        this.analyserNode = null;
        this.dataArray = null;
    }

    async connectAudioInput() {
        this.analyserNode = await getAnalyserNode();
        if (this.analyserNode === null) {
            this.phase = PHASE.WAITING;
            return;
        }
        for (let i = 0; ; i++ ) {
            if (i / PARAMS.FREQ_BIN_COUNT * PARAMS.MAX_FREQ > PARAMS.FREQ_LIMIT) {
                this.dataArray = new Uint8Array(i);
                break;
            }
        }
        this.phase = PHASE.RUNNING;
    }

    onCanvasClick() {
        console.log(this.phase);
        if (this.phase === PHASE.WAITING) {
            this.phase = PHASE.CONNECTING;
            this.connectAudioInput();
        }
    }

    drawLoop() {
        //Schedule next redraw
        requestAnimationFrame(() => this.drawLoop());

        if (this.phase === PHASE.WAITING) {

        } else if (this.phase === PHASE.CONNECTING) {

        } else if (this.phase === PHASE.RUNNING) {
            //Get spectrum data
            this.analyserNode.getByteFrequencyData(this.dataArray);

            //Calc max value
            let max_i = 0;
            let maxValue = -Infinity;
            for (let i = 0; i < this.dataArray.length; i++) {
                if (maxValue < this.dataArray[i]) {
                    max_i = i;
                    maxValue = this.dataArray[i];
                }
            }

            this.history.shift()
            this.history.push(max_i);

            this.appRenderer.reset(window.innerWidth, window.innerHeight - document.getElementById('button-container').clientHeight);

            //Draw target
            this.appRenderer.drawTarget(CHARACTERS);

            //Draw spectrum
            this.appRenderer.drawSpectrum(this.dataArray);

            //Draw history
            this.appRenderer.drawHistory(this.history);
        }
    };
    // REF https://developer.mozilla.org/en-US/docs/Web/API/AnalyserNode/getFloatFrequencyData

    start() {
        this.drawLoop();
    }

}

window.onload = function() {
    const canvas = document.getElementById('canvas');
    const appRenderer = new AppRenderer(canvas, PARAMS);
    const myApp = new MyApp(appRenderer);
    canvas.addEventListener('click', () => myApp.onCanvasClick(), false);
    myApp.start();
};
