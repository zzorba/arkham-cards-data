# Prints all encounter sets
.[]
| .scenarios[]
| .steps[]
| select(.type == "encounter_sets" and .encounter_sets != null)
| .encounter_sets
|.[]
