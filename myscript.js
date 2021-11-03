const HISTORY_SIZE = 1024;

const FREQ_BAR_CENTER_SCALE = 0.1;

const BACKGROUD_FILLSTYLE = 'rgb(0, 0, 0)';
const RAW_FREQ_FILLSTYLE = 'rgb(200, 200, 200)';

async function onButtonClick(){
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    const audioCtx = new AudioContext();
    // REF https://developer.mozilla.org/ja/docs/Web/API/AudioContext

    const stream = await navigator.mediaDevices.getUserMedia({audio: true});
    // REF https://developer.mozilla.org/ja/docs/Web/API/MediaDevices/getUserMedia

    const source = audioCtx.createMediaStreamSource(stream);
    // REF https://developer.mozilla.org/ja/docs/Web/API/AudioContext/createMediaStreamSource

    const sampleRate = audioCtx.sampleRate;
    console.log(sampleRate);
    // REF https://developer.mozilla.org/ja/docs/Web/API/BaseAudioContext/sampleRate

    const analyserNode = audioCtx.createAnalyser();
    source.connect(analyserNode);

    const bufferLength = analyserNode.frequencyBinCount;
    console.log(bufferLength);
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

    function getPosY(idx) {
        return idx * freqBarScaleY;
    }

    function getFreqBarLength(value) {
        return value / 255.0 * canvas.width * FREQ_BAR_CENTER_SCALE * 2;
    }

    function drawFreqBar(idx, value, style) {
        const length = getFreqBarLength(value);
        canvasCtx.fillStyle = style;
        canvasCtx.fillRect(canvas.width * (1 - FREQ_BAR_CENTER_SCALE) - length/2, getPosY(idx), length, freqBarScaleY);
    }

    function draw() {
        //Schedule next redraw
        requestAnimationFrame(draw);

        //Get spectrum data
        analyserNode.getByteFrequencyData(dataArray);

        //Draw black background
        canvasCtx.fillStyle = BACKGROUD_FILLSTYLE;
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

        history.shift() //TODO optimization optimization **optimization**
        history.push(max_i);

        //Draw spectrum
        for (let i = 0; i < bufferLength; i++) {
            drawFreqBar(i, dataArray[i], RAW_FREQ_FILLSTYLE);
        }

        //Draw history
        for (let i = 0; i < HISTORY_SIZE - 1; i++) {
            if (history[i] !== undefined && history[i+1] !== undefined) {
                canvasCtx.beginPath();
                canvasCtx.moveTo(historyScaleX * i, getPosY(history[i]));
                canvasCtx.lineTo(historyScaleX * (i+1), getPosY(history[i+1]))
                canvasCtx.strokeStyle = "red";
                canvasCtx.lineWidth = 1;
                canvasCtx.stroke();
            }
        }

    };
    // REF https://developer.mozilla.org/en-US/docs/Web/API/AnalyserNode/getFloatFrequencyData

    draw();

}
