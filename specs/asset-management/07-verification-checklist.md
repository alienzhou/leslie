# Verification Checklist - Asset Management

> **Status**: Pre-Implementation  
> **Last Updated**: 2026-02-09

## Functional Verification

### Asset Storage

- [ ] `.leslie/` directory created on init
- [ ] Thread directories created correctly
- [ ] Asset files stored in correct locations
- [ ] Directory structure matches specification

### Asset Types

- [ ] plan asset works (single file)
- [ ] plan asset works (directory)
- [ ] progress asset works
- [ ] design asset works (single file)
- [ ] design asset works (directory)
- [ ] learnings asset works
- [ ] discuss asset works
- [ ] transcript asset is read-only

### Context Injection

- [ ] `<thread_context>` XML is well-formed
- [ ] thread attribute is correct
- [ ] objective attribute is correct
- [ ] relations_file attribute is correct
- [ ] `<asset>` elements list all assets
- [ ] `<ref>` elements list referenced assets
- [ ] One-level injection enforced (no transitive)

### AGENTS.md Integration

- [ ] `leslie init` creates AGENTS.md if missing
- [ ] `leslie init` appends block if missing
- [ ] `leslie init` updates block if version changed
- [ ] MAJOR version prompts user
- [ ] MINOR/PATCH versions auto-update
- [ ] Block marker attributes are correct
- [ ] Block content matches template

### Transcript Generation

- [ ] Filename follows naming convention
- [ ] Query sanitization works
- [ ] Metadata header is correct
- [ ] Message formatting is correct
- [ ] Tool calls are formatted correctly
- [ ] Truncation works
- [ ] File cleanup at 50 files works

### Cross-Thread Reference

- [ ] References injected in context
- [ ] Referenced assets are read-only
- [ ] Broken references handled gracefully
- [ ] Warning logged for broken references

## Non-Functional Verification

### Performance

- [ ] Context injection < 100ms
- [ ] Transcript generation < 500ms
- [ ] AGENTS.md update < 200ms

### Reliability

- [ ] File operations are atomic
- [ ] Partial failures don't corrupt state
- [ ] Recovery from errors works

### Usability

- [ ] Error messages are clear
- [ ] CLI help is comprehensive
- [ ] Documentation is accurate

## Sign-off

| Area | Reviewer | Date | Status |
|------|----------|------|--------|
| Asset Storage | | | |
| Context Injection | | | |
| AGENTS.md Integration | | | |
| Transcript Generation | | | |
| Cross-Thread Reference | | | |
