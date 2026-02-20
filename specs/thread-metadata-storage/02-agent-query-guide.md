# Agent Query Guide

> **Status**: ✅ Confirmed  
> **Last Updated**: 2026-02-09

## 1. Overview

This document provides guidance for Agents on how to query the thread relations file.

**Important**: This file is read-only for Agents. All modifications are done by Leslie CLI.

## 2. File Location

| Property | Value |
|----------|-------|
| Path | `.leslie/thread_relations.json` |
| Discovery | Via `<thread_context relations_file="...">` attribute |
| Format | UTF-8 encoded JSON |

## 3. When to Query

| Scenario | Purpose |
|----------|---------|
| **Context recovery** | After compression, find dependent thread contexts to re-inject |
| **Dependency analysis** | Understand thread relationships before decisions |
| **Asset provenance** | Trace asset origins across threads |
| **Status check** | Find active/frozen/archived threads |

## 4. Query Patterns

### 4.1 Load and Parse

- Read the JSON file using standard file operations
- Parse as JSON object
- Access data via dictionary/object keys

### 4.2 Find Thread by ID

**Input**: Thread ID string

**Approach**: Look up `data.threads[thread_id]`

**Output**: Thread info object or null if not found

### 4.3 Find All Active Threads

**Input**: None

**Approach**: Filter `data.threads` where `status == "active"`

**Output**: List of thread info objects

### 4.4 Find Child Threads

**Input**: Parent thread ID

**Approach**: 
1. Look up `data.relations[thread_id].children`
2. Map each child ID to its thread info

**Output**: List of child thread info objects

### 4.5 Find Referenced Threads

**Input**: Thread ID

**Approach**:
1. Look up `data.relations[thread_id].references_to`
2. Map each reference ID to its thread info

**Output**: List of referenced thread info objects

### 4.6 Find Threads by Tag

**Input**: Tag string

**Approach**: Filter `data.threads` where `tags` contains the target tag

**Output**: List of matching thread info objects

### 4.7 Get Full Dependency Chain

**Input**: Starting thread ID

**Approach**:
1. Get direct references from `relations[id].references_to` and `relations[id].depends_on`
2. Recursively traverse each dependency
3. Track visited IDs to avoid cycles
4. Collect all dependency thread infos

**Output**: Flattened list of all dependent thread info objects

### 4.8 Get Recent Operations

**Input**: Limit number

**Approach**:
1. Sort `data.operations` by `timestamp` descending
2. Take first N items

**Output**: List of recent operation objects

## 5. Common Use Cases

### 5.1 Context Recovery After Compression

**Goal**: Find threads whose context should be re-injected

**Steps**:
1. Get current thread's `references_to` list
2. Filter to threads with `status` in (`active`, `frozen`)
3. Return filtered thread list

### 5.2 Find Root Threads

**Goal**: Get threads without parents (top-level threads)

**Steps**: Filter `data.threads` where `parent_id` is null

### 5.3 Build Thread Tree

**Goal**: Construct hierarchical thread structure

**Steps**:
1. Start with root threads (parent_id is null)
2. For each thread, recursively add children from `relations[id].children`
3. Build nested structure

## 6. Important Constraints

| Rule | Description |
|------|-------------|
| **Read-only** | Agent must NOT modify this file directly |
| **Use CLI** | All modifications via Leslie CLI commands |
| **File locks** | CLI uses locks; reads during writes may see partial data |
| **Validation** | Assume data is valid (CLI validates on write) |

## 7. Error Handling

| Situation | Recommended Action |
|-----------|-------------------|
| File not found | Thread relations not initialized; inform user |
| Parse error | File may be corrupted; inform user |
| Missing thread ID | Thread may have been deleted; handle gracefully |
| Missing relation entry | Return empty arrays for missing relations |

## 8. Related Documents

- [JSON Schema](./01-json-schema.md)
- [Overview](./00-overview.md)
