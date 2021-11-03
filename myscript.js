const HISTORY_SIZE = 1024;

const FREQ_BAR_CENTER_SCALE = 0.1;
const FREQ_LIMIT = 1024;

const TARGET_FREQ = 187;
const TARGET_COLOR = 'rgb(234, 121, 200)';
const TARGET_RANGE_SCALE_LOW = 0.2;
const TARGET_RANGE_SCALE_HIGH = 0.3;

const BACKGROUD_STYLE = 'rgb(0, 0, 0)';
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
    let bufferLength = 0;
    while (sampleRate/2 / analyserNode.frequencyBinCount * (bufferLength+1) <= FREQ_LIMIT && bufferLength+1 <= analyserNode.frequencyBinCount) {
        bufferLength++;
    }
    const screenFreqLimit = sampleRate/2 / analyserNode.frequencyBinCount * (bufferLength+1);
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
    const freqBarScaleY = canvas.height / bufferLength;
    const history = new Array(HISTORY_SIZE);

    function getPosYFromFreq(f) {
        return f / screenFreqLimit * canvas.height;
    }

    function getPosYFromIdx(idx) {
        return idx * freqBarScaleY;
    }

    function getFreqBarLength(value) {
        return value / 255.0 * canvas.width * FREQ_BAR_CENTER_SCALE * 2;
    }

    function drawFreqBar(idx, value, style) {
        const length = getFreqBarLength(value);
        canvasCtx.fillStyle = style;
        canvasCtx.fillRect(canvas.width * (1 - FREQ_BAR_CENTER_SCALE) - length/2, getPosYFromIdx(idx), length, freqBarScaleY);
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
        const targetPosY = getPosYFromFreq(TARGET_FREQ);
        const targetPosYlow = getPosYFromFreq(TARGET_FREQ * (1 - TARGET_RANGE_SCALE_LOW));
        const targetPosYhigh = getPosYFromFreq(TARGET_FREQ * (1 + TARGET_RANGE_SCALE_HIGH));
        let gradientLow = canvasCtx.createLinearGradient(0, targetPosYlow, 0, targetPosY);
        gradientLow.addColorStop(0, BACKGROUD_STYLE);
        gradientLow.addColorStop(1, TARGET_COLOR);
        canvasCtx.fillStyle = gradientLow;
        canvasCtx.fillRect(0, targetPosYlow, canvas.width, targetPosY);
        let gradientHigh = canvasCtx.createLinearGradient(0, targetPosY, 0, targetPosYhigh);
        gradientHigh.addColorStop(0, TARGET_COLOR);
        gradientHigh.addColorStop(1, BACKGROUD_STYLE);
        canvasCtx.fillStyle = gradientHigh;
        canvasCtx.fillRect(0, targetPosY, canvas.width, targetPosYhigh);

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
