# Extract the translateable fields from cards/*.json files
map(
  . |
  {code,flavor,name,slots,subname,text,traits} |
  del(.[] | select(. == null))
)
