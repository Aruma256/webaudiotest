const BACKGROUD_FILLSTYLE = 'rgb(0, 0, 0)';
const RAW_FREQ_FILLSTYLE_NORMAL = 'rgb(32, 32, 32)';
const RAW_FREQ_FILLSTYLE_EMPHASIZED = 'rgb(255, 0, 0)';

function getFreqBarLength(value) {
    return (value + 140) * 3;
}

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
    const dataArray = new Float32Array(bufferLength);

    const canvas = document.createElement('canvas');
    canvas.style.position = 'absolute';
    canvas.style.top = 0;
    canvas.style.left = 0;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    document.body.appendChild(canvas);
    const canvasCtx = canvas.getContext('2d');
    canvasCtx.clearRect(0, 0, canvas.width, canvas.height);

    function draw() {
        //Schedule next redraw
        requestAnimationFrame(draw);

        //Get spectrum data
        analyserNode.getFloatFrequencyData(dataArray);

        //Draw black background
        canvasCtx.fillStyle = BACKGROUD_FILLSTYLE;
        canvasCtx.fillRect(0, 0, canvas.width, canvas.height);

        //Draw spectrum
        const barWidth = canvas.height / bufferLength;
        let max_i = 0;
        let maxValue = -Infinity;
        for (let i = 0; i < bufferLength; i++) {
            const posY = i * barWidth;
            const barLength = getFreqBarLength(dataArray[i]);
            canvasCtx.fillStyle = RAW_FREQ_FILLSTYLE_NORMAL;
            canvasCtx.fillRect(0, posY, barLength, barWidth);
            //Update maxValue
            if (maxValue < dataArray[i]) {
                max_i = i;
                maxValue = dataArray[i];
            }
        }

        canvasCtx.fillStyle = RAW_FREQ_FILLSTYLE_EMPHASIZED;
        canvasCtx.fillRect(0, max_i * barWidth, getFreqBarLength(dataArray[max_i]), barWidth);

    };
    // REF https://developer.mozilla.org/en-US/docs/Web/API/AnalyserNode/getFloatFrequencyData

    draw();

}
