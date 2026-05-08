import math
import random
from datetime import datetime
from typing import Optional


def compute_vpd(temp: float, humidity: float) -> float:
    svp = 0.6108 * math.exp(17.27 * temp / (temp + 237.3))
    return round(svp * (1.0 - humidity / 100.0), 2)


def compute_status(metrics: dict, targets: dict) -> str:
    critical = 0
    warning = 0
    for key in ["temp", "humidity", "ph", "ec", "co2"]:
        if key not in targets or key not in metrics:
            continue
        val = float(metrics[key])
        lo, hi = float(targets[key][0]), float(targets[key][1])
        margin = (hi - lo) * 0.10
        if val < lo - margin or val > hi + margin:
            critical += 1
        elif val < lo or val > hi:
            warning += 1
    if critical > 0:
        return "critical"
    if warning > 0:
        return "warning"
    return "healthy"


def is_light_on(light_schedule: dict, current_hour: Optional[float] = None) -> bool:
    if current_hour is None:
        now = datetime.now()
        current_hour = now.hour + now.minute / 60.0
    on = float(light_schedule["onHour"])
    off = float(light_schedule["offHour"])
    if on < off:
        return on <= current_hour < off
    return current_hour >= on or current_hour < off


def simulate_tick(current: dict, config: dict, targets: dict, light_on: bool) -> dict:
    base_temp = float(config.get("baseTemp", 24.0))
    base_humidity = float(config.get("baseHumidity", 65.0))
    ph_drift_rate = float(config.get("phDriftRate", 0.01))
    ec_decay_rate = float(config.get("ecDecayRate", 0.005))
    tick_hours = 10.0 / 60.0

    temp_target = base_temp + (2.0 if light_on else -2.0)
    new_temp = current["temp"] + 0.2 * (temp_target - current["temp"]) + random.gauss(0, 0.3)

    humidity_effect = -0.5 * (new_temp - base_temp)
    humidity_target = base_humidity + humidity_effect
    new_humidity = current["humidity"] + 0.15 * (humidity_target - current["humidity"]) + random.gauss(0, 1.0)
    new_humidity = max(20.0, min(95.0, new_humidity))

    ph_centre = (float(targets["ph"][0]) + float(targets["ph"][1])) / 2.0
    drift = ph_drift_rate * tick_hours
    if current["ph"] > ph_centre:
        drift *= 0.3
    new_ph = current["ph"] + drift + random.gauss(0, 0.02)

    new_ec = current["ec"] - ec_decay_rate * tick_hours + random.gauss(0, 0.02)
    if random.random() < 0.02:
        ec_centre = (float(targets["ec"][0]) + float(targets["ec"][1])) / 2.0
        new_ec = ec_centre + random.gauss(0, 0.1)

    co2_target = (float(targets["co2"][0]) + float(targets["co2"][1])) / 2.0 if light_on else 400.0
    new_co2 = current["co2"] + 0.1 * (co2_target - current["co2"]) + random.gauss(0, 15.0)
    new_co2 = max(350.0, min(2000.0, new_co2))

    new_vpd = compute_vpd(new_temp, new_humidity)

    return {
        "temp": round(new_temp, 1),
        "humidity": round(new_humidity, 1),
        "ph": round(new_ph, 2),
        "ec": round(new_ec, 2),
        "co2": round(new_co2, 0),
        "vpd": new_vpd,
    }
