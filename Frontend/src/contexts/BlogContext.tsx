import React, { createContext, useContext, useState, useEffect } from 'react';

export interface BlogPost {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  author: string;
  category: string;
  coverImage: string;
  publishedAt: string;
  tags: string[];
}

interface BlogContextType {
  posts: BlogPost[];
  isOwnerAuthenticated: boolean;
  ownerLogin: (password: string) => boolean;
  ownerLogout: () => void;
  addPost: (post: Omit<BlogPost, 'id' | 'publishedAt'>) => void;
  deletePost: (id: string) => void;
  updatePost: (id: string, post: Partial<BlogPost>) => void;
}

const BlogContext = createContext<BlogContextType | undefined>(undefined);

const OWNER_PASSWORD = 'noneaa-owner-2024';
const STORAGE_KEY = 'noneaa_blog_posts';
const AUTH_KEY = 'noneaa_owner_auth';

const defaultPosts: BlogPost[] = [
  {
    id: '1',
    title: 'How CBC is Transforming Education in Kenya',
    excerpt: 'The Competency-Based Curriculum is reshaping how students learn, focusing on skills over memorization.',
    content: `The Competency-Based Curriculum (CBC) represents a fundamental shift in Kenya's education system. Unlike the traditional 8-4-4 system that emphasized rote memorization and exam performance, CBC focuses on developing practical competencies and skills that students can apply in real-world situations.\n\nKey aspects of this transformation include:\n\n**Learner-Centered Approach**: CBC places the student at the center of learning. Teachers act as facilitators rather than lecturers, guiding students through discovery and experiential learning.\n\n**Competency Assessment**: Instead of a single high-stakes exam, students are assessed continuously through formative and summative assessments that measure their competency levels across different strands.\n\n**Holistic Development**: The curriculum addresses not just academic knowledge but also values, life skills, and psychomotor development, preparing students for the 21st-century workforce.\n\n**Parental Involvement**: CBC encourages active participation from parents in their children's education, with regular progress reports and portfolio reviews.\n\nAt NONEAA, we've built our platform specifically to support schools implementing CBC, providing digital tools that make competency tracking, assessment, and reporting seamless and efficient.`,
    author: 'NONEAA Team',
    category: 'Education',
    coverImage: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=800&auto=format',
    publishedAt: '2024-12-15T10:00:00Z',
    tags: ['CBC', 'Education', 'Kenya', 'Curriculum'],
  },
  {
    id: '2',
    title: 'Digital Tools Every Modern School Needs in 2025',
    excerpt: 'From student management to automated reporting, discover the essential tech stack for forward-thinking schools.',
    content: `As we move deeper into the digital age, schools that embrace technology are seeing remarkable improvements in efficiency, communication, and student outcomes. Here are the essential digital tools every modern school should consider:\n\n**1. Student Information System (SIS)**\nA centralized database for managing student records, enrollment, attendance, and academic history. NONEAA provides this with CBC-specific competency tracking built in.\n\n**2. Learning Management System (LMS)**\nPlatforms that facilitate online and blended learning, assignment distribution, and resource sharing between teachers and students.\n\n**3. Assessment & Reporting Tools**\nAutomated systems that generate CBC-compliant reports, track competency levels, and provide data-driven insights into student performance.\n\n**4. Parent Communication Portal**\nReal-time communication channels that keep parents informed about their children's progress, upcoming events, and school announcements.\n\n**5. Financial Management**\nFee tracking, invoice generation, and payment processing systems that reduce administrative burden and improve cash flow visibility.\n\n**6. Attendance Tracking**\nDigital attendance systems that provide real-time data and alerts for absent students, helping schools maintain accountability.\n\nInvesting in these tools isn't just about keeping up with trends—it's about creating an environment where educators can focus on what matters most: teaching.`,
    author: 'NONEAA Team',
    category: 'Technology',
    coverImage: 'https://images.unsplash.com/photo-1509062522246-3755977927d7?w=800&auto=format',
    publishedAt: '2025-01-20T14:30:00Z',
    tags: ['Technology', 'EdTech', 'School Management', 'Digital'],
  },
  {
    id: '3',
    title: 'Building Parent-School Partnerships That Work',
    excerpt: 'Strong parent engagement leads to better student outcomes. Here\'s how technology bridges the gap.',
    content: `Research consistently shows that parent involvement in education is one of the strongest predictors of student success. Yet, many schools struggle to maintain meaningful communication with parents beyond the occasional parents' meeting.\n\n**The Communication Gap**\nTraditional methods—physical report cards, notice boards, and scheduled meetings—create information delays and miss the opportunity for timely interventions. Parents often learn about issues only when they've become serious problems.\n\n**How Technology Bridges the Gap**\n\n*Real-Time Progress Updates*: With platforms like NONEAA, parents can log in anytime to see their child's current competency levels, attendance records, and teacher feedback.\n\n*Instant Notifications*: Automated alerts for missed classes, upcoming assessments, or notable achievements keep parents in the loop without requiring manual effort from teachers.\n\n*Two-Way Communication*: Built-in messaging allows parents to reach teachers directly, ask questions, and schedule meetings—all within a secure platform.\n\n*Progress Portfolios*: Digital portfolios showcase student work over time, giving parents a comprehensive view of their child's growth beyond just grades.\n\n**Best Practices for Schools**\n\n1. Set clear expectations about communication frequency\n2. Provide multiple channels (app, SMS, email) to accommodate all parents\n3. Share positive updates, not just concerns\n4. Make data accessible and easy to understand\n5. Offer guidance on how parents can support learning at home\n\nWhen parents feel connected to their child's educational journey, everyone wins.`,
    author: 'NONEAA Team',
    category: 'Community',
    coverImage: 'https://images.unsplash.com/photo-1577896851231-70ef18881754?w=800&auto=format',
    publishedAt: '2025-02-10T09:00:00Z',
    tags: ['Parents', 'Communication', 'Student Success', 'Community'],
  },
  {
    id: '4',
    title: 'Understanding Competency-Based Assessment: A Teacher\'s Guide',
    excerpt: 'Move beyond traditional grading with practical strategies for competency-based assessment in your classroom.',
    content: `Competency-Based Assessment (CBA) is at the heart of Kenya's CBC framework. For many teachers transitioning from the 8-4-4 system, this represents a significant shift in how they evaluate student learning.\n\n**What Makes CBA Different?**\n\nUnlike traditional assessments that focus on what students know (recall), CBA measures what students can do (application). It's not about scoring 80% on a test—it's about demonstrating mastery of specific competencies.\n\n**The Four Assessment Levels**\n\n- *Exceeding Expectations (EE)*: Student demonstrates exceptional understanding and can apply competencies in novel situations\n- *Meeting Expectations (ME)*: Student consistently demonstrates the required competencies\n- *Approaching Expectations (AE)*: Student is developing competencies but needs more support\n- *Below Expectations (BE)*: Student requires significant intervention\n\n**Practical Strategies**\n\n1. **Use Rubrics**: Create clear rubrics for each competency that describe what each level looks like in practice\n2. **Diversify Evidence**: Don't rely on tests alone—use projects, presentations, observations, and portfolios\n3. **Assess Continuously**: Regular formative assessments give better data than one-off summative tests\n4. **Provide Feedback**: Focus on growth-oriented feedback that tells students what to improve, not just what's wrong\n5. **Document Everything**: Use digital tools like NONEAA to track evidence and generate reports efficiently\n\n**Common Pitfalls to Avoid**\n\n- Converting competency levels to percentages (they're not the same thing)\n- Assessing only cognitive skills while ignoring values and attitudes\n- Over-testing students instead of using authentic assessment opportunities\n- Failing to communicate assessment criteria clearly to students and parents\n\nThe transition to CBA is a journey, not a destination. Give yourself grace as you learn and iterate.`,
    author: 'NONEAA Team',
    category: 'Teaching',
    coverImage: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=800&auto=format',
    publishedAt: '2025-03-05T11:15:00Z',
    tags: ['Assessment', 'CBC', 'Teaching', 'Competency'],
  },
  {
    id: '5',
    title: 'NONEAA Platform Update: New Analytics Dashboard',
    excerpt: 'We\'ve launched powerful new analytics features to help schools make data-driven decisions faster.',
    content: `We're excited to announce the release of our new Analytics Dashboard—a major upgrade to how schools visualize and act on their data.\n\n**What's New**\n\n*Real-Time Performance Metrics*: See school-wide competency averages, attendance rates, and fee collection status at a glance with beautiful, interactive charts.\n\n*Subject-Wise Breakdown*: Drill into performance by subject, strand, or sub-strand to identify areas that need attention across your school.\n\n*Trend Analysis*: Compare performance across terms to track improvement and spot concerning patterns early.\n\n*Custom Reports*: Generate tailored reports for board meetings, parent conferences, or ministry compliance—all with a few clicks.\n\n*Export Capabilities*: Download charts and data in PDF, Excel, or image formats for sharing and archiving.\n\n**Why Data Matters**\n\nSchools using data-driven approaches see measurable improvements:\n- 15% improvement in student outcomes within the first year\n- 40% reduction in administrative time spent on reports\n- 90% parent satisfaction with transparency\n\n**Getting Started**\n\nThe new Analytics Dashboard is available to all NONEAA schools at no additional cost. Log in to your admin panel to explore the new features.\n\nAs always, our support team is available to help you make the most of these new tools. Reach out via the in-app chat or email support@noneaa.com.`,
    author: 'NONEAA Team',
    category: 'Product Updates',
    coverImage: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&auto=format',
    publishedAt: '2025-04-01T08:00:00Z',
    tags: ['Product', 'Analytics', 'Update', 'Dashboard'],
  },
];

export function BlogProvider({ children }: { children: React.ReactNode }) {
  const [posts, setPosts] = useState<BlogPost[]>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : defaultPosts;
  });

  const [isOwnerAuthenticated, setIsOwnerAuthenticated] = useState(() => {
    return sessionStorage.getItem(AUTH_KEY) === 'true';
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(posts));
  }, [posts]);

  const ownerLogin = (password: string): boolean => {
    if (password === OWNER_PASSWORD) {
      setIsOwnerAuthenticated(true);
      sessionStorage.setItem(AUTH_KEY, 'true');
      return true;
    }
    return false;
  };

  const ownerLogout = () => {
    setIsOwnerAuthenticated(false);
    sessionStorage.removeItem(AUTH_KEY);
  };

  const addPost = (post: Omit<BlogPost, 'id' | 'publishedAt'>) => {
    const newPost: BlogPost = {
      ...post,
      id: Date.now().toString(),
      publishedAt: new Date().toISOString(),
    };
    setPosts((prev) => [newPost, ...prev]);
  };

  const deletePost = (id: string) => {
    setPosts((prev) => prev.filter((p) => p.id !== id));
  };

  const updatePost = (id: string, updates: Partial<BlogPost>) => {
    setPosts((prev) => prev.map((p) => (p.id === id ? { ...p, ...updates } : p)));
  };

  return (
    <BlogContext.Provider value={{ posts, isOwnerAuthenticated, ownerLogin, ownerLogout, addPost, deletePost, updatePost }}>
      {children}
    </BlogContext.Provider>
  );
}

export function useBlog() {
  const context = useContext(BlogContext);
  if (!context) throw new Error('useBlog must be used within BlogProvider');
  return context;
}
