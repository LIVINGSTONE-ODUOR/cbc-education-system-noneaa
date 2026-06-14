import React from 'react';
import { useParams, Link, Navigate } from 'react-router-dom';
import { ArrowLeft, Calendar, Clock, Tag, User, Share2 } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { motion } from 'framer-motion';
import { useBlog } from '@/contexts/BlogContext';

export default function BlogPostPage() {
  const { id } = useParams<{ id: string }>();
  const { posts } = useBlog();
  const post = posts.find((p) => p.id === id);

  if (!post) {
    return <Navigate to="/blog" replace />;
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getReadTime = (content: string) => {
    const words = content.split(/\s+/).length;
    return Math.max(1, Math.ceil(words / 200));
  };

  const relatedPosts = posts.filter((p) => p.id !== post.id && p.category === post.category).slice(0, 3);

  return (
    <div className="min-h-screen bg-white">
      <Header />

      {/* Hero */}
      <section className="relative pt-24 pb-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link
            to="/blog"
            className="inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 mb-8 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Blog
          </Link>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="flex items-center gap-3 mb-4">
              <span className="px-3 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
                {post.category}
              </span>
              <span className="text-sm text-gray-500 flex items-center gap-1">
                <Clock className="w-4 h-4" />
                {getReadTime(post.content)} min read
              </span>
            </div>

            <h1 className="text-3xl md:text-5xl font-bold text-gray-900 mb-6 leading-tight">
              {post.title}
            </h1>

            <div className="flex items-center gap-4 mb-8">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center">
                  <User className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">{post.author}</p>
                  <p className="text-xs text-gray-500">{formatDate(post.publishedAt)}</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Cover Image */}
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.2 }}
        className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 mb-12"
      >
        <div className="rounded-2xl overflow-hidden shadow-xl">
          <img
            src={post.coverImage}
            alt={post.title}
            className="w-full h-[300px] md:h-[450px] object-cover"
          />
        </div>
      </motion.div>

      {/* Content */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="prose prose-lg max-w-none prose-headings:text-gray-900 prose-p:text-gray-600 prose-strong:text-gray-900 prose-a:text-blue-600"
        >
          {post.content.split('\n\n').map((paragraph, i) => {
            if (paragraph.startsWith('**') && paragraph.endsWith('**')) {
              return (
                <h3 key={i} className="text-xl font-bold text-gray-900 mt-8 mb-4">
                  {paragraph.replace(/\*\*/g, '')}
                </h3>
              );
            }
            if (paragraph.startsWith('*') && !paragraph.startsWith('**')) {
              return (
                <p key={i} className="text-gray-600 italic mb-4">
                  {paragraph.replace(/\*/g, '')}
                </p>
              );
            }
            if (paragraph.startsWith('- ') || paragraph.startsWith('1. ')) {
              const items = paragraph.split('\n').filter(Boolean);
              return (
                <ul key={i} className="list-disc list-inside space-y-2 mb-6">
                  {items.map((item, j) => (
                    <li key={j} className="text-gray-600">
                      {item.replace(/^[-\d.]\s*/, '')}
                    </li>
                  ))}
                </ul>
              );
            }
            return (
              <p key={i} className="text-gray-600 leading-relaxed mb-4">
                {paragraph.split('**').map((part, j) =>
                  j % 2 === 1 ? (
                    <strong key={j} className="text-gray-900">{part}</strong>
                  ) : (
                    <span key={j}>{part}</span>
                  )
                )}
              </p>
            );
          })}
        </motion.div>

        {/* Tags */}
        <div className="flex flex-wrap items-center gap-2 mt-12 pt-8 border-t border-gray-200">
          <Tag className="w-4 h-4 text-gray-400" />
          {post.tags.map((tag) => (
            <span key={tag} className="px-3 py-1 bg-gray-100 text-gray-600 text-xs font-medium rounded-full">
              {tag}
            </span>
          ))}
        </div>
      </section>

      {/* Related Posts */}
      {relatedPosts.length > 0 && (
        <section className="py-16 bg-[#e8edf5]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-8">Related Articles</h2>
            <div className="grid md:grid-cols-3 gap-6">
              {relatedPosts.map((related) => (
                <Link key={related.id} to={`/blog/${related.id}`} className="group">
                  <div className="bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-lg transition-shadow">
                    <div className="aspect-video overflow-hidden">
                      <img
                        src={related.coverImage}
                        alt={related.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    </div>
                    <div className="p-5">
                      <span className="text-xs text-blue-600 font-medium">{related.category}</span>
                      <h3 className="text-lg font-bold text-gray-900 mt-2 group-hover:text-blue-600 transition-colors line-clamp-2">
                        {related.title}
                      </h3>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      <Footer />
    </div>
  );
}
