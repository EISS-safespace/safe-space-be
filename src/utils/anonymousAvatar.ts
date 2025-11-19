const animals = [
  'panda', 'koala', 'fox', 'owl', 'rabbit', 'deer', 'penguin', 'dolphin',
  'otter', 'hedgehog', 'squirrel', 'butterfly', 'turtle', 'seal', 'cat',
];

const colors = [
  'blue', 'purple', 'green', 'orange', 'pink', 'teal', 'coral', 'lavender',
];

export const generateAnonymousAvatar = (postId: string): { animal: string; color: string } => {
  // Use postId to generate consistent but random-looking avatar for each post
  const hash = postId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  
  const animal = animals[hash % animals.length];
  const color = colors[(hash * 7) % colors.length];
  
  return { animal, color };
};

export const getAnonymousDisplayName = (postId: string): string => {
  const { animal, color } = generateAnonymousAvatar(postId);
  return `${color} ${animal}`;
};

