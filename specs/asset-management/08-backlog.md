# Backlog - Asset Management

> **Status**: Not in MVP Scope  
> **Last Updated**: 2026-02-09

## Deferred Features

### Asset Version Control

| ID | Feature | Reason for Deferral | Future Priority |
|----|---------|---------------------|-----------------|
| B001 | Asset version tracking | Git is sufficient | P2 |
| B002 | Asset diff view | Can use Git diff | P2 |
| B003 | Asset rollback | Can use Git checkout | P2 |
| B004 | M5E PageTag integration | Separate project | P2 |

### Context Injection Enhancements

| ID | Feature | Reason for Deferral | Future Priority |
|----|---------|---------------------|-----------------|
| B005 | Compression protection via ACP | ACP RFD needed | P1 |
| B006 | Token usage monitoring | ACP RFD needed | P1 |
| B007 | Smart context summarization | Complex implementation | P2 |
| B008 | Transitive reference injection | Context explosion risk | P3 |

### AGENTS.md Enhancements

| ID | Feature | Reason for Deferral | Future Priority |
|----|---------|---------------------|-----------------|
| B009 | Block content customization | Core content first | P2 |
| B010 | Multi-language support | English only for MVP | P3 |
| B011 | Block validation command | Nice to have | P2 |

### Transcript Enhancements

| ID | Feature | Reason for Deferral | Future Priority |
|----|---------|---------------------|-----------------|
| B012 | JSON transcript format | Plain text is sufficient | P3 |
| B013 | Transcript search command | Can use grep | P2 |
| B014 | Transcript summary generation | AI feature | P2 |
| B015 | Transcript export (PDF, HTML) | Nice to have | P3 |

### Storage Enhancements

| ID | Feature | Reason for Deferral | Future Priority |
|----|---------|---------------------|-----------------|
| B016 | Cloud storage sync | Local is sufficient | P3 |
| B017 | Asset encryption | Security feature | P3 |
| B018 | Asset compression | Storage optimization | P3 |

## Rejected Ideas

| ID | Feature | Rejection Reason |
|----|---------|------------------|
| R001 | Agent-generated transcripts | High cost, slow |
| R002 | Conversation message sharing | Share artifacts, not messages |
| R003 | Live binding references | Frozen is simpler, safer |
| R004 | Automatic transitive references | Context explosion risk |
| R005 | User edit protection for AGENTS.md block | Complexity not worth it |

## Notes

- Asset version control may be reconsidered if Git proves insufficient
- Compression protection depends on ACP protocol evolution
- Transcript enhancements can be community plugins
