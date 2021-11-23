const FREQ_BAR_CENTER_SCALE = 0.9;
const FREQ_BAR_MAX_LENGTH_SCALE = 0.1;

const TARGET_RANGE_SCALE = 0.2;

const TRANSPARENT_STYLE = 'rgba(0, 0, 0, 0)';
const RAW_FREQ_FILLSTYLE = 'rgb(200, 200, 200)';

class AppRenderer {

    constructor(canvas, params) {
        this.canvas = canvas;
        this.canvasCtx = canvas.getContext('2d');
        this.params = params;
    }

    reset(width, height) {
        this.canvas.width = width;
        this.canvas.height = height;
        this.canvasCtx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }

    getFreqBarLength(value) {
        return value / 255.0 * this.canvas.width * FREQ_BAR_MAX_LENGTH_SCALE;
    }

    getPosYFromFreq(f) {
        let y = (f / this.params["FREQ_LIMIT"]) * this.canvas.height;
        y = this.canvas.height - y;
        return Math.ceil(y);
    }

    getPosYFromIdx(idx) {
        const f = idx / this.params["FREQ_BIN_COUNT"] * this.params["MAX_FREQ"];
        return this.getPosYFromFreq(f);
    }

    drawTarget(characters) {
        for (let [name, spec] of Object.entries(characters)) {
            const targetPosYL = this.getPosYFromFreq(spec["freq_range"][0]);
            const targetPosYH = this.getPosYFromFreq(spec["freq_range"][1]);
            const targetPosYLL = this.getPosYFromFreq(spec["freq_range"][0] * (1 - TARGET_RANGE_SCALE));
            const targetPosYHH = this.getPosYFromFreq(spec["freq_range"][1] * (1 + TARGET_RANGE_SCALE));

            // low
            const gradientLow = this.canvasCtx.createLinearGradient(0, targetPosYL, 0, targetPosYLL);
            gradientLow.addColorStop(0, spec["style"]);
            gradientLow.addColorStop(1, TRANSPARENT_STYLE);
            this.canvasCtx.fillStyle = gradientLow;
            this.canvasCtx.fillRect(0, targetPosYL, this.canvas.width, targetPosYLL - targetPosYL);

            // range
            this.canvasCtx.fillRect(0, targetPosYH, this.canvas.width, targetPosYL - targetPosYH);

            // high
            const gradientHigh = this.canvasCtx.createLinearGradient(0, targetPosYHH, 0, targetPosYH);
            gradientHigh.addColorStop(0, TRANSPARENT_STYLE);
            gradientHigh.addColorStop(1, spec["style"]);
            this.canvasCtx.fillStyle = gradientHigh;
            this.canvasCtx.fillRect(0, targetPosYHH, this.canvas.width, targetPosYH - targetPosYHH);
        }
    }

    drawSpectrum(dataArray) {
        this.canvasCtx.fillStyle = RAW_FREQ_FILLSTYLE;
        for (let i = 0; i < dataArray.length; i++) {
            const barLength = this.getFreqBarLength(dataArray[i]);
            const yHigh = this.getPosYFromIdx(i+0.5);
            const yLow = this.getPosYFromIdx(i-0.5);
            this.canvasCtx.fillRect(
                this.canvas.width * FREQ_BAR_CENTER_SCALE - barLength,
                yHigh,
                barLength * 2,
                yLow - yHigh,
            );    
        }
    }

    drawHistory(history) {
        for (let i = 0; i < history.length - 1; i++) {
            if (history[i] !== undefined && history[i+1] !== undefined) {
                this.canvasCtx.beginPath();
                this.canvasCtx.moveTo(Math.floor(i / history.length * this.canvas.width * FREQ_BAR_CENTER_SCALE), this.getPosYFromIdx(history[i]));
                this.canvasCtx.lineTo(Math.floor((i+1) / history.length * this.canvas.width * FREQ_BAR_CENTER_SCALE), this.getPosYFromIdx(history[i+1]))
                this.canvasCtx.strokeStyle = "red";
                this.canvasCtx.lineWidth = 1;
                this.canvasCtx.stroke();
            }
        }
    }


}