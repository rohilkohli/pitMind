import os

replacements = {
    "from config": "from config",
    "from services": "from services",
    "from models.race_state import LapPoint, TelemetryPayload": "from models.race_state import LapPoint, TelemetryPayload",
    "from models.strategy import StrategyRecommendation
from models.race_state import TelemetryPayload": "from models.strategy import StrategyRecommendation\nfrom models.race_state import TelemetryPayload",
    "from models.race_state import LapPoint, TelemetryPayload
from models.strategy import StrategyRecommendation, StrategyScores": "from models.race_state import LapPoint, TelemetryPayload\nfrom models.strategy import StrategyRecommendation, StrategyScores",
    "from models.chat import ChatRequest, ChatResponse, DebriefResponse, DriverCompareRequest, DriverCompareResponse
from models.race_state import TelemetryPayload
# (": "from models.chat import ChatRequest, ChatResponse, DebriefResponse, DriverCompareRequest, DriverCompareResponse\nfrom models.race_state import TelemetryPayload\n# (",
}

for root, _, files in os.walk("e:/pitMind/backend"):
    for file in files:
        if file.endswith(".py"):
            path = os.path.join(root, file)
            with open(path, "r", encoding="utf-8") as f:
                content = f.read()
            
            orig = content
            for k, v in replacements.items():
                content = content.replace(k, v)
                
            if content != orig:
                with open(path, "w", encoding="utf-8") as f:
                    f.write(content)
                print(f"Updated {path}")
