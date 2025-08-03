export const formatMessageTime = (timestamp) => {
  const date = new Date(timestamp);
  const now = new Date();
  
  if (date.toDateString() === now.toDateString()) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } else if (date.getFullYear() === now.getFullYear()) {
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  } else {
    return date.toLocaleDateString([], { year: 'numeric', month: 'short', day: 'numeric' });
  }
};

export const groupMessagesByDate = (messages) => {
  const grouped = {};
  
  messages.forEach(message => {
    const date = new Date(message.createdAt).toDateString();
    if (!grouped[date]) {
      grouped[date] = [];
    }
    grouped[date].push(message);
  });

  return grouped;
};
