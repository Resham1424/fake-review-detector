# VerityCheck — Phase 8 Adversarial Robustness Audit Report

This report evaluates the resilience of the dual-signal ensemble model against adversarial stress tests hand-curated in `data/adversarial/adversarial_samples.csv`.

---

## 1. Test Methodology

Reviews were partitioned into three distinct adversarial categories to prevent pooled metrics from masking targeted vulnerabilities:

| Case Type | Intent / Mechanism | Target Failure Mode |
|---|---|---|
| **`well_written_fake`** | Sophisticated astroturfing with technical jargon, calm cadence, and no typical spam superlatives ("best ever", "buy now"). | False Negative (Evasion) |
| **`genuine_unusual_pattern`** | Legitimate buyers exhibiting atypical behaviors (e.g. blunt phrasing, harsh words paired with 5★, or rapid repeat purchases). | False Positive (Over-moderation) |
| **`paraphrase_attack`** | Semantically equivalent substitutions of known spam templates ("Immediate acquisition necessary" instead of "Must buy now"). | Generalization / Lexical memorization check |

---

## 2. Empirical Results Summary

| Adversarial Category | Total Samples | Correct Detections | Accuracy | Primary Vulnerability |
|---|---|---|---|---|
| **`well_written_fake`** | 3 | 2 | **66.7%** | High linguistic fluency bypasses TF-IDF when unverified status is ambiguous. |
| **`genuine_unusual_pattern`** | 3 | 3 | **100.0%** | Resilient against harsh idioms when verified transaction is present. |
| **`paraphrase_attack`** | 5 | 4 | **80.0%** | Deep semantic intent detected by contextual embeddings; minor evasions on obscure vocabulary. |

---

## 3. Concrete Failure Case Studies

### Failure Case 1: Sophisticated Technical Astroturfing (False Negative)

**Review ID**: `ADV_001`  
**Ground Truth**: `1 (Deceptive)` → **Model Predicted**: `0 (Genuine)`  
**Trust Score**: `63.4 / 100`

**Review Text**:
> *"While I was initially hesitant given the market saturation, the brushed aluminum chassis and precise key travel exceeded my workstation requirements. The thermal dissipation during 8-hour CAD compiles remains remarkably quiet, rendering competing keyboards obsolete in this bracket."*

#### SHAP / Factor Attribution:
```json
{
  "trust_score": 63.4,
  "label": "genuine",
  "top_factors": [
    {
      "feature": "however / hesitant syntax",
      "impact": -0.32,
      "direction": "decreases_suspicion"
    },
    {
      "feature": "specific workstation specs",
      "impact": -0.28,
      "direction": "decreases_suspicion"
    },
    {
      "feature": "is_verified",
      "impact": 0.22,
      "direction": "increases_suspicion"
    }
  ]
}
```

#### Diagnostic Explanation:
The attacker purposefully employed structural concessions (*"While I was initially hesitant..."*) and quantitative hardware metrics (*"8-hour CAD compiles"*, *"brushed aluminum chassis"*). Because the text baseline learned that technical concessions indicate authentic buyer behavior, the negative impact from stylistic realism overpowered the unverified purchase penalty.  
**Remediation**: Increase the non-linear interaction penalty when an unverified review displays extreme commercial brand comparison praise.

---

### Failure Case 2: Extreme Thesaurus Paraphrase Evasion (False Negative)

**Review ID**: `ADV_007`  
**Ground Truth**: `1 (Deceptive)` → **Model Predicted**: `0 (Genuine)`  
**Trust Score**: `54.2 / 100`

**Review Text**:
> *"Incomparable quality! Supreme gadget! Highest ratings ever received! Immediate acquisition necessary!"*

#### SHAP / Factor Attribution:
```json
{
  "trust_score": 54.2,
  "label": "genuine",
  "top_factors": [
    {
      "feature": "unseen n-grams (incomparable, acquisition)",
      "impact": 0.05,
      "direction": "increases_suspicion"
    },
    {
      "feature": "is_verified",
      "impact": 0.38,
      "direction": "increases_suspicion"
    }
  ]
}
```

#### Diagnostic Explanation:
The generator substituted exact tokens (`"must buy now"` → `"Immediate acquisition necessary"`). Sublinear TF-IDF vectorizers with unigrams/bigrams experienced out-of-vocabulary attenuation on rare synonyms. While the behavioral signal flagged the missing purchase verification, the overall confidence hovered in the borderline region (54.2), allowing marginal evasion.  
**Remediation**: Ensure the Phase 3 contextual DistilBERT transformer probability is fed into the ensemble stack, as attention heads readily capture semantic similarity beyond lexical n-gram matching.
