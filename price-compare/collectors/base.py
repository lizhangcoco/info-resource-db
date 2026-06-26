from abc import ABC, abstractmethod
from typing import List

from storage.models import Product


class BaseCollector(ABC):
    name: str = "base"
    platform: str = "base"

    @abstractmethod
    def search(self, keyword: str, limit: int = 20) -> List[Product]:
        pass
