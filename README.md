# Long-Range Narrative Understanding: Human–LLM Behavioral Demo

This repository contains a proof-of-concept human–LLM behavioral paradigm for long-range narrative understanding. It examines whether **later causal relevance changes the retrieval of distant narrative information**, and how **causal retrieval differs from causal integration**.

**Try the human behavioral experiment online:**  
https://brainalign-behavioral-demo-teal.vercel.app/

## Task

Humans and language models read the same multi-page narrative and answer three open-ended questions:

1. **Non-causal retrieval**
2. **Causally relevant retrieval**
3. **Causal integration**

The comparison between Questions 1 and 2 tests whether later causal relevance changes the accessibility of an earlier event. The comparison between Questions 2 and 3 provides a preliminary test of the difference between retrieving causally relevant information and integrating that information to explain a later outcome.

## Human behavioral demo

The browser task uses a two-press procedure to separate question comprehension from answer preparation. The main response-time measure is the interval between the first press, when the participant has understood the question, and the second press, when they have an answer in mind.

## LLM evaluation

Each question is evaluated in a fresh, independent model context containing the full story and only that question. The current evaluation records response accuracy, mean token log-probability, and mean next-token entropy. The probability measures are treated as **generation-uncertainty diagnostics**, not as direct analogues of human response time or cognitive effort.

Current local baselines:

| Model        | Non-causal retrieval entropy | Causally relevant retrieval entropy | Causal integration entropy |
| ------------ | ----------------------------:| -----------------------------------:| --------------------------:|
| Qwen2.5-1.5B | 0.565                        | 0.367                               | 1.494                      |
| Qwen2.5-3B   | 0.235                        | 0.274                               | 0.501                      |
| Qwen2.5-7B   | 0.039                        | 0.149                               | 0.125                      |

All three models answered both retrieval questions correctly in the current run. The 3B model produced a directional label-assignment error on the causal-integration question, while the 7B model answered it correctly with low uncertainty. These results are illustrative only because the current proof of concept contains one narrative item and one run per model.

## Repository structure

```text
├── README.md
├── EXPERIMENT_DESIGN.md
├── behavioral_demo/
│   ├── index.html
│   ├── experiment.js
│   └── style.css
└── llm_evaluation/
    ├── README.md
    ├── run_llm.py
    ├── scoring_rubric.json
    ├── requirements-local.txt
    ├── requirements-openai.txt
    ├── data/
    │   └── item_001.json
    ├── prompts/
    │   └── prompt_0.yaml
    └── results/
        ├── qwen2.5-1.5b.csv
        ├── qwen2.5-3b.csv
        └── qwen2.5-7b.csv
```

The `behavioral_demo/` folder contains the browser-based human task, and `llm_evaluation/` contains the model-evaluation code and baseline outputs. More detailed information about the experimental design is provided in `EXPERIMENT_DESIGN.md`.

## Status

- One narrative item is implemented.
- The human task is live and functional.
- Three local open-weight model baselines have been run.
- The next step is to expand the paradigm to multiple matched narratives and collect human data.

## Development note

AI-assisted coding was used to support implementation and debugging. The research question, experimental logic, materials, and evaluation design were developed by the author.
