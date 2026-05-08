"""
Deterministic rule engine — fires in <1ms, no ML needed.

Rules cover all immediate corrective actions: pH correction, EC dosing/flush,
temperature/humidity HVAC guidance, VPD correction.

Output: list of ImmediateAction dicts.
"""

from typing import Any, Dict, List

ImmediateAction = Dict[str, str]   # metric, action, severity


def _pct_from_center(val: float, lo: float, hi: float) -> float:
    """How far from the centre of [lo, hi] relative to the half-range."""
    center = (lo + hi) / 2
    half = (hi - lo) / 2 or 1.0
    return (val - center) / half


def run_rules(metrics: Dict[str, float], targets: Dict[str, List[float]]) -> List[ImmediateAction]:
    actions: List[ImmediateAction] = []

    def _t(key: str):
        v = targets.get(key)
        if v and len(v) >= 2:
            return float(v[0]), float(v[1])
        return None, None

    # ── pH ──────────────────────────────────────────────────────────────────
    ph = metrics.get("ph")
    ph_lo, ph_hi = _t("ph")
    if ph is not None and ph_lo and ph_hi:
        margin = (ph_hi - ph_lo) * 0.1
        if ph > ph_hi + margin:
            ml = round(min(30, (ph - ph_hi) * 15), 1)
            actions.append({
                "metric": "ph",
                "action": f"pH is {ph:.2f} — dose {ml} ml pH Down per 10L of reservoir",
                "severity": "critical" if ph > ph_hi + 0.5 else "warning",
            })
        elif ph < ph_lo - margin:
            ml = round(min(20, (ph_lo - ph) * 10), 1)
            actions.append({
                "metric": "ph",
                "action": f"pH is {ph:.2f} — dose {ml} ml pH Up per 10L of reservoir",
                "severity": "critical" if ph < ph_lo - 0.5 else "warning",
            })

    # ── EC ──────────────────────────────────────────────────────────────────
    ec = metrics.get("ec")
    ec_lo, ec_hi = _t("ec")
    if ec is not None and ec_lo and ec_hi:
        margin = (ec_hi - ec_lo) * 0.1
        if ec > ec_hi + margin:
            actions.append({
                "metric": "ec",
                "action": f"EC is {ec:.2f} mS — top up reservoir with plain pH'd water to dilute",
                "severity": "warning",
            })
        elif ec < ec_lo - margin:
            pct = round(min(30, (ec_lo - ec) / ec_lo * 100), 0)
            actions.append({
                "metric": "ec",
                "action": f"EC is {ec:.2f} mS — increase nutrient solution concentration by {pct:.0f}%",
                "severity": "warning",
            })

    # ── Temperature ─────────────────────────────────────────────────────────
    temp = metrics.get("temp")
    t_lo, t_hi = _t("temp")
    if temp is not None and t_lo and t_hi:
        if temp > t_hi + 1.5:
            actions.append({
                "metric": "temp",
                "action": f"Temp is {temp:.1f}°C — increase extraction fan speed or activate cooler",
                "severity": "critical" if temp > t_hi + 3 else "warning",
            })
        elif temp < t_lo - 1.5:
            actions.append({
                "metric": "temp",
                "action": f"Temp is {temp:.1f}°C — activate heater or reduce extraction fan speed",
                "severity": "warning",
            })

    # ── Humidity ────────────────────────────────────────────────────────────
    hum = metrics.get("humidity")
    h_lo, h_hi = _t("humidity")
    if hum is not None and h_lo and h_hi:
        if hum > h_hi + 5:
            actions.append({
                "metric": "humidity",
                "action": f"Humidity is {hum:.0f}% — run dehumidifier and increase airflow",
                "severity": "critical" if hum > h_hi + 15 else "warning",
            })
        elif hum < h_lo - 5:
            actions.append({
                "metric": "humidity",
                "action": f"Humidity is {hum:.0f}% — run humidifier or reduce extraction speed",
                "severity": "info",
            })

    # ── VPD ─────────────────────────────────────────────────────────────────
    vpd = metrics.get("vpd")
    if vpd is not None:
        if vpd > 1.8:
            actions.append({
                "metric": "vpd",
                "action": f"VPD is {vpd:.2f} kPa (too high) — raise humidity or lower temperature",
                "severity": "warning",
            })
        elif vpd < 0.4:
            actions.append({
                "metric": "vpd",
                "action": f"VPD is {vpd:.2f} kPa (too low) — lower humidity or raise temperature",
                "severity": "info",
            })

    # ── CO₂ ─────────────────────────────────────────────────────────────────
    co2 = metrics.get("co2")
    c_lo, c_hi = _t("co2")
    if co2 is not None and c_lo and c_hi:
        if co2 < c_lo - 100:
            actions.append({
                "metric": "co2",
                "action": f"CO₂ is {co2:.0f} ppm — check CO₂ supply or increase fresh-air exchange",
                "severity": "info",
            })

    return actions
