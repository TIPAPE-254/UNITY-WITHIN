# pyright: reportMissingImports=false
import argparse
import json
from pathlib import Path

import kagglehub
from kagglehub import KaggleDatasetAdapter


def _split_dialog_text(text: str):
    if not text:
        return []
    if "__eou__" in text:
        return [t.strip() for t in text.split("__eou__") if t and t.strip()]
    lines = [line.strip() for line in text.split("\n") if line and line.strip()]
    if len(lines) > 1:
        return lines
    return [text.strip()]


def _to_list(value):
    if value is None:
        return []
    if isinstance(value, list):
        return value
    if isinstance(value, str):
        value = value.strip()
        if not value:
            return []
        try:
            parsed = json.loads(value)
            if isinstance(parsed, list):
                return parsed
        except Exception:
            pass
        return _split_dialog_text(value)
    return [str(value)]


def _build_pairs_from_turns(turns, intents=None, emotions=None):
    examples = []
    intents = intents or []
    emotions = emotions or []

    for i in range(len(turns) - 1):
        user_turn = str(turns[i]).strip()
        assistant_turn = str(turns[i + 1]).strip()
        if not user_turn or not assistant_turn:
            continue

        intent = ""
        emotion = ""

        if i + 1 < len(intents):
            intent = str(intents[i + 1]).strip()
        elif i < len(intents):
            intent = str(intents[i]).strip()

        if i + 1 < len(emotions):
            emotion = str(emotions[i + 1]).strip()
        elif i < len(emotions):
            emotion = str(emotions[i]).strip()

        examples.append(
            {
                "user": user_turn,
                "assistant": assistant_turn,
                "intent": intent,
                "emotion": emotion,
            }
        )

    return examples


def _extract_examples(df):
    examples = []

    for _, row in df.iterrows():
        row_dict = row.to_dict()

        turns = (
            _to_list(row_dict.get("dialog"))
            or _to_list(row_dict.get("dialogue"))
            or _to_list(row_dict.get("utterances"))
            or _to_list(row_dict.get("conversation"))
            or _to_list(row_dict.get("text"))
        )

        intents = (
            _to_list(row_dict.get("intent"))
            or _to_list(row_dict.get("intention"))
            or _to_list(row_dict.get("act"))
        )

        emotions = _to_list(row_dict.get("emotion"))

        if len(turns) < 2:
            continue

        examples.extend(_build_pairs_from_turns(turns, intents, emotions))

    return examples


def main():
    parser = argparse.ArgumentParser(
        description="Prepare DailyDialog examples for Buddie conversational calibration"
    )
    parser.add_argument(
        "--file-path",
        default="",
        help="Optional dataset file path within Kaggle dataset (leave empty for auto-detect)",
    )
    parser.add_argument(
        "--max-examples",
        type=int,
        default=2000,
        help="Maximum number of user-assistant examples to export",
    )
    parser.add_argument(
        "--output",
        default="data/dailydialog_examples.json",
        help="Output JSON path relative to server directory",
    )

    args = parser.parse_args()

    dataset = "thedevastator/dailydialog-multi-turn-dialog-with-intention-and"
    candidates = [args.file_path] if args.file_path else [
        "DailyDialog.csv",
        "dailydialog.csv",
        "data.csv",
        "",
    ]

    df = None
    load_error = None

    for candidate in candidates:
        try:
            df = kagglehub.load_dataset(
                KaggleDatasetAdapter.PANDAS,
                dataset,
                candidate,
            )
            print(f"Loaded dataset using file path: '{candidate}'")
            break
        except Exception as err:
            load_error = err
            continue

    if df is None:
        raise RuntimeError(
            "Failed to load DailyDialog dataset. "
            "Try passing an explicit --file-path. "
            f"Last error: {load_error}"
        )

    examples = _extract_examples(df)

    if args.max_examples > 0:
        examples = examples[: args.max_examples]

    output_path = Path(args.output)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(json.dumps(examples, ensure_ascii=False, indent=2), encoding="utf-8")

    print(f"Saved {len(examples)} examples to {output_path}")


if __name__ == "__main__":
    main()
