const HISTORY_SIZE = 1024;

const FREQ_BAR_CENTER_SCALE = 0.1;
const FREQ_LIMIT = 1024;

const TARGET_RANGE_SCALE = 0.2;

for (let name in CHARACTERS) {
    CHARACTERS[name]["style"] = `rgb(${CHARACTERS[name]["color"].join(',')})`
}

const BACKGROUD_STYLE = 'rgb(0, 0, 0)';
const TRANSPARENT_STYLE = 'rgba(0, 0, 0, 0)';
const RAW_FREQ_FILLSTYLE = 'rgb(200, 200, 200)';

async function onButtonClick(){
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    const audioCtx = new AudioContext();
    // REF https://developer.mozilla.org/ja/docs/Web/API/AudioContext

    const stream = await navigator.mediaDevices.getUserMedia({audio: true});
    // REF https://developer.mozilla.org/ja/docs/Web/API/MediaDevices/getUserMedia

    const source = audioCtx.createMediaStreamSource(stream);
    // REF https://developer.mozilla.org/ja/docs/Web/API/AudioContext/createMediaStreamSource

    const analyserNode = audioCtx.createAnalyser();
    analyserNode.fftSize = 32768;

    source.connect(analyserNode);

    const sampleRate = audioCtx.sampleRate;
    console.log(`sample rate: ${sampleRate}`);
    console.log(`frequencyBinCount: ${analyserNode.frequencyBinCount}`);
    let bufferLength = analyserNode.frequencyBinCount;
    for (let i = 0; i < analyserNode.frequencyBinCount; i++) {
        if (sampleRate/2 / analyserNode.frequencyBinCount * i > FREQ_LIMIT) {
            bufferLength = i;
            break;
        }
    }
    const screenFreqLimit = sampleRate/2 / analyserNode.frequencyBinCount * bufferLength;
    const dataArray = new Uint8Array(bufferLength);

    const canvas = document.createElement('canvas');
    canvas.style.position = 'absolute';
    canvas.style.top = 0;
    canvas.style.left = 0;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    document.body.appendChild(canvas);
    const canvasCtx = canvas.getContext('2d');
    canvasCtx.clearRect(0, 0, canvas.width, canvas.height);

    const historyScaleX = canvas.width * (1 - FREQ_BAR_CENTER_SCALE) / HISTORY_SIZE;
    const freqBarScaleY = canvas.height / (bufferLength - 1);
    const history = new Array(HISTORY_SIZE);

    function getPosYFromFreq(f) {
        return Math.ceil(canvas.height - (f / screenFreqLimit * canvas.height));
    }

    function getPosYFromIdx(idx) {
        return Math.ceil(canvas.height - (idx * freqBarScaleY));
    }

    function getFreqBarLength(value) {
        return value / 255.0 * canvas.width * FREQ_BAR_CENTER_SCALE * 2;
    }

    function drawFreqBar(idx, value, style) {
        const length = getFreqBarLength(value);
        canvasCtx.fillStyle = style;
        canvasCtx.fillRect(canvas.width * (1 - FREQ_BAR_CENTER_SCALE) - length/2, getPosYFromIdx(idx+0.5), length, freqBarScaleY);
    }

    function draw() {
        //Schedule next redraw
        requestAnimationFrame(draw);

        //Get spectrum data
        analyserNode.getByteFrequencyData(dataArray);

        //Draw black background
        canvasCtx.fillStyle = BACKGROUD_STYLE;
        canvasCtx.fillRect(0, 0, canvas.width, canvas.height);

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

        //Draw target
        for (let name in CHARACTERS) {
            const targetPosYL = getPosYFromFreq(CHARACTERS[name]["freq_range"][0]);
            const targetPosYH = getPosYFromFreq(CHARACTERS[name]["freq_range"][1]);
            const targetPosYLL = getPosYFromFreq(CHARACTERS[name]["freq_range"][0] * (1 - TARGET_RANGE_SCALE));
            const targetPosYHH = getPosYFromFreq(CHARACTERS[name]["freq_range"][1] * (1 + TARGET_RANGE_SCALE));

            // low
            let gradientLow = canvasCtx.createLinearGradient(0, targetPosYL, 0, targetPosYLL);
            gradientLow.addColorStop(0, CHARACTERS[name]["style"]);
            gradientLow.addColorStop(1, TRANSPARENT_STYLE);
            canvasCtx.fillStyle = gradientLow;
            canvasCtx.fillRect(0, targetPosYL, canvas.width, targetPosYLL - targetPosYL);

            // range
            canvasCtx.fillRect(0, targetPosYH, canvas.width, targetPosYL - targetPosYH);

            // high
            let gradientHigh = canvasCtx.createLinearGradient(0, targetPosYHH, 0, targetPosYH);
            gradientHigh.addColorStop(0, TRANSPARENT_STYLE);
            gradientHigh.addColorStop(1, CHARACTERS[name]["style"]);
            canvasCtx.fillStyle = gradientHigh;
            canvasCtx.fillRect(0, targetPosYHH, canvas.width, targetPosYH - targetPosYHH);
        }

        //Draw spectrum
        for (let i = 0; i < bufferLength; i++) {
            drawFreqBar(i, dataArray[i], RAW_FREQ_FILLSTYLE);
        }

        //Draw history
        for (let i = 0; i < HISTORY_SIZE - 1; i++) {
            if (history[i] !== undefined && history[i+1] !== undefined) {
                canvasCtx.beginPath();
                canvasCtx.moveTo(historyScaleX * i, getPosYFromIdx(history[i]));
                canvasCtx.lineTo(historyScaleX * (i+1), getPosYFromIdx(history[i+1]))
                canvasCtx.strokeStyle = "red";
                canvasCtx.lineWidth = 1;
                canvasCtx.stroke();
            }
        }

    };
    // REF https://developer.mozilla.org/en-US/docs/Web/API/AnalyserNode/getFloatFrequencyData

    draw();

}
