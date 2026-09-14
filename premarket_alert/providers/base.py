from __future__ import annotations

from abc import ABC, abstractmethod

from ..config import Config
from ..models import Mover


class Provider(ABC):
    """Levert de premarket-beweging van de hele Amerikaanse markt."""

    name = "base"

    def __init__(self, config: Config) -> None:
        self.config = config

    @abstractmethod
    def fetch(self) -> list[Mover]:
        """Alle tickers met een bruikbare premarket-notering, ongefilterd op drempel."""
