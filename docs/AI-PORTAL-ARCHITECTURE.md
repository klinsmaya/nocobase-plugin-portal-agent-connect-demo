# AI Portal Platform Architecture

## Vision

Build a unified AI enterprise portal based on NocoBase as the control plane.

Core principles:

- NocoBase is the Portal, IAM broker, entitlement center and integration control plane.
- New API provides LLM gateway, model routing, quota and usage accounting.
- Multica provides agent collaboration, workspace and runtime management.
- TencentDB Agent Memory provides agent memory services.
- Wanta provides desktop agent experience.
- OpenConnector provides external SaaS actions.

## High Level Architecture

```
Enterprise IdP
     |
     v
NocoBase Portal
     |
     +-- New API Plugin
     |
     +-- Multica Plugin
     |
     +-- Agent Memory Plugin
     |
     +-- Wanta Integration Plugin
     |
     v
External AI Services
```

## Identity Model

NocoBase owns:

- users
- teams
- memberships
- application entitlement
- external identity bindings

Applications keep their own runtime identity and permissions.

## Plugin Roadmap

```
packages/
  portal-core/
  plugin-newapi/
  plugin-multica/
  plugin-agent-memory/
  plugin-wanta/
```

## Integration Rules

Never couple applications directly.

All integrations go through:

- identity mapping
- resource binding
- provisioning
- audit logging

## First Milestones

1. Portal core collections
2. OIDC identity flow
3. New API SSO and usage dashboard
4. Multica workspace provisioning
5. Agent Memory identity mapping
