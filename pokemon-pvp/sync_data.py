#!/usr/bin/env python3
"""Fetch, validate and publish public Pokémon GO data snapshots.

This static site does not access Pokémon GO accounts or user inventory.
"""
from __future__ import annotations
import json
import pathlib
import re
import sys
import urllib.request
from datetime import datetime, timezone

HERE = pathlib.Path(__file__).resolve().parent
OUT = HERE / "data"
OUT.mkdir(exist_ok=True)
BASE = "https://raw.githubusercontent.com/WatWowMap/pogo-data-api/main/data/v1/"
PVP = "https://raw.githubusercontent.com/pvpoke/pvpoke/master/src/data/rankings/all/overall/rankings-"
GAMEMASTER = "https://raw.githubusercontent.com/pvpoke/pvpoke/master/src/data/gamemaster.json"
API = "https://pogoapi.net/api/v1/"
LEEKDUCK_RAIDS = "https://raw.githubusercontent.com/pokelitee/leak-duck/data/raid_bosses.json"
LEEKDUCK_MANIFEST = "https://raw.githubusercontent.com/pokelitee/leak-duck/data/manifest.json"
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
    "raids": LEEKDUCK_RAIDS,
    "evolutions": API + "pokemon_evolutions.json",
    "gamemaster": GAMEMASTER,
}
REQUIRED = {"pokemon", "moves", "types", "names", "moveNames", "rank1500", "rank2500", "rank10000", "cpm", "gamemaster", "raids"}
TYPE_IDS = {
    "normal": 1, "fighting": 2, "flying": 3, "poison": 4, "ground": 5,
    "rock": 6, "bug": 7, "ghost": 8, "steel": 9, "fire": 10, "water": 11,
    "grass": 12, "electric": 13, "psychic": 14, "ice": 15, "dragon": 16,
    "dark": 17, "fairy": 18,
}
FORM_ZH = {
    "hero": "英雄形態", "crowned sword": "劍之王", "crowned shield": "盾之王",
    "origin": "起源形態", "altered": "別種形態", "therian": "靈獸形態",
    "incarnate": "化身形態", "black": "闇黑形態", "white": "焰白形態",
    "complete forme": "完全體", "50% forme": "50%形態", "10% forme": "10%形態",
    "dawn wings": "拂曉之翼", "dusk mane": "黃昏之鬃", "ultra": "究極形態",
    "shadow": "暗影", "purified": "淨化", "alola": "阿羅拉形態",
    "alolan": "阿羅拉形態", "galar": "伽勒爾形態", "galarian": "伽勒爾形態",
    "hisuian": "洗翠形態", "paldean": "帕底亞形態", "mega": "超級進化",
    "mega x": "超級進化 X", "mega y": "超級進化 Y", "primal": "原始回歸",
    "attack": "攻擊形態", "defense": "防禦形態", "speed": "速度形態",
    "sunshine": "晴天形態", "rainy": "雨天形態", "snowy": "雪天形態",
    "wash": "清洗形態", "heat": "加熱形態", "frost": "結霜形態",
    "fan": "旋轉形態", "mow": "割草形態", "sky": "天空形態",
    "land": "陸上形態", "sea": "海洋形態", "resolute": "覺悟形態",
    "pirouette": "舞步形態", "aria": "歌聲形態",
    "family of four": "四隻家族", "family of three": "三隻家族",
    "hero form": "英雄形態", "zero": "無我形態", "apex": "顛峰形態",
    "ultimate": "終極形態", "white striped": "白條紋形態",
    "blue striped": "藍條紋形態", "red striped": "紅條紋形態",
    "eternal": "永恆花形態", "school": "魚群形態", "solo": "單獨形態",
}

def fetch_json(url):
    req = urllib.request.Request(url, headers={"User-Agent": "GO-Battle-Lab/3.0 (public game data viewer)"})
    with urllib.request.urlopen(req, timeout=60) as response:
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
    if name == "raids":
        if not isinstance(obj, dict):
            raise ValueError("raid feed is not an object")
        total = sum(len(v) for v in obj.values() if isinstance(v, list))
        if total < 8:
            raise ValueError(f"raid feed is incomplete: only {total} bosses")
    if name == "gamemaster" and (not isinstance(obj, dict) or len(obj.get("pokemon", [])) < 1000 or len(obj.get("moves", [])) < 100):
        raise ValueError("PvPoke gamemaster is incomplete")

def normalize(name, obj):
    if name == "raids":
        tier_map = {"1-Star Raids": "1", "3-Star Raids": "3", "5-Star Raids": "5", "Mega Raids": "mega"}
        current = {}
        for label, entries in obj.items():
            tier = tier_map.get(label)
            if tier is None or not isinstance(entries, list):
                continue
            for entry in entries:
                if not isinstance(entry, dict) or not entry.get("name"):
                    continue
                types = [TYPE_IDS[t.lower()] for t in entry.get("types", []) if isinstance(t, str) and t.lower() in TYPE_IDS]
                current.setdefault(tier, []).append({
                    "name": str(entry["name"]), "tier": tier,
                    "is_shadow": bool(entry.get("is_shadow", False)), "types": types,
                    "asset_url": entry.get("asset_url"), "cp_range": entry.get("cp_range"),
                    "boosted_cp_range": entry.get("boosted_cp_range"),
                    "shiny_available": entry.get("shiny_available"),
                })
        total = sum(len(v) for v in current.values())
        if total < 8 or not all(k in current for k in ("1", "3", "5", "mega")):
            raise ValueError(f"normalized raid lineup is incomplete: {total} bosses")
        return {"current": current}
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
        keep = {"speciesId", "speciesName", "score", "moveset", "matchups", "counters", "editorNotes", "moves", "stats"}
        return [{k: p[k] for k in keep if k in p} for p in obj[:600] if isinstance(p, dict)]
    if name == "cpm":
        cpms = {float(x["level"]): float(x["multiplier"]) for x in obj if "level" in x and "multiplier" in x}
        if 45.0 in cpms and 50.0 not in cpms:
            for step in range(1, 11):
                level = 45 + step * 0.5
                cpms[level] = round(cpms[45.0] + 0.0025 * step, 9)
        return [{"level": level, "multiplier": multiplier} for level, multiplier in sorted(cpms.items()) if level <= 50]
    if name == "powerups" and isinstance(obj, dict):
        return [
            {"level": v.get("current_level", float(k)), "stardust": v.get("stardust_to_upgrade"),
             "candy": v.get("candy_to_upgrade", 0), "xl_candy": v.get("xl_candy_to_upgrade", 0)}
            for k, v in obj.items() if isinstance(v, dict)
        ]
    return obj

def slug(value):
    return re.sub(r"[^a-z0-9]+", "_", str(value or "").lower()).strip("_")

def build_form_data(gm, base_pokemon, base_moves, names):
    base_by_dex = {int(p["pokedexId"]): p for p in base_pokemon if p.get("pokedexId")}
    forms = []
    for entry in gm.get("pokemon", []):
        dex = int(entry.get("dex") or 0)
        species_id = str(entry.get("speciesId") or "")
        species_name = str(entry.get("speciesName") or "")
        if not dex or not species_id or not species_name:
            continue
        base = base_by_dex.get(dex, {})
        base_name = re.sub(r"\s*\([^)]*\)", "", species_name).strip()
        parts = re.findall(r"\(([^()]*)\)", species_name)
        if not parts:
            base_slug = slug(base.get("pokemonName") or base_name)
            sid_slug = slug(species_id)
            if sid_slug.startswith(base_slug) and sid_slug != base_slug:
                parts = [sid_slug[len(base_slug):].replace("_", " ").strip()]
            elif sid_slug != base_slug:
                parts = [species_id.replace("_", " ").replace(base_slug, "").strip()]
        # Keep all alternate forms, including Shadow, Mega, regional and battle forms.
        if not parts and slug(species_id) == slug(base.get("pokemonName") or base_name):
            continue
        if not parts:
            parts = [species_id.replace("_", " ").strip()]
        zh_base = names.get("poke_" + str(dex)) or base.get("pokemonName") or base_name
        zh_parts = [FORM_ZH.get(part.lower(), part.replace("_", " ")) for part in parts if part]
        zh_form = "・".join(zh_parts) or "其他形態"
        localized = f"{zh_base}（{zh_form}）"
        stats = entry.get("baseStats") or {}
        types = [TYPE_IDS[t.lower()] for t in entry.get("types", []) if t and t.lower() in TYPE_IDS]
        quick = list(entry.get("fastMoves") or [])
        charged = list(entry.get("chargedMoves") or [])
        legacy = set(entry.get("legacyMoves") or [])
        search_aliases = [
            species_name, species_id, species_name.replace("(", " ").replace(")", " "),
            re.sub(r"[^a-z0-9]+", "", species_name.lower()),
            localized, localized.replace("（", "").replace("）", "").replace("・", ""),
            f"{zh_base}{zh_form}",
        ]
        forms.append({
            "pokedexId": dex, "pokemonKey": species_id, "formId": species_id,
            "speciesId": species_id, "pokemonName": species_name,
            "localizedName": localized, "formLabel": zh_form,
            "searchAliases": list(dict.fromkeys(x for x in search_aliases if x)),
            "types": types, "attack": stats.get("atk"), "defense": stats.get("def"),
            "stamina": stats.get("hp"), "quickMoves": quick, "chargedMoves": charged,
            "eliteQuickMoves": [x for x in quick if x in legacy],
            "eliteChargedMoves": [x for x in charged if x in legacy],
            "thirdMoveStardust": entry.get("thirdMoveCost", base.get("thirdMoveStardust")),
            "thirdMoveCandy": base.get("thirdMoveCandy"),
            "legendary": "legendary" in (entry.get("tags") or []),
            "mythic": "mythical" in (entry.get("tags") or []),
            "buddyDistance": entry.get("buddyDistance"),
            "released": bool(entry.get("released", True)),
            "generation": base.get("generation"), "genId": base.get("genId"),
        })
    # PvPoke move IDs are retained as strings for forms so no move is lost when
    # PoGO API and PvPoke use different IDs or a move is newly introduced.
    gm_moves = []
    for move in gm.get("moves", []):
        move_id = move.get("moveId")
        if not move_id:
            continue
        type_name = str(move.get("type") or "").lower()
        gm_moves.append({
            "moveId": move_id, "name": move.get("name") or move_id,
            "typeId": TYPE_IDS.get(type_name), "type": type_name,
            "power": move.get("power"), "energy": move.get("energy"),
            "energyGain": move.get("energyGain"), "turns": move.get("turns"),
        })
    return forms, gm_moves

def write_json(path, obj):
    path.write_text(json.dumps(obj, ensure_ascii=False, separators=(",", ":")) + "\n", encoding="utf-8")

def main():
    failures, updated = [], []
    gamemaster = None
    raid_updated_at = None
    try:
        manifest = fetch_json(LEEKDUCK_MANIFEST)
        raid_updated_at = (manifest.get("files", {}).get("raid_bosses.json", {}) or {}).get("updated_at")
        print(f"OK raid manifest: last changed {raid_updated_at or 'unknown'}")
    except Exception as exc:
        print(f"WARN raid manifest: {exc}", file=sys.stderr)
    for name, url in SOURCES.items():
        dest = OUT / (name + ".json")
        try:
            obj = fetch_json(url)
            check(name, obj)
            if name == "gamemaster":
                gamemaster = obj
                updated.append(name)
                print(f"OK gamemaster: {len(obj['pokemon'])} Pokémon entries, {len(obj['moves'])} moves")
                continue
            obj = normalize(name, obj)
            write_json(dest, obj)
            updated.append(name)
            print(f"OK {name}: {len(json.dumps(obj, ensure_ascii=False))} characters")
        except Exception as exc:
            print(f"WARN {name}: {exc}", file=sys.stderr)
            failures.append(name)
            fallback = OUT / ("forms.json" if name == "gamemaster" else name + ".json")
            if name in REQUIRED and not fallback.exists():
                raise RuntimeError(f"Required dataset unavailable: {name}") from exc

    if gamemaster is not None:
        required_files = [OUT / "pokemon.json", OUT / "moves.json", OUT / "names.json"]
        if not all(path.exists() for path in required_files):
            raise RuntimeError("Cannot build form index without base Pokémon, moves and Traditional Chinese names")
        base_pokemon = json.loads((OUT / "pokemon.json").read_text(encoding="utf-8"))
        base_moves = json.loads((OUT / "moves.json").read_text(encoding="utf-8"))
        names = json.loads((OUT / "names.json").read_text(encoding="utf-8"))
        forms, gm_moves = build_form_data(gamemaster, base_pokemon, base_moves, names)
        if len(forms) < 500 or not any(x["speciesId"] == "zacian_crowned_sword" for x in forms):
            raise RuntimeError("Form index validation failed: missing expected PvP forms")
        write_json(OUT / "forms.json", forms)
        write_json(OUT / "gmMoves.json", gm_moves)
        updated.extend(["forms", "gmMoves"])
        print(f"OK forms: {len(forms)} alternate forms; Zacian Crowned Sword present")
        print(f"OK gmMoves: {len(gm_moves)} move records")
    elif not (OUT / "forms.json").exists():
        raise RuntimeError("PvPoke gamemaster unavailable and no previous forms snapshot exists")

    (OUT / "meta.json").write_text(
        json.dumps({
            "updated_at": datetime.now(timezone.utc).isoformat(timespec="minutes"),
            "datasets": updated, "stale_datasets": failures,
            "source": "WatWowMap / PvPoke / PoGO API / Leek Duck",
            "raid_source": "Leek Duck via Leak Duck API",
            "raid_updated_at": raid_updated_at,
            "raid_boss_count": sum(len(v) for v in json.loads((OUT / "raids.json").read_text(encoding="utf-8")).get("current", {}).values()),
            "pokemon_base_count": len(json.loads((OUT / "pokemon.json").read_text(encoding="utf-8"))),
            "pokemon_form_count": len(json.loads((OUT / "forms.json").read_text(encoding="utf-8"))),
            "note": "Includes PvPoke battle forms; unreleased entries are labelled. CPM 45.5–50 extrapolated if absent upstream.",
        }, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
    )
    print("Sync complete; failures:", failures)
    return 0

if __name__ == "__main__":
    sys.exit(main())
