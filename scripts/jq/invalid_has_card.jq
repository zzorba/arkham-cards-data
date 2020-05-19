# Returns "has_cards" effects which have effects other than "trauma" or "story_step"
.[]
| .scenarios[]
| .steps[]
| select(.condition != null)
| .condition
| select(.type == "has_card")
| .options[]
| select(.effects != null)
| .effects[]
| select(.type != "trauma" and .type != "story_step")
