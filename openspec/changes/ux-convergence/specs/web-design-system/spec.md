## ADDED Requirements

### Requirement: Application shell composition

The web application SHALL render a structured application shell composed of a primary application bar, a secondary viewport toolbar, and a unified panel layout.
The primary application bar SHALL display the application title, the active space selector trigger, global actions, and the theme toggle.
Developer fixture actions SHALL be relocated to a dedicated developer tools menu or drawer, keeping the default application bar free of debug buttons.

#### Scenario: Application shell renders primary bar and navigation

- **WHEN** the application loads
- **THEN** a header element is rendered with the application title, active space selector, and theme toggle

#### Scenario: Developer fixtures are separated from production toolbar

- **WHEN** the default toolbar renders
- **THEN** starter bin fixture buttons are accessible via a dedicated developer menu rather than occupying root toolbar layout space

### Requirement: Component refinement with Storybook and screenshot recipes

Every user interface component and layout panel in `apps/web` SHALL maintain corresponding Storybook stories in `apps/web/src/ui/**/*.stories.tsx` and Playwright screenshot recipes in `apps/web/scripts/screenshot-recipes.ts`.
Any structural or visual refactoring of application chrome SHALL update or add stories covering default, active, and empty states.

#### Scenario: Component story coverage

- **WHEN** an application chrome component is updated or introduced
- **THEN** a Storybook story file covering its visual states exists in `apps/web/src/ui/`
