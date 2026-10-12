# LLM Evaluation

This folder contains the code used for the language-model side of the demo.

## Files

- `run_llm.py` — runs the evaluation
- `data/item_001.json` — narrative and questions
- `prompts/prompt_0.yaml` — model prompt
- `scoring_rubric.json` — manual scoring criteria
- `results/` — current Qwen baseline outputs

## Run

Install local-model dependencies:

```bash
python -m pip install -r requirements-local.txt
```

Run a model:

```bash
python run_llm.py --provider hf --model Qwen/Qwen2.5-1.5B-Instruct --repeats 1
```

Replace the model name with `Qwen/Qwen2.5-3B-Instruct` or `Qwen/Qwen2.5-7B-Instruct` for the other baselines.

Each question is evaluated in a fresh model context. Output CSV files are saved in `results/`.
