# pyright: reportMissingImports=false
import argparse
import json
from pathlib import Path

from datasets import load_dataset


def _pick_first(row, keys):
    for key in keys:
        value = row.get(key)
        if value is None:
            continue
        text = str(value).strip()
        if text:
            return text
    return ""


def _extract_examples(dataset_split, max_examples: int):
    user_keys = [
        "Context", "context", "question", "prompt", "input", "utterance", "text", "instruction"
    ]
    assistant_keys = [
        "Response", "response", "answer", "output", "reply", "assistant", "completion"
    ]
    intent_keys = ["Intent", "intent", "topic", "category"]

    examples = []
    for row in dataset_split:
        user = _pick_first(row, user_keys)
        assistant = _pick_first(row, assistant_keys)

        if not user or not assistant:
            continue

        intent = _pick_first(row, intent_keys)

        examples.append(
            {
                "user": user,
                "assistant": assistant,
                "intent": intent or "counseling",
                "emotion": "",
            }
        )

        if max_examples > 0 and len(examples) >= max_examples:
            break

    return examples


def main():
    parser = argparse.ArgumentParser(
        description="Prepare Hugging Face mental health counseling examples for Buddie calibration"
    )
    parser.add_argument(
        "--dataset-id",
        default="Amod/mental_health_counseling_conversations",
        help="Hugging Face dataset id",
    )
    parser.add_argument(
        "--split",
        default="train",
        help="Dataset split to use (default: train)",
    )
    parser.add_argument(
        "--max-examples",
        type=int,
        default=3000,
        help="Maximum number of user-assistant examples to export",
    )
    parser.add_argument(
        "--output",
        default="data/mental_health_counseling_examples.json",
        help="Output JSON path relative to server directory",
    )

    args = parser.parse_args()

    dataset_split = load_dataset(args.dataset_id, split=args.split)
    examples = _extract_examples(dataset_split, args.max_examples)

    output_path = Path(args.output)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(json.dumps(examples, ensure_ascii=False, indent=2), encoding="utf-8")

    print(f"Saved {len(examples)} examples to {output_path}")


if __name__ == "__main__":
    main()
