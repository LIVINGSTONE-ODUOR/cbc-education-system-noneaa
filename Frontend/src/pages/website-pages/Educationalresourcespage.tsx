import { useState } from 'react';
import { BookOpen, FileText, Settings, Zap, TrendingUp } from 'lucide-react';

export default function EducationalResourcesPage() {
  const [activeFilter, setActiveFilter] = useState('All');

  const filters = [
    { id: 'All', label: 'All Topics', icon: BookOpen },
    { id: 'curriculum', label: 'Curriculum', icon: Settings },
    { id: 'assessment', label: 'Assessment', icon: FileText },
    { id: 'pedagogy', label: 'Pedagogy', icon: TrendingUp },
    { id: 'technology', label: 'Technology', icon: Zap },
  ];

  const articlesData = [
    {
      id: 1,
      title: 'CBE vs Traditional Education: A Parent\'s Guide',
      description: 'Understand the CBC framework and how it helps ease your child\'s educational anxiety while building stronger foundational skills.',
      category: 'curriculum',
      color: 'from-blue-500 to-indigo-600',
      date: 'Mar 15, 2024',
    },
    {
      id: 2,
      title: 'Mastering Student Self-Regulation in CBC',
      description: 'Learn how to guide students toward independent learning and self-regulation without constant instruction and monitoring.',
      category: 'pedagogy',
      color: 'from-emerald-500 to-teal-600',
      date: 'Mar 12, 2024',
    },
    {
      id: 3,
      title: 'CBE Math Practices: Maximizing Teaching Time',
      description: 'Explore evidence-based teaching strategies that work with CBC frameworks to create more effective learning outcomes.',
      category: 'pedagogy',
      color: 'from-amber-500 to-orange-600',
      date: 'Mar 10, 2024',
    },
    {
      id: 4,
      title: 'Building a Learning-Focused School Culture',
      description: 'Create an environment where students thrive through collaborative learning and evidence-based instructional practices.',
      category: 'technology',
      color: 'from-purple-500 to-violet-600',
      date: 'Mar 08, 2024',
    },
    {
      id: 5,
      title: 'Your Guide to CBE Assessment and Evaluation',
      description: 'Master the assessment tools and strategies that align with CBE principles for meaningful student evaluation.',
      category: 'assessment',
      color: 'from-rose-500 to-pink-600',
      date: 'Mar 05, 2024',
    },
    {
      id: 6,
      title: 'Digital Tools for the Modern CBC Classroom',
      description: 'Discover the latest technology solutions that enhance teaching and learning within the competency-based curriculum framework.',
      category: 'technology',
      color: 'from-cyan-500 to-blue-600',
      date: 'Mar 01, 2024',
    },
  ];

  const filteredArticles = activeFilter === 'All'
    ? articlesData
    : articlesData.filter(article => article.category === activeFilter);

  return (
    <section className="py-16 md:py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12">
        {/* Section Header */}
        <div className="text-center mb-12">
          <span className="inline-block text-sm font-semibold text-blue-600 uppercase tracking-wider mb-2">
            Resources
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-3">
            Educational Insights & Guides
          </h2>
          <p className="text-slate-600 max-w-xl mx-auto text-sm md:text-base">
            Stay informed with the latest articles on competency-based education, teaching strategies, and technology in the classroom.
          </p>
        </div>

        {/* Filter Tabs */}
        <div className="flex flex-wrap justify-center gap-2 mb-10">
          {filters.map((filter) => {
            const Icon = filter.icon;
            return (
              <button
                key={filter.id}
                onClick={() => setActiveFilter(filter.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  activeFilter === filter.id
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="hidden sm:inline">{filter.label}</span>
              </button>
            );
          })}
        </div>

        {/* Articles Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredArticles.map((article) => (
            <article
              key={article.id}
              className="group rounded-xl border border-slate-200 overflow-hidden hover:shadow-lg transition-shadow"
            >
              {/* Image placeholder with gradient */}
              <div className={`h-44 bg-gradient-to-br ${article.color} flex items-center justify-center`}>
                <BookOpen className="w-12 h-12 text-white/40" />
              </div>

              <div className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-semibold text-blue-600 uppercase tracking-wider">
                    {filters.find(f => f.id === article.category)?.label || article.category}
                  </span>
                  <span className="text-xs text-slate-400">{article.date}</span>
                </div>
                <h3 className="font-semibold text-slate-900 text-sm leading-snug mb-2 group-hover:text-blue-600 transition-colors">
                  {article.title}
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed line-clamp-2">
                  {article.description}
                </p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
