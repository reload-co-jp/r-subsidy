---
name: generate-lawyer-comments
description: Use when generating practical Japanese administrative-scrivener comments for recent open subsidies in this repo and saving only missing entries to data/source/lawyer-comments.json while preserving manual edits.
---

# Generate Lawyer Comments

Generate administrative-scrivener comments for the latest 20 open subsidies and save them to `data/source/lawyer-comments.json`.

## Workflow

1. Read `data/generated/subsidies-master.json`.
2. Filter subsidies where `status !== "closed"`.
3. Sort by `startDate` or `updatedAt` descending and take the top 20.
4. For each subsidy, use `title`, `overview`, `detail`, `purposes`, `upperLimit`, `subsidizedRate`, `workflow`, and `endDate`.
5. Read `data/source/lawyer-comments.json`.
6. Skip slugs that already have comments to protect manual edits.
7. Add comments only for missing slugs and save the JSON.
8. Report the added slug list.

## Comment Rules

- Write 100-150 Japanese characters.
- Write practical advice from an administrative scrivener to an applicant.
- Choose 1-2 relevant points:
  - Required documents or certificates
  - Eligibility checks such as industry, company size, or region
  - Application office or procedure flow
  - Deadline or schedule caution
  - Practical caution about subsidy rate or upper limit
  - Post-adoption reporting or performance report duties
- Use endings such as `必要です`, `注意してください`, or `事前に確認してください`.
- Do not add a visible `行政書士コメント` label; the UI already handles the label.
- Do not modify the `_comment` key.

## Output Format

```json
{
  "_comment": "行政書士コメント。キー=slug、値=コメント本文。",
  "example-slug": "【行政書士コメント】申請には〇〇が必要です。事前に要件を確認してください。",
  "actual-slug": "生成したコメント本文"
}
```

## Guardrails

- Do not change or delete `example-slug`; it is a sample.
- Never overwrite an existing slug comment.
- Keep valid JSON formatting.
