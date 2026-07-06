from typing import List

from collectors.base import BaseCollector
from collectors.mock_collector import MockCollector


class JDCollector(MockCollector):
    name = "京东采集器"
    platform = "jd"

    def __init__(self):
        super().__init__(platform="jd")


class TaobaoCollector(MockCollector):
    name = "淘宝采集器"
    platform = "taobao"

    def __init__(self):
        super().__init__(platform="taobao")


class PinduoduoCollector(MockCollector):
    name = "拼多多采集器"
    platform = "pinduoduo"

    def __init__(self):
        super().__init__(platform="pinduoduo")


COLLECTOR_MAP = {
    "jd": JDCollector,
    "taobao": TaobaoCollector,
    "pinduoduo": PinduoduoCollector,
}


def get_collector(platform: str) -> BaseCollector:
    cls = COLLECTOR_MAP.get(platform)
    if not cls:
        raise ValueError(f"不支持的平台: {platform}")
    return cls()


def get_collectors(platforms: List[str] = None) -> List[BaseCollector]:
    if platforms is None:
        platforms = list(COLLECTOR_MAP.keys())
    return [get_collector(p) for p in platforms if p in COLLECTOR_MAP]


def get_supported_platforms() -> List[str]:
    return list(COLLECTOR_MAP.keys())
