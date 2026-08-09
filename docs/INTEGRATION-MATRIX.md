# Integration Matrix

| Component | Source of truth | Integration |
|---|---|---|
| Identity | NocoBase / upstream OIDC | OAuth2/OIDC |
| Teams | NocoBase | Provisioning API |
| LLM models | New API | REST + OIDC |
| Agent workspace | Multica | REST + SSO adapter |
| Memory | TencentDB Agent Memory | Server API |
| Desktop agent | Wanta | Deep link + gateway |

## Security Rules

- Browser never receives service credentials.
- Plugins store secrets server-side.
- External systems are accessed through adapters.
- Every provisioning action is audited.
