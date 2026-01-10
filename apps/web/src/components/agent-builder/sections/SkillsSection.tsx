import { Text } from '@agent-kit/ui';
import type { AgentFormData } from '../types';
import { trpc } from '../../../lib/trpc';

interface SkillsSectionProps {
  formData: AgentFormData;
  onChange: (updates: Partial<AgentFormData>) => void;
  onBlur?: () => void;
}

export function SkillsSection({
  formData,
  onChange,
  onBlur,
}: SkillsSectionProps) {
  const skillsQuery = trpc.agents.listSkillsForAgent.useQuery();

  const toggleSkill = (skillId: string) => {
    const newSkillIds = formData.allowedSkillIds.includes(skillId)
      ? formData.allowedSkillIds.filter((id) => id !== skillId)
      : [...formData.allowedSkillIds, skillId];
    onChange({ allowedSkillIds: newSkillIds });
    onBlur?.();
  };

  const selectAll = () => {
    if (skillsQuery.data) {
      onChange({ allowedSkillIds: skillsQuery.data.map((s) => s.id) });
      onBlur?.();
    }
  };

  const clearAll = () => {
    onChange({ allowedSkillIds: [] });
    onBlur?.();
  };

  const skills = skillsQuery.data ?? [];

  // Group skills by system/custom
  const systemSkills = skills.filter((s) => s.isSystem);
  const customSkills = skills.filter((s) => !s.isSystem);

  if (skillsQuery.isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Text className="text-muted-foreground">Loading skills...</Text>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <Text className="text-sm font-medium">Allowed Skills</Text>
          <Text className="text-xs text-muted-foreground">
            {formData.allowedSkillIds.length} of {skills.length} selected
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
        {/* System Skills */}
        {systemSkills.length > 0 && (
          <div className="space-y-2">
            <Text className="text-sm font-medium text-muted-foreground">
              System Skills
            </Text>
            <div className="grid grid-cols-2 gap-2">
              {systemSkills.map((skill) => (
                <label
                  key={skill.id}
                  className={`flex items-start gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                    formData.allowedSkillIds.includes(skill.id)
                      ? 'bg-primary/5 border-primary/50'
                      : 'hover:bg-muted/50'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={formData.allowedSkillIds.includes(skill.id)}
                    onChange={() => toggleSkill(skill.id)}
                    className="h-4 w-4 rounded border-gray-300 mt-0.5"
                  />
                  <div className="flex-1 min-w-0">
                    <Text className="text-sm font-medium">{skill.name}</Text>
                    <Text className="text-xs text-muted-foreground line-clamp-2">
                      {skill.description}
                    </Text>
                  </div>
                </label>
              ))}
            </div>
          </div>
        )}

        {/* Custom Skills */}
        {customSkills.length > 0 && (
          <div className="space-y-2">
            <Text className="text-sm font-medium text-muted-foreground">
              Custom Skills
            </Text>
            <div className="grid grid-cols-2 gap-2">
              {customSkills.map((skill) => (
                <label
                  key={skill.id}
                  className={`flex items-start gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                    formData.allowedSkillIds.includes(skill.id)
                      ? 'bg-primary/5 border-primary/50'
                      : 'hover:bg-muted/50'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={formData.allowedSkillIds.includes(skill.id)}
                    onChange={() => toggleSkill(skill.id)}
                    className="h-4 w-4 rounded border-gray-300 mt-0.5"
                  />
                  <div className="flex-1 min-w-0">
                    <Text className="text-sm font-medium">{skill.name}</Text>
                    <Text className="text-xs text-muted-foreground line-clamp-2">
                      {skill.description}
                    </Text>
                  </div>
                </label>
              ))}
            </div>
          </div>
        )}

        {skills.length === 0 && (
          <div className="p-4 border rounded-lg bg-muted/30 text-center">
            <Text className="text-sm text-muted-foreground">
              No skills available.
            </Text>
          </div>
        )}
      </div>

      <div className="p-3 border rounded-lg bg-muted/30">
        <Text className="text-xs text-muted-foreground">
          <strong>Note:</strong> Skills provide documentation that agents can
          read to learn how to perform tasks. Select which skills this agent
          should have access to. If none are selected, the agent cannot use any
          skill tools.
        </Text>
      </div>
    </div>
  );
}
