import json
import os
from collections import Counter

def analyze_feedback(feedback_path, output_path):
    if not os.path.exists(feedback_path):
        return {"insights": "No feedback yet."}

    with open(feedback_path, 'r') as f:
        feedback = json.load(f)

    up_count = sum(1 for fb in feedback if fb['rating'] == 'up')
    down_count = sum(1 for fb in feedback if fb['rating'] == 'down')

    tags = []
    for fb in feedback:
        if fb.get('tags'):
            tags.extend([t.strip().lower() for t in fb['tags'].split(',')])

    common_tags = Counter(tags).most_common(5)

    insights = {
        "summary": f"{up_count} upvotes, {down_count} downvotes.",
        "top_tags": common_tags,
        "recommendations": []
    }

    # Simple heuristic-based recommendations
    for tag, count in common_tags:
        if tag in ["fast", "too fast", "speedy"] and count >= 1:
            insights["recommendations"].append("lower_bpm")
        if tag in ["slow", "boring"] and count >= 1:
            insights["recommendations"].append("higher_bpm")
        if tag in ["static", "stiff", "robotic"] and count >= 1:
            insights["recommendations"].append("apply_swing")

    # De-duplicate
    insights["recommendations"] = list(set(insights["recommendations"]))

    with open(output_path, 'w') as f:
        json.dump(insights, f, indent=2)

    return insights

if __name__ == "__main__":
    analyze_feedback("public/feedback.json", "public/published/insights.json")
