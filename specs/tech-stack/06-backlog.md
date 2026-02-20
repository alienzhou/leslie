# Backlog - Tech Stack Implementation

> **Status**: Not in MVP Scope  
> **Last Updated**: 2026-02-09

## Deferred Features

### Storage Enhancements

| ID | Feature | Reason for Deferral | Future Priority |
|----|---------|---------------------|-----------------|
| B001 | SQLite storage | JSON is sufficient for MVP | P2 |
| B002 | Database migration system | Only needed with SQLite | P2 |
| B003 | Storage encryption | Security feature | P3 |
| B004 | Cloud sync | Local is sufficient | P3 |

### CLI Enhancements

| ID | Feature | Reason for Deferral | Future Priority |
|----|---------|---------------------|-----------------|
| B005 | `leslie logs` command | Can use standard tools | P2 |
| B006 | Interactive mode | Basic CLI is sufficient | P2 |
| B007 | Shell completion | Nice to have | P2 |
| B008 | Config file support | CLI flags are sufficient | P2 |

### Logging Enhancements

| ID | Feature | Reason for Deferral | Future Priority |
|----|---------|---------------------|-----------------|
| B009 | Log rotation | Manual cleanup is sufficient | P2 |
| B010 | Log aggregation | Per-objective is sufficient | P3 |
| B011 | Structured log viewer | Can use existing tools | P2 |
| B012 | Remote log shipping | Local is sufficient | P3 |

### Error Handling Enhancements

| ID | Feature | Reason for Deferral | Future Priority |
|----|---------|---------------------|-----------------|
| B013 | Error telemetry | Privacy concerns | P3 |
| B014 | Error suggestions | AI feature | P2 |
| B015 | Recovery wizard | Manual recovery is sufficient | P2 |

### Distribution Enhancements

| ID | Feature | Reason for Deferral | Future Priority |
|----|---------|---------------------|-----------------|
| B016 | Homebrew formula | npm is sufficient | P2 |
| B017 | Windows installer | npm is sufficient | P2 |
| B018 | Auto-update | Manual update is sufficient | P2 |
| B019 | Plugin system | Core functionality first | P2 |

## Rejected Ideas

| ID | Feature | Rejection Reason |
|----|---------|------------------|
| R001 | Custom Agent kernel | Use Claude Code first |
| R002 | ACP Server mode | Thread is runtime instruction |
| R003 | SQLite for MVP | Over-engineering |
| R004 | better-sqlite3 (sync) | JSON file is simpler |
| R005 | JSON logging | Logfmt is more readable |

## Notes

- SQLite may be reconsidered if thread count exceeds 1000
- Plugin system depends on community adoption
- Cloud sync depends on product direction
