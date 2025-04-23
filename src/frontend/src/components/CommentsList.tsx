import React, { useState, useEffect } from 'react';
import { useAppSelector, useAppDispatch } from '../store/hooks';
import { 
  fetchComments, 
  createComment, 
  updateComment, 
  deleteComment 
} from '../store/commentSlice';
import { formatDistanceToNow } from 'date-fns';

interface CommentsListProps {
  taskId: string;
}

const CommentsList: React.FC<CommentsListProps> = ({ taskId }) => {
  const dispatch = useAppDispatch();
  const { comments, isLoading } = useAppSelector((state) => state.comments);
  const { user } = useAppSelector((state) => state.auth);
  const [newComment, setNewComment] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');

  // Fetch comments when component mounts or taskId changes
  useEffect(() => {
    if (taskId) {
      dispatch(fetchComments(taskId));
    }
  }, [dispatch, taskId]);

  // Handle form submission for new comment
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    try {
      await dispatch(createComment({ taskId, content: newComment.trim() })).unwrap();
      setNewComment('');
    } catch (error) {
      console.error('Failed to add comment:', error);
    }
  };

  // Start editing a comment
  const handleEdit = (comment: any) => {
    setEditingId(comment._id);
    setEditContent(comment.content);
  };

  // Cancel editing
  const handleCancelEdit = () => {
    setEditingId(null);
    setEditContent('');
  };

  // Submit comment update
  const handleUpdate = async (commentId: string) => {
    if (!editContent.trim()) return;

    try {
      await dispatch(updateComment({ commentId, content: editContent.trim() })).unwrap();
      setEditingId(null);
      setEditContent('');
    } catch (error) {
      console.error('Failed to update comment:', error);
    }
  };

  // Delete a comment
  const handleDelete = async (commentId: string) => {
    if (window.confirm('Are you sure you want to delete this comment?')) {
      try {
        await dispatch(deleteComment(commentId)).unwrap();
      } catch (error) {
        console.error('Failed to delete comment:', error);
      }
    }
  };

  if (isLoading && comments.length === 0) {
    return (
      <div className="p-4 text-center">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-5/6 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-4/6"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white shadow sm:rounded-lg p-6 mt-8">
      <h2 className="text-lg font-medium text-gray-900 mb-6">Comments</h2>

      {/* New comment form */}
      <form onSubmit={handleSubmit} className="mb-8">
        <div>
          <label htmlFor="new-comment" className="sr-only">
            Add a comment
          </label>
          <textarea
            id="new-comment"
            rows={3}
            className="shadow-sm block w-full sm:text-sm border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
            placeholder="Add a comment..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
          ></textarea>
        </div>
        <div className="mt-3 flex justify-end">
          <button
            type="submit"
            disabled={!newComment.trim()}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Add Comment
          </button>
        </div>
      </form>

      {/* Comments list */}
      <div className="space-y-6">
        {comments.length === 0 ? (
          <p className="text-center text-gray-500">No comments yet. Be the first to comment!</p>
        ) : (
          comments.map((comment) => (
            <div key={comment._id} className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-start justify-between">
                <div className="flex items-center">
                  <div className="font-medium text-gray-900">{comment.user.name}</div>
                  <span className="ml-2 text-sm text-gray-500">
                    {comment.createdAt && formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                  </span>
                </div>
                
                {user?.id === comment.user._id && (
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleEdit(comment)}
                      className="text-sm text-gray-600 hover:text-gray-900"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(comment._id)}
                      className="text-sm text-red-600 hover:text-red-900"
                    >
                      Delete
                    </button>
                  </div>
                )}
              </div>

              {editingId === comment._id ? (
                <div className="mt-3">
                  <textarea
                    rows={3}
                    className="shadow-sm block w-full sm:text-sm border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                  ></textarea>
                  <div className="mt-2 flex justify-end space-x-2">
                    <button
                      onClick={handleCancelEdit}
                      className="inline-flex items-center px-3 py-1 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => handleUpdate(comment._id)}
                      className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                    >
                      Save
                    </button>
                  </div>
                </div>
              ) : (
                <div className="mt-2 text-sm text-gray-700">{comment.content}</div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default CommentsList; 