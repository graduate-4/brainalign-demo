# Experiment Design

## Background

Research on human narrative comprehension suggests that earlier information can become more accessible when it later becomes causally relevant. In classic online reading work, previously backgrounded causal information was reinstated when it was needed to understand a current event (Klin & Myers, 1993). Recent naturalistic neuroimaging work similarly shows that causally related past events can be retrieved and neurally reinstated during later narrative understanding (Song et al., 2026).

The current demo asks whether the effect of causal relevance can also be observed in a later explicit retrieval task, and whether a similar behavioral pattern appears in language models.

## Goal

The demo asks two related questions:

1. **Does later causal relevance change the retrieval of distant narrative information in humans and language models?**
2. **If causally relevant information can be retrieved, can it also be integrated to explain a later outcome?** **How does causal retrieval differ from causal integration in long-range narrative understanding?**


## Paradigm

Humans and language models read the same multi-page narrative and answer three open-ended questions.

### 1. Non-causal retrieval

This question targets an earlier event that does not contribute to the later folder outcome.

> **What had happened to the invited speaker?**

Target answer:

> The invited speaker had mistakenly gone to the wrong building.

### 2. Causally relevant retrieval

This question targets an earlier event that later becomes relevant to the folder outcome.

> **What happened while Nora was answering the phone?**

Target answer:

> She accidentally switched Chen’s and Patel’s folder labels.

### 3. Causal integration

This question requires using that earlier event to explain the later outcome.

> **How did Patel’s proposal most likely end up in the folder marked with Chen’s name?**

Target answer:

> Nora had attached Chen’s label to Patel’s folder, causing Patel’s proposal to appear inside the folder marked with Chen’s name.

The primary retrieval comparison is **Question 1 vs. Question 2**. The second comparison is **Question 2 vs. Question 3**, which separates successful retrieval of the relevant event from successful use of that event in a causal explanation. 

## Human task

For each question:

1. The question appears on screen.
2. When the participant has understood the question, they press the space bar once. They do not need to have thought of the answer yet.
3. The question remains visible and the message **“Thinking… Press SPACE when you have your answer.”** appears.
4. When the participant has thought of an answer, they press the space bar again.
5. A text box appears and the participant types the answer.

The saved response-time measure is:

**second space-bar press − first space-bar press**

Question-onset-to-first-press time is not used as a core measure, and typing time is excluded from the response-time measure. Accuracy is scored from the typed answer.

## LLM task

Each question is run in a fresh model context containing the full narrative and only that question. This avoids cross-question cueing.

Current measures are:

- response accuracy;
- mean token log-probability;
- mean next-token entropy.

Log-probability and entropy are interpreted as measures of **generation uncertainty.

## Human–LLM comparison

（1） The first comparison asks whether causal relevance changes later targeted retrieval:

- **non-causal retrieval** vs. **causally relevant retrieval**.

If human participants show faster or more accurate retrieval for the causally relevant event, the key question is whether language models show a comparable response profile.



（2） The second comparison asks whether information that can be retrieved can also be used successfully:

- **causally relevant retrieval** vs. **causal integration**.

This distinction allows retrieval and integration to be evaluated separately rather than treating them as the same process.

## LLM evaluation

The current version contains one narrative item and three local open-weight baselines:

- Qwen2.5-1.5B-Instruct;
- Qwen2.5-3B-Instruct;
- Qwen2.5-7B-Instruct.

The three models did not show a consistent causal-relevance advantage in generation uncertainty for the two retrieval questions. The smaller models showed greater uncertainty on the causal-integration question, while the 7B model answered the integration question correctly with low uncertainty.

These results are illustrative only. One item and one run per model are not sufficient to establish a general effect.

## References

- Klin, C. M., & Myers, J. L. (1993). *Reinstatement of causal information during reading*. Journal of Experimental Psychology: Learning, Memory, and Cognition, 19(3), 554–560. https://doi.org/10.1037/0278-7393.19.3.554
- Song, H., Ke, J., Madhogarhia, R., Leong, Y. C., & Rosenberg, M. D. (2026). *Cortical reinstatement of causally related events sparks narrative insights by updating neural representation patterns*. Nature Communications, 17, 7362. https://doi.org/10.1038/s41467-026-73914-3
