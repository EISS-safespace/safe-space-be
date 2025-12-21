import { Comment } from '../models/index.js';
import { getAnonymousDisplayName } from './anonymousAvatar.js';

const MAX_DEPTH = 2;

export interface SerializedComment {
  id: string;
  content: string;
  isAnonymous: boolean;
  createdAt: Date;
  user?: {
    id?: string;
    displayName: string;
    avatarUrl?: string;
    isAnonymous?: boolean;
  };
  replies: SerializedComment[];
}

/**
 * Serialize a comment tree safely
 */
export function serializeComment(
  comment: any,
  depth = 0
): SerializedComment {
  const data = comment.toJSON ? comment.toJSON() : comment;

  // Handle soft-deleted comments
  if (data.deletedAt) {
    return {
      id: data.id,
      content: '[deleted]',
      isAnonymous: true,
      createdAt: data.createdAt,
      replies: [],
    };
  }

  // Build user object
  let user;
  if (data.isAnonymous) {
    user = {
      displayName: getAnonymousDisplayName(data.id),
      isAnonymous: true,
    };
  } else if (data.user) {
    user = {
      id: data.user.id,
      displayName: data.user.displayName,
      avatarUrl: data.user.avatarUrl,
    };
  }

  // Stop recursion if max depth reached
  let replies: SerializedComment[] = [];
  if (depth < MAX_DEPTH && Array.isArray(data.replies)) {
    replies = data.replies.map((reply: any) =>
      serializeComment(reply, depth + 1)
    );
  }

  return {
    id: data.id,
    content: data.content,
    isAnonymous: data.isAnonymous,
    createdAt: data.createdAt,
    user,
    replies,
  };
}
