# Backlog - Thread Metadata Storage

> **Status**: Not in MVP Scope  
> **Last Updated**: 2026-02-09

## Deferred Features

### Storage Enhancements

| ID | Feature | Reason for Deferral | Future Priority |
|----|---------|---------------------|-----------------|
| B001 | SQLite migration | JSON is sufficient for 100 threads | P2 |
| B002 | Database indexes | Only needed with SQLite | P2 |
| B003 | Sharding by objective | Single file is sufficient | P3 |
| B004 | Storage compression | File size is small | P3 |

### Query Enhancements

| ID | Feature | Reason for Deferral | Future Priority |
|----|---------|---------------------|-----------------|
| B005 | Full-text search | Simple queries are sufficient | P2 |
| B006 | Graph visualization | CLI output is sufficient | P2 |
| B007 | Query caching | File reads are fast | P3 |
| B008 | Pagination for large result sets | 100 threads is manageable | P3 |

### Relation Enhancements

| ID | Feature | Reason for Deferral | Future Priority |
|----|---------|---------------------|-----------------|
| B009 | Automatic dependency inference | Manual marking is more reliable | P2 |
| B010 | Relation strength/weight | Binary relations are sufficient | P3 |
| B011 | Temporal relations | Current state is sufficient | P3 |

### Integration Enhancements

| ID | Feature | Reason for Deferral | Future Priority |
|----|---------|---------------------|-----------------|
| B012 | Real-time change notifications | Polling is sufficient | P2 |
| B013 | Git hooks integration | Manual workflow is sufficient | P2 |
| B014 | Export to other formats | JSON is universal | P3 |

## Rejected Ideas

| ID | Feature | Rejection Reason |
|----|---------|------------------|
| R001 | Relational database | Over-engineering for 100 threads |
| R002 | Graph database | Complexity not justified |
| R003 | Agent write access | Integrity concerns |
| R004 | Automatic transitive relations | Context explosion risk |
| R005 | Embedded operations in threads | Separation of concerns |

## Notes

- SQLite migration may be reconsidered if thread count exceeds 1000
- Graph visualization could be a separate tool/plugin
- Real-time notifications depend on future UI requirements
