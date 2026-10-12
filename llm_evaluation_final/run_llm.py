from __future__ import annotations

import argparse
import csv
import json
import math
import time
from datetime import datetime, timezone
from pathlib import Path

import yaml

ROOT = Path(__file__).resolve().parent
DATA_PATH = ROOT / "data" / "item_001.json"
PROMPT_PATH = ROOT / "prompts" / "prompt_0.yaml"
RESULTS_DIR = ROOT / "results"


def load_materials():
    item = json.loads(DATA_PATH.read_text(encoding="utf-8"))
    cfg = yaml.safe_load(PROMPT_PATH.read_text(encoding="utf-8"))
    return item, cfg


def render_prompt(cfg, story, question):
    system_text = cfg.get("system", "").strip()
    user_text = cfg["user_template"].format(story=story, question=question).strip()
    return system_text, user_text


def load_hf_model(model_name):
    from transformers import AutoModelForCausalLM, AutoTokenizer

    tok = AutoTokenizer.from_pretrained(model_name)
    model = AutoModelForCausalLM.from_pretrained(
        model_name,
        device_map="auto",
        torch_dtype="auto",
    )
    model.eval()
    return tok, model


def call_hf(tok, model, system_text, user_text):
    import torch

    messages = []
    if system_text:
        messages.append({"role": "system", "content": system_text})
    messages.append({"role": "user", "content": user_text})

    prompt = tok.apply_chat_template(
        messages,
        tokenize=False,
        add_generation_prompt=True,
    )
    inputs = tok(prompt, return_tensors="pt")

    # Works for the single-device setup used in this demo; with device_map="auto"
    # this resolves to the model's input device in typical local runs.
    input_device = model.device
    inputs = {k: v.to(input_device) for k, v in inputs.items()}

    start = time.perf_counter()
    with torch.no_grad():
        out = model.generate(
            **inputs,
            max_new_tokens=120,
            do_sample=False,
            return_dict_in_generate=True,
            output_scores=True,
        )
    latency_ms = round((time.perf_counter() - start) * 1000, 1)

    input_len = inputs["input_ids"].shape[1]
    generated_ids = out.sequences[0, input_len:]
    response_text = tok.decode(generated_ids, skip_special_tokens=True).strip()

    # Uncertainty diagnostics over generated content tokens.
    # mean_token_logprob: higher (closer to 0) = more probability assigned to
    # the tokens the model actually generated.
    # mean_token_entropy_nats: higher = a more diffuse next-token distribution.
    selected_logprobs = []
    entropies = []
    special_ids = set(tok.all_special_ids)

    for token_id, step_scores in zip(generated_ids.tolist(), out.scores):
        if token_id in special_ids:
            continue
        logits = step_scores[0].float()
        log_probs = torch.log_softmax(logits, dim=-1)
        probs = torch.softmax(logits, dim=-1)
        selected_logprobs.append(float(log_probs[token_id].item()))
        entropies.append(float((-(probs * log_probs).sum()).item()))

    mean_logprob = (
        sum(selected_logprobs) / len(selected_logprobs)
        if selected_logprobs
        else None
    )
    mean_entropy = (
        sum(entropies) / len(entropies)
        if entropies
        else None
    )

    return {
        "response_text": response_text,
        "latency_ms": latency_ms,
        "input_tokens": int(input_len),
        "output_tokens": int(generated_ids.shape[0]),
        "mean_token_logprob": mean_logprob,
        "mean_token_entropy_nats": mean_entropy,
    }


def call_openai(model, system_text, user_text):
    from openai import OpenAI

    client = OpenAI()
    start = time.perf_counter()
    response = client.responses.create(
        model=model,
        instructions=system_text or None,
        input=user_text,
    )
    usage = getattr(response, "usage", None)
    return {
        "response_text": response.output_text,
        "latency_ms": round((time.perf_counter() - start) * 1000, 1),
        "input_tokens": getattr(usage, "input_tokens", None) if usage else None,
        "output_tokens": getattr(usage, "output_tokens", None) if usage else None,
        # This lightweight OpenAI path does not request token-level distributions.
        "mean_token_logprob": None,
        "mean_token_entropy_nats": None,
    }


def call_dryrun(question_type):
    if question_type == "non_causal_retrieval":
        text = "The invited speaker had mistakenly gone to the wrong building."
    elif question_type == "causal_relevant_retrieval":
        text = (
            "While answering the phone, she accidentally switched Chen's and Patel's "
            "folder labels."
        )
    else:
        text = "Nora accidentally switched Chen's and Patel's folder labels."
    return {
        "response_text": text,
        "latency_ms": 0.0,
        "input_tokens": None,
        "output_tokens": None,
        "mean_token_logprob": None,
        "mean_token_entropy_nats": None,
    }


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--provider", choices=["openai", "hf", "dryrun"], required=True)
    parser.add_argument("--model", default="dryrun-model")
    parser.add_argument("--repeats", type=int, default=1)
    args = parser.parse_args()

    item, cfg = load_materials()
    RESULTS_DIR.mkdir(exist_ok=True)

    tok = model = None
    if args.provider == "hf":
        print(f"Loading model once: {args.model}")
        tok, model = load_hf_model(args.model)

    rows = []
    for q in item["questions"]:
        question_type = q["question_type"]
        system_text, user_text = render_prompt(cfg, item["story"], q["question"])

        for repeat in range(1, args.repeats + 1):
            error = ""
            try:
                if args.provider == "hf":
                    result = call_hf(tok, model, system_text, user_text)
                elif args.provider == "openai":
                    result = call_openai(args.model, system_text, user_text)
                else:
                    result = call_dryrun(question_type)
            except Exception as exc:
                result = {
                    "response_text": "",
                    "latency_ms": None,
                    "input_tokens": None,
                    "output_tokens": None,
                    "mean_token_logprob": None,
                    "mean_token_entropy_nats": None,
                }
                error = f"{type(exc).__name__}: {exc}"

            row = {
                "timestamp_utc": datetime.now(timezone.utc).isoformat(),
                "item_id": item["item_id"],
                "prompt_id": cfg["id"],
                "provider": args.provider,
                "model": args.model,
                "question_type": question_type,
                "question": q["question"],
                "repeat": repeat,
                "response_text": result["response_text"],
                "latency_ms": result["latency_ms"],
                "input_tokens": result["input_tokens"],
                "output_tokens": result["output_tokens"],
                "mean_token_logprob": result["mean_token_logprob"],
                "mean_token_entropy_nats": result["mean_token_entropy_nats"],
                "manual_score": "",
                "error": error,
            }
            rows.append(row)

            print(f"\n[{question_type} | run {repeat}] {result['response_text']}")
            if result["mean_token_logprob"] is not None:
                print(
                    "  mean token logprob: "
                    f"{result['mean_token_logprob']:.4f} | "
                    "mean token entropy: "
                    f"{result['mean_token_entropy_nats']:.4f} nats"
                )

    ts = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")
    safe_model = args.model.replace("/", "__")
    out_path = RESULTS_DIR / f"{ts}_{args.provider}_{safe_model}.csv"

    with out_path.open("w", encoding="utf-8-sig", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=list(rows[0].keys()))
        writer.writeheader()
        writer.writerows(rows)

    print(f"\nSaved results to: {out_path}")
    print("\nInterpretation note:")
    print("- Higher mean_token_entropy_nats = more diffuse next-token uncertainty.")
    print("- Lower/more-negative mean_token_logprob = less probability on generated tokens.")
    print("- These are uncertainty diagnostics, not direct measures of human-like effort.")


if __name__ == "__main__":
    main()
