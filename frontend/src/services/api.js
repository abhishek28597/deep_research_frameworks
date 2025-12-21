// Use relative URLs to go through Vite proxy (works in both dev and Docker)
// The proxy will route /api requests to the backend
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

/**
 * Create a new conversation
 */
export async function createConversation(mode = 'Council') {
  const response = await fetch(`${API_BASE_URL}/api/conversations`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ mode }), // Include mode in request
  });
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to create conversation: ${errorText}`);
  }
  return response.json();
}

/**
 * Get a specific conversation
 */
export async function getConversation(conversationId) {
  const response = await fetch(`${API_BASE_URL}/api/conversations/${conversationId}`);
  if (!response.ok) {
    if (response.status === 404) {
      return null;
    }
    throw new Error('Failed to get conversation');
  }
  return response.json();
}

/**
 * List all conversations
 */
export async function listConversations(mode = null) {
  const url = mode 
    ? `${API_BASE_URL}/api/conversations?mode=${encodeURIComponent(mode)}`
    : `${API_BASE_URL}/api/conversations`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error('Failed to list conversations');
  }
  return response.json();
}

/**
 * Delete a conversation
 */
export async function deleteConversation(conversationId) {
  const response = await fetch(`${API_BASE_URL}/api/conversations/${conversationId}`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to delete conversation: ${errorText}`);
  }
  return response.json();
}

/**
 * Export a conversation as a text file
 */
export async function exportConversation(conversationId) {
  const response = await fetch(`${API_BASE_URL}/api/conversations/${conversationId}/export`);
  if (!response.ok) {
    throw new Error('Failed to export conversation');
  }
  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `conversation_${conversationId}.txt`;
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);
}

/**
 * Send a message and stream the response using Server-Sent Events
 */
export async function sendMessageStream(conversationId, content, onEvent, userInstructions = null, executionMode = null) {
  const body = { content };
  if (userInstructions) {
    body.user_instructions = userInstructions;
  }
  if (executionMode) {
    body.execution_mode = executionMode;
  }
  
  const response = await fetch(`${API_BASE_URL}/api/conversations/${conversationId}/message/stream`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    let errorMessage = 'Failed to send message';
    try {
      const errorData = await response.json();
      errorMessage = errorData.detail || errorMessage;
    } catch (e) {
      const errorText = await response.text();
      errorMessage = errorText || errorMessage;
    }
    throw new Error(errorMessage);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      
      // Keep the last incomplete line in the buffer
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          try {
            const data = JSON.parse(line.slice(6));
            onEvent(data);
          } catch (e) {
            console.error('Failed to parse SSE data:', e, line);
          }
        }
      }
    }

    // Process any remaining data in buffer
    if (buffer.trim()) {
      const lines = buffer.split('\n');
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          try {
            const data = JSON.parse(line.slice(6));
            onEvent(data);
          } catch (e) {
            console.error('Failed to parse SSE data:', e, line);
          }
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}

