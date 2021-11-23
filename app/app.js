const HISTORY_SIZE = 1024;

for (let name in CHARACTERS) {
    CHARACTERS[name]["style"] = `rgb(${CHARACTERS[name]["color"].join(',')})`
}

const PARAMS = {
    MAX_FREQ: null,
    FREQ_LIMIT: 1024,
    FFT_SIZE: 32768,
    FREQ_BIN_COUNT: null,
};

let appRenderer = null;

window.onload = function() {
    appRenderer = new AppRenderer(document.getElementById('canvas'), PARAMS);
    appRenderer.reset();
};


async function onButtonClick(){
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    const audioCtx = new AudioContext();
    // REF https://developer.mozilla.org/ja/docs/Web/API/AudioContext

    const stream = await navigator.mediaDevices.getUserMedia({audio: true});
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
    let bufferLength = analyserNode.frequencyBinCount;
    for (let i = 0; i < analyserNode.frequencyBinCount; i++) {
        if (sampleRate/2 / analyserNode.frequencyBinCount * i > PARAMS["FREQ_LIMIT"]) {
            bufferLength = i;
            break;
        }
    }
    const dataArray = new Uint8Array(bufferLength);

    const historyScaleX = canvas.width * (1 - FREQ_BAR_CENTER_SCALE) / HISTORY_SIZE;
    const history = new Array(HISTORY_SIZE);

    function draw() {
        //Schedule next redraw
        requestAnimationFrame(draw);

        //Get spectrum data
        analyserNode.getByteFrequencyData(dataArray);

        //Calc max value
        let max_i = 0;
        let maxValue = -Infinity;
        for (let i = 0; i < bufferLength; i++) {
            if (maxValue < dataArray[i]) {
                max_i = i;
                maxValue = dataArray[i];
            }
        }
        console.log(sampleRate/2 / analyserNode.frequencyBinCount * max_i);

        history.shift() //TODO optimization optimization **optimization**
        history.push(max_i);

        appRenderer.reset(window.innerWidth, window.innerHeight - document.getElementById('button-container').clientHeight);

        //Draw target
        appRenderer.drawTarget(CHARACTERS);

        //Draw spectrum
        appRenderer.drawSpectrum(dataArray);

        //Draw history
        appRenderer.drawHistory(history);

    };
    // REF https://developer.mozilla.org/en-US/docs/Web/API/AnalyserNode/getFloatFrequencyData

    draw();

}
