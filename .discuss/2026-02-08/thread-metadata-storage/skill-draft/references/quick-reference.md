# Quick Reference

Fast query cheatsheet for `.leslie/thread_relations.json` in both Python and JavaScript.

---

## Loading Data

### Python
```python
import json
with open('.leslie/thread_relations.json', 'r') as f:
    data = json.load(f)
```

### JavaScript
```javascript
const fs = require('fs');
const data = JSON.parse(fs.readFileSync('.leslie/thread_relations.json', 'utf-8'));
```

---

## Common Queries

| Query | Python | JavaScript |
|-------|--------|------------|
| **Get dependencies** | `data['relations'][tid]['depends_on']` | `data.relations[tid].depends_on` |
| **Get parent** | `data['threads'][tid]['parent_id']` | `data.threads[tid].parent_id` |
| **Get children** | `data['relations'][tid]['children']` | `data.relations[tid].children` |
| **Get status** | `data['threads'][tid]['status']` | `data.threads[tid].status` |
| **Get tags** | `data['threads'][tid].get('tags', [])` | `data.threads[tid].tags \|\| []` |

---

## Filter Queries

### Find Frozen Threads

**Python:**
```python
frozen = [t for t in data['threads'].values() if t['status'] == 'frozen']
```

**JavaScript:**
```javascript
const frozen = Object.values(data.threads).filter(t => t.status === 'frozen');
```

### Find Threads by Tag

**Python:**
```python
tagged = [t for t in data['threads'].values() 
          if 'tags' in t and 'backend' in t['tags']]
```

**JavaScript:**
```javascript
const tagged = Object.values(data.threads)
  .filter(t => t.tags && t.tags.includes('backend'));
```

---

## Recursive Dependency Query

### Python

```python
def get_all_dependencies(thread_id, data, visited=None):
    """Recursively find all dependencies. Handles circular references."""
    if visited is None:
        visited = set()
    if thread_id in visited:
        return []
    
    visited.add(thread_id)
    direct_deps = data['relations'][thread_id]['depends_on']
    all_deps = list(direct_deps)
    
    for dep_id in direct_deps:
        if dep_id in data['relations']:
            all_deps.extend(get_all_dependencies(dep_id, data, visited))
    
    return list(set(all_deps))

# Usage
deps = get_all_dependencies('thread_abc123', data)
```

### JavaScript

```javascript
function getAllDependencies(threadId, data, visited = new Set()) {
  if (visited.has(threadId)) return [];
  
  visited.add(threadId);
  const directDeps = data.relations[threadId].depends_on;
  let allDeps = [...directDeps];
  
  directDeps.forEach(depId => {
    if (data.relations[depId]) {
      allDeps.push(...getAllDependencies(depId, data, visited));
    }
  });
  
  return [...new Set(allDeps)];
}

// Usage
const deps = getAllDependencies('thread_abc123', data);
```

---

## Error Handling

### Python (with retries)

```python
import json, time

def safe_read_relations(path, retries=3, delay=0.1):
    for attempt in range(retries):
        try:
            with open(path, 'r') as f:
                return json.load(f)
        except FileNotFoundError:
            raise Exception(f"File not found: {path}. Run 'leslie init'.")
        except json.JSONDecodeError:
            if attempt < retries - 1:
                time.sleep(delay)
            else:
                raise Exception(f"File corrupted: {path}")
    raise Exception("Failed after retries")
```

### JavaScript (basic)

```javascript
try {
  const data = JSON.parse(fs.readFileSync(path, 'utf-8'));
} catch (err) {
  if (err.code === 'ENOENT') {
    console.error('File not found. Run "leslie init".');
  } else {
    console.error('Failed to parse JSON:', err.message);
  }
}
```

---

**Note**: For complete real-world scenarios, see [patterns.md](./patterns.md).
