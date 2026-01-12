# UI Patterns

This document describes the navigation patterns, header actions, and page layouts used in the Agent Kit web application.

## Header Actions Architecture

Header actions are managed via the `useHeaderActions()` hook from `HeaderActionsContext`. Actions appear in the top-right of the dashboard header.

### API

```typescript
const { setActions, setMenuItems, clearActions } = useHeaderActions();

// Set primary action buttons
setActions([
  {
    id: 'create',
    label: 'Create',
    icon: <Plus className="h-4 w-4" />,
    onClick: () => setIsCreateOpen(true),
    variant: 'primary' | 'outline' | 'ghost' | 'destructive',
  },
]);

// Set overflow menu items
setMenuItems([
  {
    id: 'delete',
    label: 'Delete',
    icon: <Trash2 className="h-4 w-4" />,
    onClick: handleDelete,
    danger: true,
  },
]);
```

### Best Practices

1. **Always clean up**: Return cleanup function from useEffect

   ```typescript
   useEffect(() => {
     setActions([...]);
     return () => clearActions();
   }, [setActions, clearActions]);
   ```

2. **Tab-aware actions**: Include active tab in dependency array

   ```typescript
   useEffect(() => {
     if (activeTab === 'documents') {
       setActions([
         /* document actions */
       ]);
     } else {
       setActions([
         /* task actions */
       ]);
     }
     return () => clearActions();
   }, [activeTab, setActions, clearActions]);
   ```

3. **Form pages**: Clear actions on mount for cleaner interface
   ```typescript
   useEffect(() => {
     clearActions();
   }, [clearActions]);
   ```

## Page Patterns

### List Pages

List pages display collections of items with optional filtering.

**Structure:**

- Header action: Single "Create" button
- Inline toolbar: Search input, optional filters
- Content: Data list or grid

**Examples:** ProjectsPage, SkillsPage, ArtifactsPage

```
┌─────────────────────────────────────────────────┐
│ Page Title                      [Create Button] │
├─────────────────────────────────────────────────┤
│ [Search input] [Filter] [Filter]                │
├─────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────────┐ │
│ │ List Item 1                                 │ │
│ ├─────────────────────────────────────────────┤ │
│ │ List Item 2                                 │ │
│ └─────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────┘
```

### Detail Pages

Detail pages show a single entity with related data.

**Structure:**

- Breadcrumb navigation
- Header actions: Context-specific (Edit, Download, etc.)
- Menu items: Edit, Delete
- Content: Entity details, tabs for related data

**Examples:** ProjectDetailPage, SkillDetailPage, ArtifactDetailPage

```
┌─────────────────────────────────────────────────┐
│ Parent > Entity Name              [Actions] [⋮] │
├─────────────────────────────────────────────────┤
│ Entity Title                                    │
│ Description text                                │
├─────────────────────────────────────────────────┤
│ [Tab 1] [Tab 2] [Tab 3]     [Filters]          │
├─────────────────────────────────────────────────┤
│ Tab content                                     │
└─────────────────────────────────────────────────┘
```

### Form Pages (Create)

Create pages have actions in the header for submission.

**Structure:**

- Header actions: Cancel (outline), Create (primary)
- Content: Form sections

**Examples:** CreateServerAgentPage, CreateExternalAgentPage

```
┌─────────────────────────────────────────────────┐
│ Create Entity              [Cancel] [Create]    │
├─────────────────────────────────────────────────┤
│ [Section Tabs]                                  │
├─────────────────────────────────────────────────┤
│ Form fields...                                  │
└─────────────────────────────────────────────────┘
```

### Form Pages (Edit)

Edit pages typically use autosave and minimal header actions.

**Structure:**

- No header actions (cleared on mount)
- Content: Inline editing with autosave

**Examples:** EditAgentPage, SkillFormPage

## Navigation Patterns

### Breadcrumbs

Used on detail pages to show hierarchy and enable navigation back.

```typescript
<nav className="mb-3 flex items-center gap-1.5">
  <Link to="/app/projects" className="text-sm text-muted-foreground hover:text-foreground">
    Projects
  </Link>
  <ChevronRight className="h-4 w-4 text-muted-foreground/50" />
  <span className="text-sm text-muted-foreground">{project.title}</span>
  <ChevronRight className="h-4 w-4 text-muted-foreground/50" />
  <span className="text-sm font-medium">{tabLabels[activeTab]}</span>
</nav>
```

### Tab Navigation

Used for multi-view pages within the same entity.

```typescript
<Tabs value={activeTab} onValueChange={handleTabChange}>
  <Tabs.List>
    <Tabs.Trigger value="board">
      <LayoutGrid className="mr-1 h-4 w-4" />
      Board
    </Tabs.Trigger>
    <Tabs.Trigger value="documents">
      <FileText className="mr-1 h-4 w-4" />
      Documents
    </Tabs.Trigger>
  </Tabs.List>
</Tabs>
```

### Context-Aware Back Navigation

When navigating from one entity to another (e.g., artifact from project), preserve context for proper back navigation.

```typescript
// Navigate with context
navigate(`/app/artifacts/${artifactId}`, {
  state: {
    fromProject: {
      id: projectId,
      returnTab: 'documents',
    },
  },
});

// Use context for breadcrumb
const location = useLocation();
const fromProject = location.state?.fromProject;

{fromProject ? (
  // Note: Project name should be fetched via query if needed,
  // or use a static label like "Back to Project"
  <Link to={`/app/projects/${fromProject.id}?tab=${fromProject.returnTab}`}>
    Back to Project
  </Link>
) : (
  <Link to="/app/artifacts">Artifacts</Link>
)}
```

## Action Placement Guidelines

| Context              | Placement                 | Examples                       |
| -------------------- | ------------------------- | ------------------------------ |
| Create new entity    | Header button             | "New Project", "Create Agent"  |
| Edit/Delete entity   | Header menu               | Edit Project, Delete Skill     |
| Tab-specific actions | Header (changes with tab) | Add Task vs Attach Document    |
| Filtering/Search     | Inline toolbar            | Search input, filter dropdowns |
| Row actions          | Inline menu               | Dropdown on list items         |
| Form submission      | Header buttons            | Cancel, Create/Save            |
| Utility actions      | Header buttons            | Copy, Download                 |

## Summary Table

| Page                  | Header Actions            | Menu Items   | Inline Toolbar  |
| --------------------- | ------------------------- | ------------ | --------------- |
| ProjectsPage          | New Project               | -            | Search          |
| ProjectDetailPage     | Add Task / Attach+Create  | Edit, Delete | Tabs, Filters   |
| ArtifactsPage         | -                         | -            | Search          |
| ArtifactDetailPage    | Copy, Download, Edit/Done | -            | -               |
| AgentsPage            | Create Agent              | -            | Search, Filters |
| SkillsPage            | New Skill                 | -            | Search, Filters |
| SkillDetailPage       | Edit (non-system)         | Delete       | -               |
| CreateServerAgentPage | Cancel, Create            | -            | Section Tabs    |
| EditAgentPage         | -                         | -            | Section Tabs    |
