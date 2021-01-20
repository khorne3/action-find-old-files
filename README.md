# Find stale docs
This action searches for outdated Markdown documents in defined locations. You can set directories and min. age of documents to search. 

## Input
* `dirs` — Search in following directories, JSON, default is `['docs']`
* `minAge` — Min. age for stale docs in days, number, default is `21`

## Output
* `files` - Path to JSON where stale fiels will be saved, default is `stale-docs.json`, see below

**Output file format**  
JSON, where `key` is a path to file and `value` is age since last commit.
```
{
  "path/to/file.md": 21,
  ...
}
```