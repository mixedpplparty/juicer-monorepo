# Juicer frontend

React, TypeScript, React Router, and TanStack Query, with Juicer M3 components and Emotion styles.

## Structure

- `app/` composes providers, session handling, and routes. `app/routes/` groups auth, servers, topics, and settings while preserving lazy page imports.
- `pages/` owns route composition and page-specific interactions.
- `features/` owns reusable product behavior and data.
- `shared/` contains transport, browser hooks, form adapters, validation primitives, and styles.

Server context, data boundaries, and app bars belong to the server feature. Topic-specific header actions are supplied by the topic page, so shared headers do not import sibling page implementations.

## Fetch, presenter, view

1. **Fetch** owns the query and calls its child with loaded data and a `refetch` callback. Refresh callbacks reject on failure. The same Fetch component can appear under separate Suspense boundaries, sharing cached data while giving each section an appropriate skeleton.
2. **Presenter** owns local state, form state, derived display values, event handlers, and async actions. It passes a typed model to its render-prop child. Substantial product rules live in nearby model modules as pure functions.
3. **View** renders the model and delegates events. It does not fetch data, manage cache keys, or perform API writes. Controlled leaf components can be views directly; interactions without remote reads do not need an empty Fetch wrapper.

The unsuffixed component composes these pieces. Start with `features/role-settings/components/role-settings-section.tsx` or `pages/topic-edit/topic-edit-page.tsx` for complete examples. Topic editing loads details and association options concurrently in its Fetch boundary.

Form adapters follow presenter/view separation too. Their disabled state controls the UI without disabling React Hook Form registration: pending submissions must retain the values being saved.

## Async actions and refresh ownership

API modules export ordinary functions built on `fetchJson`. Presenters use `useLoading` to track an action through its write and refresh, and handle errors where the user can act on them.

Pass the owning Fetch component's refresh callback for local updates. Server layout context exposes `refetchServer`; role category creation receives `refetchRoles`; topic creation receives its current list's `refetchTopics`; topic editing receives `refetchTopic`.

Cache-key operations remain for changes spanning unrelated views. Role membership and metadata affect profiles, settings, topic details, and search results. Topic/category changes affect other routes and filtered lists. Shared invalidation helpers make those dependencies explicit. Logout clears session data. Query errors and plain API action errors both retain expired-session handling.

## Forms and domain rules

Topic schemas live in `features/topics/model/`; role-settings schemas live in `features/role-settings/model/`. Shared validation contains reusable primitives and the category-name schema used by both category editors. API types continue to come from `juicer-shared`.

## Development

From the workspace's `src` directory, run `pnpm dev:client` for development or `pnpm build:client` for a production build. The frontend uses the existing Vite environment configuration.
