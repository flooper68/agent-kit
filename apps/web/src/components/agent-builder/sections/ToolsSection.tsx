import { Text } from '@agent-kit/ui';
import type { AgentFormData, ToolMetadata } from '../types';

interface ToolsSectionProps {
  formData: AgentFormData;
  onChange: (updates: Partial<AgentFormData>) => void;
  tools: ToolMetadata[];
  onBlur?: () => void;
}

const CATEGORY_ORDER = [
  'skill',
  'utility',
  'artifact',
  'project',
  'task',
  'navigation',
  'agent',
];
const CATEGORY_LABELS: Record<string, string> = {
  skill: 'Skills',
  utility: 'Utility',
  artifact: 'Artifacts',
  project: 'Projects',
  task: 'Tasks',
  navigation: 'Navigation',
  agent: 'Agent',
};

export function ToolsSection({
  formData,
  onChange,
  tools,
  onBlur,
}: ToolsSectionProps) {
  const toggleTool = (toolId: string) => {
    const newTools = formData.tools.includes(toolId)
      ? formData.tools.filter((t) => t !== toolId)
      : [...formData.tools, toolId];
    onChange({ tools: newTools });
    onBlur?.();
  };

  const selectAll = () => {
    onChange({ tools: tools.map((t) => t.id) });
    onBlur?.();
  };

  const clearAll = () => {
    onChange({ tools: [] });
    onBlur?.();
  };

  // Group tools by category
  const toolsByCategory = tools.reduce(
    (acc, tool) => {
      const category = tool.category || 'utility';
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(tool);
      return acc;
    },
    {} as Record<string, ToolMetadata[]>
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <Text className="text-sm font-medium">Available Tools</Text>
          <Text className="text-xs text-muted-foreground">
            {formData.tools.length} of {tools.length} selected
          </Text>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={selectAll}
            className="text-xs text-primary hover:underline"
          >
            Select All
          </button>
          <span className="text-muted-foreground">|</span>
          <button
            type="button"
            onClick={clearAll}
            className="text-xs text-primary hover:underline"
          >
            Clear All
          </button>
        </div>
      </div>

      <div className="space-y-6">
        {CATEGORY_ORDER.map((category) => {
          const categoryTools = toolsByCategory[category];
          if (!categoryTools || categoryTools.length === 0) return null;

          return (
            <div key={category} className="space-y-2">
              <Text className="text-sm font-medium text-muted-foreground">
                {CATEGORY_LABELS[category] || category}
              </Text>
              <div className="grid grid-cols-2 gap-2">
                {categoryTools.map((tool) => (
                  <label
                    key={tool.id}
                    className={`flex items-start gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                      formData.tools.includes(tool.id)
                        ? 'bg-primary/5 border-primary/50'
                        : 'hover:bg-muted/50'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={formData.tools.includes(tool.id)}
                      onChange={() => toggleTool(tool.id)}
                      className="h-4 w-4 rounded border-gray-300 mt-0.5"
                    />
                    <div className="flex-1 min-w-0">
                      <Text className="text-sm font-medium">{tool.name}</Text>
                      <Text className="text-xs text-muted-foreground line-clamp-2">
                        {tool.description}
                      </Text>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <div className="p-3 border rounded-lg bg-muted/30">
        <Text className="text-xs text-muted-foreground">
          <strong>Note:</strong> The &quot;Spawn Agent&quot; tool is
          automatically added if subagent spawning is enabled in the Subagents
          tab.
        </Text>
      </div>
    </div>
  );
}
