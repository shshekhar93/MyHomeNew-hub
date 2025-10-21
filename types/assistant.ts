export type AssistantCommandT = {
  devices: { id: string }[];
  execution: {
    command: string;
    params: {
      on: boolean;
    };
  }[];
};
