import math

import numpy as np
from pytest import approx

import wave_analyzer


def test_cut_wave():
    arr = np.arange(50)
    res = wave_analyzer.cut_wave(arr.copy(), 10, 0, False)
    np.testing.assert_array_equal(arr, res)
    res = wave_analyzer.cut_wave(arr.copy(), 10, 0, True)
    np.testing.assert_array_equal(arr[:10], res)
    res = wave_analyzer.cut_wave(arr.copy(), 10, 5, False)
    np.testing.assert_array_equal(arr[5:], res)
    res = wave_analyzer.cut_wave(arr.copy(), 10, 5, True)
    np.testing.assert_array_equal(arr[5:15], res)


def test_compute_fft():
    DELTA = 0.04
    t = np.linspace(start=0, stop=1, num=10000, dtype=float)
    #
    wave = np.sin(2 * math.pi * t * 250)
    freq_scale, freq_data = wave_analyzer.compute_fft(wave, 10000)
    assert 250 in freq_scale
    for freq, level in zip(freq_scale, freq_data):
        if freq == 250:
            assert level == approx(1, abs=DELTA)
        else:
            assert level == approx(0, abs=DELTA)
    #
    wave = 0.5 * np.sin(2 * math.pi * t * 100)
    wave += 1 * np.sin(2 * math.pi * t * 300)
    freq_scale, freq_data = wave_analyzer.compute_fft(wave, 10000)
    assert 100 in freq_scale
    assert 300 in freq_scale
    for freq, level in zip(freq_scale, freq_data):
        if freq == 100:
            assert level == approx(0.5, abs=DELTA)
        elif freq == 300:
            assert level == approx(1, abs=DELTA)
        else:
            assert level == approx(0, abs=DELTA)


def test_get_peak_freq():
    res = wave_analyzer.get_peak_freq(
        np.array([3.0, 5.5, 7.0, 9.5]), np.array([0.8, 0.3, 0.2, 0.1])
    )
    assert res == 3.0
    res = wave_analyzer.get_peak_freq(
        np.array([3.0, 5.5, 7.0, 9.5]), np.array([0.1, 0.8, 0.8, 0.1])
    )
    assert res == 5.5
