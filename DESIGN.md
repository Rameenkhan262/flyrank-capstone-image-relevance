# AI Image Understanding & Content Matching Engine — Design

## 1. Problem

Build a backend service that understands a small library of images and matches the most relevant image to a blog post based on semantic meaning rather than filenames or exact keywords.

The system must also avoid incorrect recommendations. If the candidate image is not sufficiently relevant, has low confidence, or conflicts with the expected subject/category, the system must reject it and provide a human-readable explanation.

Example:

Post:
"The behavior of red foxes"

Correct result:
Red fox image → suggested

Incorrect result:
Gray wolf image → rejected with an explanation

---

## 2. Scope

The initial corpus will contain approximately 40–50 licensed-free images across at least four categories.

Initial categories:

- Red Fox
- Wolf
- Dog
- Bear
- Deer

The evaluation dataset will contain at least 10 labeled posts, with the correct image identified for each post.

The system will use one vision model and one embedding model.

No frontend application is required. The review workflow will be exposed through backend API endpoints.

---

## 3. Image Metadata Schema

Each processed image will have structured AI-generated metadata:

```json
{
  "subject": "red fox",
  "category": "animal",
  "attributes": [
    "orange fur",
    "wild",
    "forest"
  ],
  "caption": "A red fox standing in a forest",
  "confidence": 0.94
}

---

## 4. Matching Strategy

The matching pipeline is:

Image
→ Vision model
→ Structured metadata
→ Caption
→ Image embedding

Blog post
→ Post text
→ Post embedding

Image and post embeddings are compared using cosine similarity.

For each post:

1. Retrieve candidate images.
2. Calculate semantic similarity.
3. Rank candidates by similarity.
4. Apply the mismatch guard.
5. Return the best valid recommendation or "no confident match".

The system must support semantic equivalence. For example:

- "red fox"
- "Vulpes vulpes"
- "wild fox species"

should be treated as related concepts even when the exact words differ.

---

## 5. Mismatch Guard

The mismatch guard is the main reliability layer.

A candidate can be rejected when:

- the image classification has insufficient confidence;
- semantic similarity is below the tuned threshold;
- the detected subject conflicts with the expected subject;
- the detected category conflicts with the post's expected category.

The guard will return a reason for rejection.

Example:

REJECTED

Reason:
Animal category/subject mismatch.
Expected: red fox
Detected: gray wolf

Threshold values will not be chosen arbitrarily. They will be tuned and evaluated using the labeled evaluation dataset.

If no candidate clears the required threshold, the API returns:

"No confident match"

along with the relevant rejection reason(s).

---

## 6. Background Processing

Vision processing and embedding generation will run as background jobs rather than blocking normal API requests.

The job pipeline will support:

- batch processing;
- retries;
- failure tracking;
- progress/status tracking;
- per-call AI cost tracking.

A failed AI call will not silently create invalid image metadata.

---

## 7. Database Design

PostgreSQL will be used for persistent storage.

### Main entities

#### tenants

Stores logical application/workspace boundaries.

- id
- name
- created_at

#### images

Stores the source image record.

- id
- tenant_id
- filename
- source_url
- local_path
- status
- created_at

#### image_metadata

Stores validated vision output.

- id
- image_id
- subject
- category
- attributes
- caption
- confidence
- created_at

#### image_embeddings

Stores the image description embedding.

- id
- image_id
- embedding
- model
- created_at

#### posts

Stores blog post content.

- id
- tenant_id
- title
- content
- created_at

#### post_embeddings

Stores the post embedding.

- id
- post_id
- embedding
- model
- created_at

#### suggestions

Stores ranked image recommendations.

- id
- post_id
- image_id
- similarity_score
- guard_status
- guard_reason
- rank
- created_at

#### reviews

Stores human review decisions.

- id
- suggestion_id
- decision
- reason
- created_at

#### ai_cost_logs

Tracks every vision/embedding call.

- id
- operation
- model
- input_reference
- estimated_cost
- status
- created_at

#### jobs

Tracks background processing.

- id
- job_type
- status
- attempts
- error_message
- created_at
- completed_at

Database indexes will be added to frequently queried fields such as tenant_id, image_id, post_id, and suggestion ranking fields.

For the initial small corpus, embeddings may be stored as PostgreSQL arrays and cosine similarity can be calculated in the application layer. A vector extension can be introduced later if the dataset requires it.

---

## 8. API Surface

Initial API design:

### Images

POST   /api/images
GET    /api/images
GET    /api/images/:id
POST   /api/images/process

### Posts

POST   /api/posts
GET    /api/posts/:id
GET    /api/posts/:id/images

### Suggestions / Review

GET    /api/suggestions/:id
POST   /api/suggestions/:id/approve
POST   /api/suggestions/:id/reject

### Jobs

GET    /api/jobs/:id

All request inputs will be validated at the API boundary.

---

## 9. Idempotency

Operations that may be retried will use an idempotency mechanism so that the same logical action is not processed multiple times.

For example, submitting the same image-processing job twice with the same idempotency key should not create duplicate processing work.

---

## 10. AI and Cost Strategy

Primary AI path:

- Vision: Gemini Flash
- Embeddings: Gemini embeddings

A local Ollama-based path can be used as a fallback if required.

The application will track every AI call, including:

- model;
- operation;
- success/failure;
- estimated cost;
- timestamp.

The project will remain within the free-tier constraints.

API keys will only exist in .env and will never be committed to Git.

---

## 11. Evaluation Plan

The evaluation set will contain at least 10 labeled posts.

For each post:

Post → Correct image

The main quality metric will be top-1 precision:

top-1 precision =
correct first suggestions / total evaluated posts

The evaluation will specifically test:

1. Correct image ranking.
2. Wolf-for-fox rejection.
3. Low-confidence classification handling.
4. No-confident-match behavior.
5. Similarity threshold behavior.

---

## 12. Dataset Plan

The initial image corpus will contain approximately 40–50 licensed-free images.

Planned categories:

| Category | Approx. Images |
|---|---:|
| Red Fox | 8–10 |
| Wolf | 8–10 |
| Dog | 8–10 |
| Bear | 8–10 |
| Deer | 8–10 |
| **Total** | **40–50** |

Images will be sourced from licensed-free sources such as Unsplash or Pexels.

The corpus will remain small enough to process, inspect, and reproduce.

---

## 13. Non-Goals

This project will NOT attempt to build:

- a full image hosting platform;
- a public image search engine;
- a large-scale production image database;
- a full frontend application;
- multi-model benchmarking as part of the core implementation.

These can only be considered after all required core functionality is complete.

---

## 14. Technology Stack

| Layer | Technology |
|---|---|
| Language | Node.js |
| Backend | Express.js |
| Validation | Zod |
| Database | PostgreSQL |
| AI Vision | Gemini Flash |
| Embeddings | Gemini Embeddings |
| Local AI alternative | Ollama |
| Image sources | Unsplash / Pexels |
| API testing | Postman / curl |
| Repository | GitHub |

---

## 15. Phase 1 Success Criteria

Phase 1 is complete when:

- the architecture is documented;
- the metadata schema is defined;
- the matching strategy is defined;
- mismatch guard rules are defined;
- database entities are defined;
- API surface is defined;
- dataset scope is defined;
- evaluation approach is defined;
- the design document is committed to the repository.