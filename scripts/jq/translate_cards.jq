# Extract the translateable fields from cards/*.json files
map(
  . |
  {code,flavor,name,slots,subname,text,traits,back_flavor,back_text,back_name} |
  del(.[] | select(. == null))
)
