import math
import unittest

import numpy as np

import wave_analyzer

class TestWaveAnalyzer(unittest.TestCase):

    def test_compute_fft(self):
        DELTA = 0.04
        t = np.linspace(start=0, stop=1, num=10000, dtype=float)
        #
        with self.subTest(name="one"):
            wave = np.sin(2 * math.pi * t * 250)
            freq_axis, freq_data = wave_analyzer.compute_fft(wave, 10000)
            self.assertIn(250, freq_axis)
            for freq, level in zip(freq_axis, freq_data):
                if freq == 250:
                    self.assertAlmostEqual(level, 1, delta=DELTA)
                else:
                    self.assertAlmostEqual(level, 0, delta=DELTA)
        #
        with self.subTest(name="two"):
            wave = 0.5 * np.sin(2 * math.pi * t * 100)
            wave += 1 * np.sin(2 * math.pi * t * 300)
            freq_axis, freq_data = wave_analyzer.compute_fft(wave, 10000)
            self.assertIn(100, freq_axis)
            self.assertIn(300, freq_axis)
            for freq, level in zip(freq_axis, freq_data):
                if freq == 100:
                    self.assertAlmostEqual(level, 0.5, delta=DELTA)
                elif freq == 300:
                    self.assertAlmostEqual(level, 1, delta=DELTA)
                else:
                    self.assertAlmostEqual(level, 0, delta=DELTA)

    def test_get_peak_freq(self):
        self.assertEqual(
            wave_analyzer.get_peak_freq(
                np.array([3.0, 5.5, 7.0, 9.5]), np.array([0.8, 0.3, 0.2, 0.1])
            ),
            3.0
        )
        self.assertEqual(
            wave_analyzer.get_peak_freq(
                np.array([3.0, 5.5, 7.0, 9.5]), np.array([0.1, 0.8, 0.8, 0.1])
            ),
            5.5
        )

