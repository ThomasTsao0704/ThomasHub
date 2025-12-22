from __future__ import annotations

import math
from typing import Any

import numpy as np


def _is_invalid_number(value: Any) -> bool:
    if isinstance(value, float):
        return math.isnan(value) or math.isinf(value)
    if isinstance(value, np.floating):
        return np.isnan(value) or np.isinf(value)
    return False


def sanitize_json(value: Any) -> Any:
    if isinstance(value, dict):
        return {key: sanitize_json(item) for key, item in value.items()}
    if isinstance(value, list):
        return [sanitize_json(item) for item in value]
    if isinstance(value, tuple):
        return [sanitize_json(item) for item in value]
    if _is_invalid_number(value):
        return None
    return value
