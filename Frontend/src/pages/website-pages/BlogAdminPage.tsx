import React, { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { Plus, Trash2, Edit3, LogOut, Eye, Calendar, Tag, Image, FileText, X, Save, ArrowLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useBlog, BlogPost } from '@/contexts/BlogContext';

const categoryOptions = ['Education', 'Technology', 'Community', 'Teaching', 'Product Updates', 'News'];

export default function BlogAdminPage() {
  const { posts, isOwnerAuthenticated, ownerLogout, addPost, deletePost, updatePost } = useBlog();
  const navigate = useNavigate();
  const [showEditor, setShowEditor] = useState(false);
  const [editingPost, setEditingPost] = useState<BlogPost | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  // Form state
  const [title, setTitle] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('Education');
  const [coverImage, setCoverImage] = useState('');
  const [author, setAuthor] = useState('NONEAA Team');
  const [tags, setTags] = useState('');

  if (!isOwnerAuthenticated) {
    return <Navigate to="/owner/login" replace />;
  }

  const resetForm = () => {
    setTitle('');
    setExcerpt('');
    setContent('');
    setCategory('Education');
    setCoverImage('');
    setAuthor('NONEAA Team');
    setTags('');
    setEditingPost(null);
  };

  const handleCreateNew = () => {
    resetForm();
    setShowEditor(true);
  };

  const handleEdit = (post: BlogPost) => {
    setTitle(post.title);
    setExcerpt(post.excerpt);
    setContent(post.content);
    setCategory(post.category);
    setCoverImage(post.coverImage);
    setAuthor(post.author);
    setTags(post.tags.join(', '));
    setEditingPost(post);
    setShowEditor(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const postData = {
      title,
      excerpt,
      content,
      category,
      coverImage: coverImage || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&auto=format',
      author,
      tags: tags.split(',').map((t) => t.trim()).filter(Boolean),
    };

    if (editingPost) {
      updatePost(editingPost.id, postData);
    } else {
      addPost(postData);
    }

    setShowEditor(false);
    resetForm();
  };

  const handleDelete = (id: string) => {
    deletePost(id);
    setDeleteConfirm(null);
  };

  const handleLogout = () => {
    ownerLogout();
    navigate('/');
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="min-h-screen bg-gray-950">
      {/* Top Bar */}
      <div className="bg-gray-900 border-b border-gray-800 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-bold text-white">Blog Manager</h1>
            <span className="px-2 py-1 bg-green-900/30 text-green-400 text-xs font-medium rounded-full border border-green-800/30">
              Owner Access
            </span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/blog')}
              className="flex items-center gap-2 px-4 py-2 text-gray-300 hover:text-white text-sm transition"
            >
              <Eye className="w-4 h-4" />
              View Blog
            </button>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 bg-red-900/20 text-red-400 hover:bg-red-900/30 rounded-lg text-sm transition border border-red-800/30"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Editor */}
        <AnimatePresence>
          {showEditor && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="mb-8"
            >
              <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-bold text-white">
                    {editingPost ? 'Edit Post' : 'Create New Post'}
                  </h2>
                  <button
                    onClick={() => { setShowEditor(false); resetForm(); }}
                    className="p-2 text-gray-400 hover:text-white transition"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="grid md:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1.5">Title *</label>
                      <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="Enter blog post title"
                        className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1.5">Category *</label>
                      <select
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        {categoryOptions.map((cat) => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1.5">Excerpt *</label>
                    <input
                      type="text"
                      value={excerpt}
                      onChange={(e) => setExcerpt(e.target.value)}
                      placeholder="Brief description of the post"
                      className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1.5">Content *</label>
                    <textarea
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      placeholder="Write your blog post content here. Use **bold** for emphasis and separate paragraphs with blank lines."
                      rows={12}
                      className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y"
                      required
                    />
                  </div>

                  <div className="grid md:grid-cols-3 gap-5">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1.5">Cover Image URL</label>
                      <input
                        type="url"
                        value={coverImage}
                        onChange={(e) => setCoverImage(e.target.value)}
                        placeholder="https://images.unsplash.com/..."
                        className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1.5">Author</label>
                      <input
                        type="text"
                        value={author}
                        onChange={(e) => setAuthor(e.target.value)}
                        placeholder="Author name"
                        className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1.5">Tags (comma-separated)</label>
                      <input
                        type="text"
                        value={tags}
                        onChange={(e) => setTags(e.target.value)}
                        placeholder="CBC, Education, Kenya"
                        className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-3 pt-2">
                    <button
                      type="submit"
                      className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-medium rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all"
                    >
                      <Save className="w-4 h-4" />
                      {editingPost ? 'Update Post' : 'Publish Post'}
                    </button>
                    <button
                      type="button"
                      onClick={() => { setShowEditor(false); resetForm(); }}
                      className="px-6 py-2.5 text-gray-300 hover:text-white transition"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Header + Create Button */}
        {!showEditor && (
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-bold text-white">All Posts</h2>
              <p className="text-gray-400 text-sm mt-1">{posts.length} article{posts.length !== 1 ? 's' : ''} published</p>
            </div>
            <button
              onClick={handleCreateNew}
              className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-medium rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all"
            >
              <Plus className="w-4 h-4" />
              New Post
            </button>
          </div>
        )}

        {/* Posts List */}
        <div className="space-y-4">
          {posts.map((post, i) => (
            <motion.div
              key={post.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="bg-gray-900 border border-gray-800 rounded-xl p-5 flex items-center gap-5 group hover:border-gray-700 transition"
            >
              {/* Thumbnail */}
              <div className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 bg-gray-800">
                <img
                  src={post.coverImage}
                  alt={post.title}
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <h3 className="text-white font-semibold truncate">{post.title}</h3>
                <p className="text-gray-400 text-sm truncate mt-1">{post.excerpt}</p>
                <div className="flex items-center gap-4 mt-2">
                  <span className="text-xs text-gray-500 flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {formatDate(post.publishedAt)}
                  </span>
                  <span className="text-xs px-2 py-0.5 bg-blue-900/30 text-blue-400 rounded-full">
                    {post.category}
                  </span>
                  <span className="text-xs text-gray-500">{post.author}</span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition">
                <button
                  onClick={() => handleEdit(post)}
                  className="p-2 text-gray-400 hover:text-blue-400 hover:bg-blue-900/20 rounded-lg transition"
                  title="Edit"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => navigate(`/blog/${post.id}`)}
                  className="p-2 text-gray-400 hover:text-green-400 hover:bg-green-900/20 rounded-lg transition"
                  title="View"
                >
                  <Eye className="w-4 h-4" />
                </button>
                {deleteConfirm === post.id ? (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleDelete(post.id)}
                      className="px-3 py-1 bg-red-600 text-white text-xs rounded-lg hover:bg-red-700 transition"
                    >
                      Confirm
                    </button>
                    <button
                      onClick={() => setDeleteConfirm(null)}
                      className="px-3 py-1 text-gray-400 text-xs hover:text-white transition"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setDeleteConfirm(post.id)}
                    className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-900/20 rounded-lg transition"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
