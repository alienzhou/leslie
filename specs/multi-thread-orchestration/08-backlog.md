# Backlog - Multi-Thread Agent Orchestration

> **Status**: Not in MVP Scope  
> **Last Updated**: 2026-02-09

## Deferred Features

### Tier 3 Primitives

| ID | Feature | Reason for Deferral | Future Priority |
|----|---------|---------------------|-----------------|
| B001 | `observe` - Event subscription | Requires pub/sub infrastructure | P2 |
| B002 | `inject` - Information injection | Can be simulated with manual workflow | P2 |
| B003 | `rollback` - State rollback | Complex undo logic, Git can be used | P2 |
| B004 | Live binding reference | Frozen binding sufficient for MVP | P2 |

### Advanced Features

| ID | Feature | Reason for Deferral | Future Priority |
|----|---------|---------------------|-----------------|
| B005 | Headless mode | Focus on interactive mode first | P2 |
| B006 | Custom Agent kernel | Use Claude Code first, validate Thread value | P3 |
| B007 | ACP Server mode | Thread is runtime instruction, not service | P3 |
| B008 | Web UI | CLI is sufficient for MVP | P2 |
| B009 | Desktop application | CLI is sufficient for MVP | P2 |

### Collaboration Enhancements

| ID | Feature | Reason for Deferral | Future Priority |
|----|---------|---------------------|-----------------|
| B010 | Semantic conflict detection | File-level detection is sufficient | P2 |
| B011 | AI-assisted merge | Manual merge is sufficient | P2 |
| B012 | Real-time progress synchronization | Terminal output is sufficient | P2 |
| B013 | External notifications (email, Slack) | Terminal output is sufficient | P3 |

### Storage Enhancements

| ID | Feature | Reason for Deferral | Future Priority |
|----|---------|---------------------|-----------------|
| B014 | SQLite as structured storage | JSON file is sufficient for 100 threads | P2 |
| B015 | Asset version control (beyond Git) | Git is sufficient | P3 |
| B016 | Cloud storage sync | Local storage is sufficient | P3 |

### Integration Enhancements

| ID | Feature | Reason for Deferral | Future Priority |
|----|---------|---------------------|-----------------|
| B017 | M5E PageTag integration | Separate project | P2 |
| B018 | Multi-Agent orchestration | Single Agent is sufficient | P3 |
| B019 | Plugin system | Core functionality first | P2 |

## Rejected Ideas

| ID | Feature | Rejection Reason |
|----|---------|------------------|
| R001 | Automatic transitive reference | Context explosion risk |
| R002 | Agent-generated transcripts | High cost, slow |
| R003 | Conversation message sharing | Share artifacts, not messages |
| R004 | Implicit dependency inference | Manual marking is more reliable |

## Notes

- Items may be reconsidered based on user feedback
- Priority may change as product evolves
- Some features may be implemented by community plugins
