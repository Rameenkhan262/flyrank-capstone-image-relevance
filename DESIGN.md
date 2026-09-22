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