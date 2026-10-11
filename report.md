## Veresa — Generation Issue Diagnostic

**Repo:** https://github.com/AjuAbraham/Assistant

**Device:** iQOO Neo 10R, 8 GB RAM  
**Stack:** React Native, Expo, `llama.rn`, GGUF, offline inference.

### Observed results

- **Q1 Conversation:** Natural, coherent answer, but included a `<think>` section.
- **Q2 Exact 120-word story:** Final answer stopped mid-sentence, despite the thinking section containing a complete draft.
- **Q3 Creative scene:** Only lengthy planning appeared; no final story.
- **Q4 Mystery:** Only planning appeared; no completed mystery.

### Reported configuration

```ts
n_ctx: 2048,
n_threads: 4,
n_gpu_layers: 0,
max_tokens: 512,
jinja: true,
enable_thinking: false,
temperature: 0.7,
top_p: 0.8,
top_k: 20,
penalty_repeat: 1.05
```

Verify these settings against the actual code and installed `llama.rn` version.

### Tasks

1. Inspect `App.tsx`, model initialization, generation, streaming callbacks, and conversation history.
2. Investigate why `<think>` appears despite `enable_thinking: false`.
3. Check the model's GGUF chat template and correct Qwen3 formatting.
4. Determine whether incomplete output originates in native inference or UI streaming.
5. Check termination reasons, token limits, duplicate chunks, and errors.
6. Run controlled tests, changing one setting at a time.

### Constraints

- Preserve working offline chat and model management.
- Don't replace models or change all sampling settings blindly.
- Don't assume the root cause without evidence.
- Make the smallest justified fix and verify it on Android.

**Deliverable:** Identify the likely root cause, exact code changes, and test results. Distinguish confirmed findings from hypotheses.