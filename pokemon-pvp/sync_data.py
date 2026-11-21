#!/usr/bin/env python3
"""Fetch community Pokémon GO data and publish validated static snapshots.

No OAuth tokens or user inventory are accessed. Use Python stdlib only.
"""
from __future__ import annotations
import json
import pathlib
import sys
import urllib.request
from datetime import datetime, timezone

HERE = pathlib.Path(__file__).resolve().parent
OUT = HERE / "data"
OUT.mkdir(exist_ok=True)
BASE = "https://raw.githubusercontent.com/WatWowMap/pogo-data-api/main/data/v1/"
PVP = "https://raw.githubusercontent.com/pvpoke/pvpoke/master/src/data/rankings/all/overall/rankings-"
API = "https://pogoapi.net/api/v1/"
SOURCES = {
    "pokemon": BASE + "pokemon.json",
    "moves": BASE + "moves.json",
    "types": BASE + "types.json",
    "names": BASE + "translations/zh-tw/pokemon.json",
    "moveNames": BASE + "translations/zh-tw/moves.json",
    "typeNames": BASE + "translations/zh-tw/types.json",
    "rank1500": PVP + "1500.json",
    "rank2500": PVP + "2500.json",
    "rank10000": PVP + "10000.json",
    "cpm": API + "cp_multiplier.json",
    "powerups": API + "pokemon_powerup_requirements.json",
    "raids": API + "raid_bosses.json",
}
REQUIRED = {"pokemon", "moves", "types", "names", "moveNames", "rank1500", "rank2500", "rank10000", "cpm"}


def fetch_json(url):
    req = urllib.request.Request(
        url, headers={"User-Agent": "GO-Battle-Lab/2.0 (noncommercial game data viewer)"}
    )
    with urllib.request.urlopen(req, timeout=45) as response:
        return json.load(response)


def check(name, obj):
    if name in {"pokemon", "moves", "types"} and (not isinstance(obj, list) or len(obj) < 15):
        raise ValueError(f"{name}: incomplete collection")
    if name.startswith("rank") and (not isinstance(obj, list) or len(obj) < 20):
        raise ValueError(f"{name}: incomplete rankings")
    if name in {"names", "moveNames"} and (not isinstance(obj, dict) or len(obj) < 100):
        raise ValueError(f"{name}: incomplete localization")
    if name == "cpm" and (not isinstance(obj, list) or len(obj) < 70):
        raise ValueError("incomplete CP multipliers")


def normalize(name, obj):
    if name == "pokemon":
        keys = {
            "pokedexId", "pokemonName", "types", "attack", "defense", "stamina",
            "quickMoves", "chargedMoves", "eliteQuickMoves", "eliteChargedMoves",
            "thirdMoveStardust", "thirdMoveCandy", "family", "legendary", "mythic",
            "generation", "genId",
        }
        return [{k: p[k] for k in keys if k in p} for p in obj if isinstance(p, dict) and p.get("pokedexId")]
    if name == "moves":
        keys = {
            "moveId", "moveName", "proto", "fast", "type",
            "pvpPower", "pvpEnergyDelta", "pvpDurationTurns",
            "durationMs", "power", "energyDelta", "pvpBuffs",
        }
        return [{k: p[k] for k in keys if k in p} for p in obj if isinstance(p, dict)]
    if name.startswith("rank"):
        keep = {"speciesId", "speciesName", "score", "moveset", "matchups", "counters", "editorNotes"}
        return [{k: p[k] for k in keep if k in p} for p in obj[:600] if isinstance(p, dict)]
    if name == "cpm":
        # Some community feeds stop at 45. The 45–50 half-level CP multipliers
        # are explicitly extrapolated at +0.0025 per half-level, not sourced values.
        cpms = {float(x["level"]): float(x["multiplier"]) for x in obj if "level" in x and "multiplier" in x}
        if 45.0 in cpms and 50.0 not in cpms:
            for step in range(1, 11):
                level = 45 + step * 0.5
                cpms[level] = round(cpms[45.0] + 0.0025 * step, 9)
        return [{"level": level, "multiplier": multiplier} for level, multiplier in sorted(cpms.items()) if level <= 50]
    if name == "powerups":
        if isinstance(obj, dict):
            return [
                {
                    "level": v.get("current_level", float(k)),
                    "stardust": v.get("stardust_to_upgrade"),
                    "candy": v.get("candy_to_upgrade", 0),
                    "xl_candy": v.get("xl_candy_to_upgrade", 0),
                }
                for k, v in obj.items() if isinstance(v, dict)
            ]
    return obj


def main():
    failures = []
    updated = []
    for name, url in SOURCES.items():
        dest = OUT / (name + ".json")
        try:
            obj = fetch_json(url)
            check(name, obj)
            obj = normalize(name, obj)
            data = json.dumps(obj, ensure_ascii=False, separators=(",", ":")) + "\n"
            dest.write_text(data, encoding="utf-8")
            updated.append(name)
            print(f"OK {name}: {len(data)} characters")
        except Exception as exc:
            print(f"WARN {name}: {exc}", file=sys.stderr)
            failures.append(name)
            if name in REQUIRED and not dest.exists():
                raise RuntimeError(f"Required dataset unavailable: {name}") from exc
    (OUT / "meta.json").write_text(
        json.dumps(
            {"updated_at": datetime.now(timezone.utc).isoformat(timespec="minutes"),
             "datasets": updated, "stale_datasets": failures,
             "source": "WatWowMap / PvPoke / PoGO API",
             "note": "Not official Niantic account data. CPM 45.5–50 extrapolated."},
            ensure_ascii=False, indent=2
        ) + "\n", encoding="utf-8"
    )
    print("Sync complete; failures:", failures)
    return 0


if __name__ == "__main__":
    sys.exit(main())
