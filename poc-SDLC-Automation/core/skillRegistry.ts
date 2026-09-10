export interface Agent {
  execute(input: any, context?: any): Promise<any>;
}

export const SkillRegistry = new Map<string, any>();

export const registerAgent = (name: string, description: string, agentClass: any) => {
  SkillRegistry.set(name, { description, agentClass });
};
