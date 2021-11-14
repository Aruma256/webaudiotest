import argparse

import numpy as np
from scipy import fft
from scipy.io import wavfile
from matplotlib import pyplot as plt


PLOT_STYLE_DEFAULT = {}
PLOT_STYLE = PLOT_STYLE_DEFAULT


def cut_wave(wave: np.ndarray, sample_rate: int,
             frame_start: int, cut_1sec: bool) -> np.ndarray:
    if frame_start:
        wave = wave[frame_start:]
    if cut_1sec:
        assert sample_rate <= len(wave)
        wave = wave[:sample_rate]
    return wave


def compute_fft(wave: np.ndarray, sample_rate: int) -> tuple[np.ndarray, np.ndarray]:
    freq_scale = fft.rfftfreq(wave.size, d=1/sample_rate)
    freq_level = np.abs(fft.rfft(wave)) / (len(wave) / 2)
    return freq_scale, freq_level


def get_peak_freq(freq_scale: np.ndarray, freq_level: np.ndarray) -> float:
    assert freq_scale.ndim == freq_level.ndim == 1
    assert freq_scale.shape == freq_level.shape
    idx = np.argmax(freq_level)
    return float(freq_scale[idx])


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument('path', type=str)
    parser.add_argument('mode', choices=('show_wave', 'show_freq', 'get_peak_freq'), type=str)
    parser.add_argument('--frame_start', default=0, type=int)
    parser.add_argument('--cut_1sec', action='store_true')
    parser.add_argument('--freq_limit', default=1000, type=int)
    parser.add_argument('--save_name', default='', type=str)
    args = parser.parse_args()
    #
    sample_rate, wave = wavfile.read(args.path)
    assert wave.ndim == 1
    assert wave.dtype == np.int16
    #
    wave = cut_wave(wave, sample_rate, args.frame_start, args.cut_1sec)
    wave = wave / 2**15
    if args.mode == 'show_wave':
        plt.plot(wave, **PLOT_STYLE)
        plt.show()
        return
    freq_scale, freq_level = compute_fft(wave, sample_rate)
    peak_freq = get_peak_freq(freq_scale, freq_level)
    if args.mode == 'get_peak_freq':
        print(peak_freq)
    if args.mode == 'show_freq':
        freq_limit_idx = np.searchsorted(freq_scale, args.freq_limit,
                                         side='right')
        plt.plot(freq_scale[:freq_limit_idx], freq_level[:freq_limit_idx],
                 **PLOT_STYLE)
        plt.annotate(f'{peak_freq} Hz', xy=(peak_freq, np.max(freq_level)))
        plt.xlabel('frequency [Hz]')
        plt.ylabel('level')
        plt.show()
    if args.save_name:
        np.savez_compressed(f'data/{args.save_name}.npz',
                            scale=freq_scale,
                            level=freq_level)


if __name__ == '__main__':
    main()
