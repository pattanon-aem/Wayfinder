from __future__ import annotations
from typing import Dict, Any
import os
import json


def explain_mode(mode: str, ctx: Dict[str, Any]) -> str:
    """Produce a short explanation for a single mode using the configured LLM.

    Returns a plain-text paragraph (1-2 sentences).
    Raises RuntimeError on missing API key, missing model, or client errors.
    """
    system = (
        "You are an assistant that writes concise, user-friendly transport advice. "
        "Given structured context about a single transport mode (ETAs, prices, incidents, parking), "
        "produce one short paragraph (1-2 sentences) giving the best recommendation for that mode. "
        "When the input includes specific fields, prefer to mention them by name. For example: "
        "the bus service number(s), which route is fastest, where an incident or roadwork is located (if relevant to the route)"
        "(e.g. 'incident at AYE near Exit 3'), available parking lot counts, and taxi availability. "
        "If there are multiple candidate routes or itineraries, briefly compare them "
        "(e.g. 'Route A (service 123) is 3 min faster than Route B (service 45) but requires a transfer'). "
        "Return ONLY the paragraph as plain text — no JSON, no extra commentary."
    )

    try:
        ctx_json = json.dumps(ctx, ensure_ascii=False)
    except Exception:
        ctx_json = str(ctx)

    user_prompt = (
        f"Mode: {mode}\n\n"
        f"Context JSON:\n{ctx_json}\n\n"
        "Write one short paragraph including specifics when present: "
        "bus numbers, incident locations, which route is recommended and why, "
        "and any important caveats."
    )

    hf_token = os.getenv("HUGGINGFACEHUB_API_TOKEN") or os.getenv("HF_API_TOKEN")
    model = os.getenv("QWEN_MODEL")

    if not hf_token:
        raise RuntimeError(
            "Hugging Face API token not set. "
            "Set HUGGINGFACEHUB_API_TOKEN or HF_API_TOKEN to a valid token."
        )

    if not model:
        raise RuntimeError(
            "QWEN_MODEL not set. "
            "Set QWEN_MODEL to the Hugging Face model repo id "
            "(e.g. 'Qwen/Qwen2.5-7B-Instruct')."
        )

    try:
        from huggingface_hub import InferenceClient  # type: ignore
    except Exception as e:
        raise RuntimeError(
            "huggingface_hub not installed. Install with:\n\n"
            "    pip install huggingface-hub\n\n"
            f"Original error: {e}"
        )
    
    try:
        client = InferenceClient(model=model, token=hf_token)

        response = client.chat_completion(
            messages=[
                {"role": "system", "content": system},
                {"role": "user", "content": user_prompt},
            ],
            max_tokens=256,
            temperature=0.6,
        )

        if not response.choices:
            raise RuntimeError("No choices returned from chat_completion.")

        msg = response.choices[0].message

        if isinstance(msg, dict):
            content = msg.get("content", "")
        else:
            content = getattr(msg, "content", "")

        return (content or "").strip()

    except Exception as e:
        raise RuntimeError(
            f"Hugging Face Inference call failed for model '{model}': {e}"
        )
