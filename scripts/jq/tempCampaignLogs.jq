# Gather campaign logs information
[
  .[]
  | {
      campaignId: .campaign.id,
      section: map(..
                    .effects?
                    | .[]?
                    | select(
                        ((.type=="campaign_log") or (.type=="campaign_log_count") or (.type=="campaign_log_cards"))
                        and (.text or .masculine_text or .feminine_text or .nonbinary_text)
                        and (.cross_out != true)
                      )
                  )
              | group_by(.section)
              | .[]
              | { section: .[0].section, entries: map(. | { id: .id } + if has("text") then { text } else null end + if has("masculine_text") then { masculine_text } else null end + if has("feminine_text") then { feminine_text } else null end + if has("nonbinary_text") then { nonbinary_text } else null end) | unique},
      supplies: map(.. .supplies? | .[]? ) | flatten
    }
]
| group_by(.campaignId)
| map({
        campaignId: .[0].campaignId,
        sections: map(.section),
        supplies: map(.supplies) | flatten | unique
      })
