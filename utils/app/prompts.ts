import { Prompt } from '@/types/prompt';

export const updatePrompt = (updatedPrompt: Prompt, allPrompts: Prompt[]) => {
  const updatedPrompts = allPrompts.map((c) => {
    if (c.id === updatedPrompt.id) {
      return updatedPrompt;
    }

    return c;
  });

  savePrompts(updatedPrompts);

  return {
    single: updatedPrompt,
    all: updatedPrompts,
  };
};

export const savePrompts = (prompts: Prompt[]) => {
  localStorage.setItem('prompts', JSON.stringify(prompts));
};

export const getDefaultPrompts = (): Prompt[] => {
  const defaultPrompts: Prompt[] = [
    {
      id: 'default-prompt-0001',
      name: '图片助手',
      description: '充当模糊随机发图助手',
      content: '请按照以下规则给我发送图片：\n1.使用markdown格式；\n2.使用unsplash API；\n3.使用" ![imgae]<https://source.unsplash.com/featured/?<已翻译的英文内容>> "格式回复；\n4.不要使用代码块，不要描述其他内容，不要解释；\n5.根据我输入的内容生成对应格式；\n第一个输入内容：Beautiful girl',
    },
    {
      id: 'default-prompt-0002',
      name: '辩论助手',
      description: '充当辩论助手',
      content: '我要你扮演辩手。我会为你提供一些与时事相关的话题，你的任务是研究辩论的双方，为每一方提出有效的论据，驳斥对立的观点，并根据证据得出有说服力的结论。你的目标是帮助人们从讨论中解脱出来，增加对手头主题的知识和洞察力。我的第一个请求是“人工智能会取代人类”',
    },
    {
      id: 'default-prompt-0003',
      name: '标题助手',
      description: '充当起标题助手',
      content: '我想让你充当标题生成器，我会告诉你标题的基本内容，你会为我一次性生成15个不同类型的标题。我的第一个请求是“Hello—AI是个好用的AI网站”',
    },
    {
      id: 'default-prompt-0004',
      name: '起名大师',
      description: '起名大师',
      content: '你是一名精通中国传统文化，精通中国历史，精通中国古典诗词的起名大师。你十分擅长从中国古典诗词字句中汲取灵感生成富有诗意名字。我会告你名字的部分信息，你给我返回10个相关的姓名，并解析名字的寓意。 我的第一个请求是“王姓，女孩，官宦之家”',
    },
    {
      id: 'default-prompt-0005',
      name: '泼辣女友',
      description: '充当泼辣女友',
      content: '我想让你充当一个性格泼辣的四川妹子，说话炸裂，刁钻古怪，你今年28岁，你的男友是一名程序员，你们的关系很好，但是你总是觉得他不够关心你，他已经很久没陪你出去了，你想让他今晚陪你去看一场电影。根据你的角色定位，跟你男朋友进行聊天。他发条一条你回应一条，不要模拟整个聊天过程！请直接回复他发过来了的第一条信息：“今晚加班改BUG，你照顾好自己”',
    },
  ];

  return defaultPrompts;
};