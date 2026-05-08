import torch
import pytest
from ai.forecast.patch_tst import PatchTST
from ai.forecast.model import PatchTSTForecaster, _daily_averages


def test_output_shape():
    m = PatchTST(seq_len=1008, pred_len=5, patch_len=24, stride=12, d_model=64, n_heads=4, n_layers=2)
    assert m(torch.randn(4, 1008)).shape == (4, 5)


def test_no_nan():
    m = PatchTST(seq_len=1008, pred_len=5, patch_len=24, stride=12, d_model=64, n_heads=4, n_layers=2)
    assert not torch.isnan(m(torch.randn(1, 1008))).any()


def test_wrapper_untrained(tmp_path):
    m = PatchTSTForecaster("temp")
    m.load()
    result = m.predict(list(range(1008)))
    assert len(result) == 5


def test_wrapper_all_metrics(tmp_path):
    for metric in ["temp", "humidity", "ph", "ec"]:
        m = PatchTSTForecaster(metric)
        m.load()
        result = m.predict([float(i % 100) for i in range(1008)])
        assert len(result) == 5
        assert all(isinstance(v, float) for v in result)


def test_daily_averages_basic():
    readings = [1.0] * (144 * 3)
    daily = _daily_averages(readings)
    assert len(daily) == 3
    assert all(abs(v - 1.0) < 0.01 for v in daily)


def test_linear_fallback_fewer_than_seq_len():
    m = PatchTSTForecaster("ph")
    m.load()
    result = m.predict([6.0] * 50)
    assert len(result) == 5
